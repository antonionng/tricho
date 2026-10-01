import { beforeEach, describe, expect, it, vi } from "vitest";

describe("subscription tiers", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.STRIPE_PRICE_ID_COMMUNITY = "price_comm";
    process.env.STRIPE_PRICE_ID_PROFESSIONAL = "price_pro";
    process.env.STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL = "price_pro_year";
    process.env.STRIPE_PRICE_ID_PROFESSIONAL_FOUNDING = "price_pro_founding";
    process.env.STRIPE_PRICE_ID_MEMBER = "price_legacy_member";
    process.env.STRIPE_PRICE_ID_BUSINESS_LUXURY = "price_legacy_luxury";
  });

  it("maps every current price back to its plan", async () => {
    const { tierByPriceId } = await import("./subscriptions");
    expect(tierByPriceId("price_comm")?.id).toBe("community");
    expect(tierByPriceId("price_pro")?.id).toBe("professional");
    expect(tierByPriceId("price_pro_year")?.id).toBe("professional");
    expect(tierByPriceId("price_pro_founding")?.id).toBe("professional");
  });

  it("keeps existing subscribers on legacy prices", async () => {
    const { tierByPriceId } = await import("./subscriptions");
    expect(tierByPriceId("price_legacy_member")?.id).toBe("professional");
    expect(tierByPriceId("price_legacy_luxury")?.id).toBe("business");
  });

  it("returns nothing for unknown or missing prices", async () => {
    const { tierByPriceId } = await import("./subscriptions");
    expect(tierByPriceId("price_unknown")).toBeUndefined();
    expect(tierByPriceId(null)).toBeUndefined();
  });

  it("picks founding, annual or monthly prices correctly", async () => {
    const { priceIdFor, tierById } = await import("./subscriptions");
    const pro = tierById("professional")!;
    expect(priceIdFor(pro, "month", true)).toBe("price_pro_founding");
    expect(priceIdFor(pro, "year", false)).toBe("price_pro_year");
    expect(priceIdFor(pro, "month", false)).toBe("price_pro");
  });

  it("offers founding prices below the standard price", async () => {
    const { subscriptionTiers } = await import("./subscriptions");
    for (const t of subscriptionTiers) {
      if (t.foundingPrice) expect(t.foundingPrice).toBeLessThan(t.price);
      expect(t.annualPrice).toBe(t.price * 10);
    }
  });
});
