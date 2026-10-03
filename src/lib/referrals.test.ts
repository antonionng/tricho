import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, stripeMock, deliverOnce } = vi.hoisted(() => ({
  db: {
    referralReward: { findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn() },
  },
  stripeMock: {
    customers: { retrieve: vi.fn(), createBalanceTransaction: vi.fn() },
    coupons: { retrieve: vi.fn(), create: vi.fn() },
  },
  deliverOnce: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/stripe", () => ({ stripe: stripeMock }));
vi.mock("@/lib/mail/send", () => ({ deliverOnce: (...a: unknown[]) => deliverOnce(...a) }));

import {
  creditReward,
  ensureReferralCoupon,
  halfMonthDiscount,
  isSelfReferral,
  makeReferralCode,
  monthlyPriceMinor,
  normaliseCode,
  rewardAmountFor,
  shareMessage,
  sumByCurrency,
} from "./referrals";

describe("makeReferralCode", () => {
  it("uses up to eight letters of the first name and a three-character suffix", () => {
    const code = makeReferralCode("Aoife Kelly");
    expect(code).toMatch(/^AOIFE-[2-9A-HJKMNP-Z]{3}$/);
    expect(makeReferralCode("Maximiliana Smith")).toMatch(/^MAXIMILI-/);
  });

  it("drops accents and punctuation", () => {
    expect(makeReferralCode("Seán O'Neill")).toMatch(/^SEAN-/);
    expect(makeReferralCode("Dr. Siobhán Walsh")).toMatch(/^SIOBHAN-/);
  });

  it("falls back when there is no usable name", () => {
    expect(makeReferralCode(null)).toMatch(/^MEMBER-/);
    expect(makeReferralCode("李")).toMatch(/^MEMBER-/);
  });

  it("never uses ambiguous characters in the suffix", () => {
    for (let i = 0; i < 200; i++) expect(makeReferralCode("Ann").split("-")[1]).not.toMatch(/[01OIL]/);
  });

  it("produces a code that normalises to itself", () => {
    const code = makeReferralCode("Niamh", () => 0.5);
    expect(normaliseCode(code)).toBe(code);
  });
});

describe("normaliseCode", () => {
  it("tidies case and spaces", () => {
    expect(normaliseCode(" aoife-7k2 ")).toBe("AOIFE-7K2");
  });
  it("rejects anything that is not a code", () => {
    expect(normaliseCode("")).toBeNull();
    expect(normaliseCode("hello")).toBeNull();
    expect(normaliseCode(42)).toBeNull();
    expect(normaliseCode("a@b.com")).toBeNull();
  });
});

describe("prices", () => {
  it("gives one month at the member's own price", () => {
    expect(monthlyPriceMinor("professional", false, "gbp")).toBe(1900);
    expect(monthlyPriceMinor("professional", true, "gbp")).toBe(1400);
    expect(monthlyPriceMinor("professional", true, "eur")).toBe(1600);
    expect(monthlyPriceMinor("business", true, "gbp")).toBe(9900);
    expect(monthlyPriceMinor(null, false, "gbp")).toBeNull();
  });

  it("rewards the referrer with their own month, in their currency", () => {
    expect(rewardAmountFor({ plan: "community", isFounding: true, currency: "eur" })).toEqual({ amount: 700, currency: "eur" });
    expect(rewardAmountFor({ plan: "community", isFounding: false, currency: null })).toEqual({ amount: 900, currency: "gbp" });
    expect(rewardAmountFor({ plan: null, isFounding: false })).toBeNull();
  });

  it("takes half of one month off the new member's first invoice", () => {
    expect(halfMonthDiscount("professional", true, "gbp")).toBe(700);
    expect(halfMonthDiscount("community", false, "eur")).toBe(500);
  });

  it("adds up rewards per currency", () => {
    expect(sumByCurrency([])).toBe("£0.00");
    expect(sumByCurrency([{ amount: 1400, currency: "gbp" }, { amount: 900, currency: "gbp" }])).toBe("£23.00");
    expect(sumByCurrency([{ amount: 1400, currency: "gbp" }, { amount: 1600, currency: "eur" }])).toBe("£14.00 and €16.00");
  });
});

describe("isSelfReferral", () => {
  const referrer = { id: "u1", email: "aoife@example.com", stripeCustomerId: "cus_1" };
  it("catches the same account, email or Stripe customer", () => {
    expect(isSelfReferral(referrer, { id: "u1" })).toBe(true);
    expect(isSelfReferral(referrer, { email: "AOIFE@example.com" })).toBe(true);
    expect(isSelfReferral(referrer, { stripeCustomerId: "cus_1" })).toBe(true);
  });
  it("allows a different person", () => {
    expect(isSelfReferral(referrer, { id: "u2", email: "niamh@example.com", stripeCustomerId: "cus_2" })).toBe(false);
    expect(isSelfReferral({ id: "u1", email: null, stripeCustomerId: null }, { id: null, email: null, stripeCustomerId: null })).toBe(false);
  });
});

describe("shareMessage", () => {
  it("contains the link and no personal details", () => {
    const m = shareMessage("AOIFE-7K2");
    expect(m).toContain("/r/AOIFE-7K2");
    expect(m).not.toMatch(/@/);
  });
});

describe("ensureReferralCoupon", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reuses an existing coupon", async () => {
    stripeMock.coupons.retrieve.mockResolvedValue({ id: "ref-half-professional-gbp-700", valid: true });
    await expect(ensureReferralCoupon("professional", "gbp", 700)).resolves.toBe("ref-half-professional-gbp-700");
    expect(stripeMock.coupons.create).not.toHaveBeenCalled();
  });

  it("creates a once-only amount-off coupon when missing", async () => {
    stripeMock.coupons.retrieve.mockRejectedValue(Object.assign(new Error("No such coupon"), { code: "resource_missing" }));
    stripeMock.coupons.create.mockResolvedValue({ id: "ref-half-community-eur-500" });
    await ensureReferralCoupon("community", "eur", 500);
    expect(stripeMock.coupons.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ref-half-community-eur-500", amount_off: 500, currency: "eur", duration: "once" })
    );
  });
});

describe("creditReward", () => {
  beforeEach(() => vi.clearAllMocks());

  const future = new Date(Date.now() + 86400000 * 20);
  const reward = (over: Record<string, unknown> = {}) => ({
    id: "r1",
    code: "AOIFE-7K2",
    status: "banked",
    stripeBalanceTxnId: null,
    referredId: "u2",
    referrer: {
      id: "u1",
      plan: "professional",
      isFounding: true,
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
      stripeCurrentPeriodEnd: future,
    },
    ...over,
  });

  it("credits one month of the referrer's own price in the customer's currency, once", async () => {
    db.referralReward.findUnique.mockResolvedValueOnce(reward()).mockResolvedValue({
      id: "r1",
      amount: 1600,
      currency: "eur",
      referrer: { email: "aoife@example.com", name: "Aoife Kelly" },
      referred: { name: "Niamh Byrne" },
    });
    db.user.findUnique.mockResolvedValue({ name: "Niamh Byrne" });
    stripeMock.customers.retrieve.mockResolvedValue({ id: "cus_1", currency: "eur" });
    stripeMock.customers.createBalanceTransaction.mockResolvedValue({ id: "cbtxn_1" });
    db.referralReward.updateMany.mockResolvedValue({ count: 1 });

    const result = await creditReward("r1");
    expect(result).toEqual({ status: "credited", amount: 1600, currency: "eur" });
    expect(stripeMock.customers.createBalanceTransaction).toHaveBeenCalledWith(
      "cus_1",
      expect.objectContaining({ amount: -1600, currency: "eur", description: "Referral reward: one month free for inviting Niamh" }),
      { idempotencyKey: "referral-reward-r1" }
    );
    expect(deliverOnce).toHaveBeenCalledWith("referral:r1:credited", "aoife@example.com", expect.any(String), expect.any(Object), expect.any(Object));
  });

  it("keeps the reward banked when the referrer is not paying", async () => {
    db.referralReward.findUnique.mockResolvedValue(
      reward({ referrer: { id: "u1", plan: null, isFounding: false, stripeCustomerId: null, stripeSubscriptionId: null, stripeCurrentPeriodEnd: null } })
    );
    const result = await creditReward("r1");
    expect(result.status).toBe("banked");
    expect(stripeMock.customers.createBalanceTransaction).not.toHaveBeenCalled();
  });

  it("never credits a reward that already has a transaction", async () => {
    db.referralReward.findUnique.mockResolvedValue(reward({ status: "credited", stripeBalanceTxnId: "cbtxn_1" }));
    const result = await creditReward("r1");
    expect(result.status).toBe("skipped");
    expect(stripeMock.customers.createBalanceTransaction).not.toHaveBeenCalled();
  });
});
