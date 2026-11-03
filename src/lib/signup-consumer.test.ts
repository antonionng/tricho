import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  pendingSignup: { findUnique: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn() },
  user: { update: vi.fn(), findUnique: vi.fn() },
  trichologistProfile: { upsert: vi.fn() },
  consumerProfile: { findUnique: vi.fn(), create: vi.fn() },
  directoryListing: { findFirst: vi.fn(), update: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/storage", () => ({ urlForFile: vi.fn() }));
vi.mock("@/lib/directory", () => ({ hasFullProfile: vi.fn() }));

import { applyPendingSignup, consumerSignupFromForm, cleanFirstName } from "./signup-details";
import { consumerPublicName, makeConsumer } from "./consumer";
import { syncListingFromProfile } from "./profile";

const pending = (over: Record<string, unknown> = {}) => ({
  email: "c@example.com",
  name: "Aoife",
  phone: null,
  profession: null,
  practiceName: null,
  city: null,
  country: null,
  heardFrom: null,
  accountType: "consumer",
  marketing: false,
  createdAt: new Date(),
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  db.consumerProfile.findUnique.mockResolvedValue(null);
  db.consumerProfile.create.mockImplementation(async ({ data }) => ({ id: "cp1", displayMode: "alias", ...data }));
});

describe("applyPendingSignup for a consumer", () => {
  it("creates a consumer profile and never a professional profile", async () => {
    db.pendingSignup.findUnique.mockResolvedValue(pending());
    const r = await applyPendingSignup({ id: "u1", email: "c@example.com", name: null });
    expect(r).toMatchObject({ accountType: "consumer", name: "Aoife", fromForm: true });
    expect(db.trichologistProfile.upsert).not.toHaveBeenCalled();
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { accountType: "consumer", name: "Aoife", emailUpdates: false },
    });
    const created = db.consumerProfile.create.mock.calls[0][0].data;
    expect(created.userId).toBe("u1");
    expect(created.alias).toMatch(/^[A-Z][a-z]+-\d{3}$/);
    expect(created.alias.toLowerCase()).not.toContain("aoife");
    expect(created.marketingConsentAt).toBeNull();
  });

  it("records marketing consent only when they ticked the box", async () => {
    db.pendingSignup.findUnique.mockResolvedValue(pending({ marketing: true }));
    await applyPendingSignup({ id: "u1", email: "c@example.com", name: null });
    expect(db.user.update.mock.calls[0][0].data.emailUpdates).toBe(true);
    expect(db.consumerProfile.create.mock.calls[0][0].data.marketingConsentAt).toBeInstanceOf(Date);
  });

  it("makes a Google sign-up a consumer only from this browser's choice, not someone's typed form", async () => {
    db.pendingSignup.findUnique.mockResolvedValue(pending());
    const r = await applyPendingSignup({ id: "u1", email: "c@example.com", name: "Aoife Byrne" });
    expect(r.accountType).toBe("professional");
    expect(db.consumerProfile.create).not.toHaveBeenCalled();

    db.pendingSignup.findUnique.mockResolvedValue(null);
    const g = await applyPendingSignup({ id: "u2", email: "g@example.com", name: "Aoife Byrne" }, { accountType: "consumer" });
    expect(g).toMatchObject({ accountType: "consumer", name: "Aoife Byrne", fromForm: false });
    expect(db.user.update.mock.calls[0][0].data).toEqual({ accountType: "consumer", emailUpdates: false });
    expect(db.trichologistProfile.upsert).not.toHaveBeenCalled();
  });

  it("still gives a professional sign-up its professional profile", async () => {
    db.pendingSignup.findUnique.mockResolvedValue(pending({ accountType: "professional", name: "Niamh Walsh", profession: "clinical", city: "Galway", country: "Ireland" }));
    const r = await applyPendingSignup({ id: "u3", email: "c@example.com", name: null });
    expect(r.accountType).toBe("professional");
    expect(db.trichologistProfile.upsert).toHaveBeenCalled();
    expect(db.consumerProfile.create).not.toHaveBeenCalled();
  });
});

describe("makeConsumer", () => {
  it("tries another alias when one is taken", async () => {
    const { Prisma } = await import("@prisma/client");
    const taken = new Prisma.PrismaClientKnownRequestError("taken", { code: "P2002", clientVersion: "x" });
    db.consumerProfile.create.mockRejectedValueOnce(taken).mockImplementationOnce(async ({ data }) => ({ id: "cp", ...data }));
    const profile = await makeConsumer("u1");
    expect(db.consumerProfile.create).toHaveBeenCalledTimes(2);
    expect(profile.userId).toBe("u1");
  });
});

describe("syncListingFromProfile", () => {
  it("never links or updates a listing for a consumer, even with the same email", async () => {
    db.user.findUnique.mockResolvedValue({ name: "Aoife", email: "c@example.com", profile: null, accountType: "consumer" });
    expect(await syncListingFromProfile("u1", { full: true })).toBeNull();
    expect(db.directoryListing.findFirst).not.toHaveBeenCalled();
    expect(db.directoryListing.update).not.toHaveBeenCalled();
  });
});

describe("the consumer sign-up form", () => {
  const form = (v: Record<string, string>) => {
    const f = new FormData();
    for (const [k, val] of Object.entries(v)) f.set(k, val);
    return f;
  };

  it("needs no name, and marketing is off unless ticked", () => {
    expect(consumerSignupFromForm(form({}))).toEqual({ ok: true, details: { name: "", marketing: false } });
    expect(consumerSignupFromForm(form({ firstName: " Aoife ", marketing: "on" }))).toEqual({ ok: true, details: { name: "Aoife", marketing: true } });
  });

  it("takes a first name in letters only", () => {
    expect(cleanFirstName("Siobhán")).toBe("Siobhán");
    expect(cleanFirstName("Mary-Kate")).toBe("Mary-Kate");
    expect(cleanFirstName("O'Neill")).toBe("O'Neill");
    expect(cleanFirstName("bob@example.com")).toBeNull();
    expect(consumerSignupFromForm(form({ firstName: "http://spam" })).ok).toBe(false);
  });
});

describe("consumerPublicName", () => {
  it("shows the alias unless they chose their first name", () => {
    expect(consumerPublicName({ displayMode: "alias", alias: "Willow-428" }, { name: "Aoife Byrne" })).toBe("Willow-428");
    expect(consumerPublicName({ displayMode: "name", alias: "Willow-428" }, { name: "Aoife Byrne" })).toBe("Aoife");
    expect(consumerPublicName({ displayMode: "name", alias: "Willow-428" }, { name: null })).toBe("Willow-428");
  });
});
