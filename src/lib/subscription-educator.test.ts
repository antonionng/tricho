import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  educatorProfile: { findFirst: vi.fn() },
  partner: { findFirst: vi.fn() },
  businessSeat: { findFirst: vi.fn(), findMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { EDUCATOR, getMembershipByEmail } from "./subscription";

const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

describe("membership through the Educator membership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.user.findUnique.mockResolvedValue({ stripePriceId: null, stripeCurrentPeriodEnd: null, compPlan: null, compUntil: null });
    db.partner.findFirst.mockResolvedValue(null);
    db.businessSeat.findFirst.mockResolvedValue(null);
    db.businessSeat.findMany.mockResolvedValue([]);
  });

  it("gives a paid-up educator Professional, even before approval", async () => {
    db.educatorProfile.findFirst.mockResolvedValue({ status: "pending_review", currentPeriodEnd: nextYear });
    const m = await getMembershipByEmail("edu@example.test");
    expect(m).toMatchObject({ isActive: true, tierId: "professional", via: EDUCATOR });
  });

  it("gives nothing to a rejected educator", async () => {
    db.educatorProfile.findFirst.mockResolvedValue({ status: "rejected", currentPeriodEnd: nextYear });
    const m = await getMembershipByEmail("edu@example.test");
    expect(m.via).not.toBe(EDUCATOR);
  });

  it("never locks a member out if the educator lookup fails", async () => {
    db.educatorProfile.findFirst.mockRejectedValue(new Error("no table"));
    await expect(getMembershipByEmail("edu@example.test")).resolves.toBeTruthy();
  });
});
