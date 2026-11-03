import { beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ current: null as unknown }));
const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn(() => Promise.resolve()) },
}));
const subscription = vi.hoisted(() => ({ getMembershipByEmail: vi.fn() }));

vi.mock("@/auth", () => ({ auth: vi.fn(async () => session.current) }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/stripe-sync", () => ({ syncMembershipFromStripe: vi.fn(async () => false) }));
vi.mock("@/lib/subscription", () => ({
  canEnterConsultation: () => true,
  devMembershipUnlock: () => false,
  getMembershipByEmail: subscription.getMembershipByEmail,
  isProfessionalPlan: () => true,
}));

import { getMemberContext, professionalSession } from "./member";

const user = (over: Record<string, unknown> = {}) => ({
  plan: "professional",
  chapterId: null,
  onboardedAt: new Date(),
  role: "trichologist",
  staffRole: null,
  accessStatus: "active",
  accessReason: null,
  accessUntil: null,
  mutedUntil: null,
  lastSeenAt: new Date(),
  accountType: "professional",
  profile: { profession: "clinical" },
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  subscription.getMembershipByEmail.mockResolvedValue({ isActive: true, tierId: "professional" });
});

describe("getMemberContext", () => {
  it("lets a paying professional in", async () => {
    session.current = { user: { id: "u1", email: "p@example.com", accountType: "professional" } };
    db.user.findUnique.mockResolvedValue(user());
    const ctx = await getMemberContext();
    expect(ctx.allowed).toBe(true);
    expect(ctx.consumer).toBe(false);
    expect(ctx.session).not.toBeNull();
  });

  it("treats a consumer as signed out, without even looking up a membership", async () => {
    session.current = { user: { id: "u2", email: "c@example.com", accountType: "consumer" } };
    const ctx = await getMemberContext();
    expect(ctx).toMatchObject({ consumer: true, session: null, allowed: false, professional: false, consultation: false });
    expect(subscription.getMembershipByEmail).not.toHaveBeenCalled();
  });

  it("checks the database too, in case the token is behind", async () => {
    session.current = { user: { id: "u3", email: "c@example.com", accountType: "professional" } };
    db.user.findUnique.mockResolvedValue(user({ accountType: "consumer" }));
    const ctx = await getMemberContext();
    expect(ctx).toMatchObject({ consumer: true, session: null, allowed: false });
  });
});

describe("professionalSession", () => {
  it("returns null for a consumer, by token or by database", async () => {
    session.current = { user: { id: "u2", accountType: "consumer" } };
    expect(await professionalSession()).toBeNull();
    session.current = { user: { id: "u2", accountType: "professional" } };
    db.user.findUnique.mockResolvedValue({ accountType: "consumer" });
    expect(await professionalSession()).toBeNull();
  });

  it("returns the session for a professional", async () => {
    session.current = { user: { id: "u1", accountType: "professional" } };
    db.user.findUnique.mockResolvedValue({ accountType: "professional" });
    expect(await professionalSession()).toBe(session.current);
  });

  it("returns null when signed out", async () => {
    session.current = null;
    expect(await professionalSession()).toBeNull();
  });
});
