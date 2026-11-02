import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, stripeMock } = vi.hoisted(() => ({
  db: { user: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() } },
  stripeMock: { customers: { list: vi.fn() }, subscriptions: { list: vi.fn() } },
}));

vi.mock("next/cache", () => ({ unstable_cache: (fn: () => unknown) => fn }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/stripe", () => ({ stripe: stripeMock }));
vi.mock("@/config/subscriptions", () => ({
  isPremiumSubscription: () => false,
  tierById: (id: string) => ({ id, grantsRole: id === "community" ? "individual" : "trichologist" }),
  tierByPriceId: (price: string | null) =>
    price === "price_community" ? { id: "community", grantsRole: "individual" } : undefined,
}));

import { findStripeMembership, syncMembershipFromStripe } from "./stripe-sync";

const end = Math.floor(new Date("2026-11-21T00:00:00Z").getTime() / 1000);
const sub = (id: string, status: string, price: string, extra: Record<string, unknown> = {}) => ({
  id,
  status,
  metadata: { founding: "1" },
  items: { data: [{ price: { id: price }, current_period_end: end }] },
  ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  // One paying customer and one empty customer with the same email, as a second checkout attempt leaves.
  stripeMock.customers.list.mockResolvedValue({ data: [{ id: "cus_paid" }, { id: "cus_empty" }] });
  stripeMock.subscriptions.list.mockImplementation(async ({ customer }: { customer: string }) => ({
    data: customer === "cus_paid" ? [sub("sub_1", "active", "price_community")] : [],
  }));
});

describe("findStripeMembership", () => {
  it("finds the live membership on whichever customer holds it", async () => {
    const m = await findStripeMembership("Member@Example.com");
    expect(stripeMock.customers.list).toHaveBeenCalledWith({ email: "member@example.com", limit: 10 });
    expect(m).toMatchObject({ customerId: "cus_paid", subscriptionId: "sub_1", planId: "community", founding: true });
    expect(m?.periodEnd?.toISOString()).toBe("2026-11-21T00:00:00.000Z");
  });

  it("ignores cancelled subscriptions and prices that are not membership", async () => {
    stripeMock.subscriptions.list.mockResolvedValue({
      data: [sub("sub_old", "canceled", "price_community"), sub("sub_other", "active", "price_partner_offer")],
    });
    expect(await findStripeMembership("member@example.com")).toBeNull();
  });
});

describe("syncMembershipFromStripe", () => {
  it("writes a membership the webhook missed onto the account, replacing an empty customer", async () => {
    db.user.findUnique.mockResolvedValue({ id: "u1", role: "individual", stripeSubscriptionId: null, stripeCurrentPeriodEnd: null });
    expect(await syncMembershipFromStripe("member@example.com", { fresh: true })).toBe(true);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: expect.objectContaining({
        stripeCustomerId: "cus_paid",
        stripeSubscriptionId: "sub_1",
        stripePriceId: "price_community",
        plan: "community",
        isFounding: true,
        role: "individual",
      }),
    });
  });

  it("does nothing when the account already shows the subscription", async () => {
    db.user.findUnique.mockResolvedValue({
      id: "u1",
      role: "individual",
      stripeSubscriptionId: "sub_1",
      stripeCurrentPeriodEnd: new Date(end * 1000),
    });
    expect(await syncMembershipFromStripe("member@example.com", { fresh: true })).toBe(false);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("never demotes an admin and never throws", async () => {
    db.user.findUnique.mockResolvedValue({ id: "u1", role: "admin", stripeSubscriptionId: null, stripeCurrentPeriodEnd: null });
    await syncMembershipFromStripe("member@example.com", { fresh: true });
    expect(db.user.update.mock.calls[0][0].data.role).toBeUndefined();

    stripeMock.customers.list.mockRejectedValue(new Error("Stripe is down"));
    expect(await syncMembershipFromStripe("member@example.com", { fresh: true })).toBe(false);
  });
});
