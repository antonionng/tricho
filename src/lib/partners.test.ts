import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

// The config reads price ids from the environment when it loads, so set them first.
process.env.STRIPE_PRICE_ID_PREMIUM = "price_premium";
process.env.STRIPE_PRICE_ID_PREMIUM_FOUNDING = "price_premium_founding";
const { isPremiumPriceId, premiumBusiness, premiumPriceIdFor, subscriptionTiers, tierById, tierByPriceId } = await import(
  "@/config/subscriptions"
);
const { categoryKey, PARTNER_CATEGORIES, partnerCapError, premiumCheckoutAnswers, premiumCheckoutFields, safeHttpUrl, sortPartners } =
  await import("./partners");

describe("Premium Business is sold online", () => {
  it("charges the founding price while founding places remain, then the standard price", () => {
    expect(premiumPriceIdFor(true)).toBe("price_premium_founding");
    expect(premiumPriceIdFor(false)).toBe("price_premium");
  });

  it("gives Premium buyers everything in Business", () => {
    expect(tierByPriceId("price_premium")?.id).toBe("business");
    expect(tierByPriceId("price_premium_founding")?.id).toBe("business");
    expect(isPremiumPriceId("price_premium")).toBe(true);
  });

  it("stays out of the individual plans and their prices", () => {
    expect(tierById(premiumBusiness.id)).toBeUndefined();
    expect(subscriptionTiers.map((t) => t.id)).not.toContain("premium");
    for (const t of subscriptionTiers) {
      for (const id of [t.stripePriceId, t.stripeAnnualPriceId, t.stripeFoundingPriceId, t.stripeFoundingAnnualPriceId]) {
        expect(isPremiumPriceId(id)).toBe(false);
      }
    }
  });
});

describe("Premium checkout fields", () => {
  it("uses dropdown keys Stripe accepts, one per category", () => {
    const dropdown = premiumCheckoutFields().find((f) => f.key === "category")!.dropdown!;
    const keys = dropdown.options.map((o) => o.value);
    expect(keys.every((k) => /^[a-z0-9]+$/.test(k))).toBe(true);
    expect(new Set(keys).size).toBe(PARTNER_CATEGORIES.length);
  });

  it("reads the brand's answers back", () => {
    const answers = premiumCheckoutAnswers([
      { key: "brand", text: { value: "  Follicle Labs " } },
      { key: "category", dropdown: { value: categoryKey("Devices and diagnostics") } },
      { key: "website", text: { value: "folliclelabs.com" } },
    ] as never);
    expect(answers).toEqual({ name: "Follicle Labs", category: "Devices and diagnostics", website: "https://folliclelabs.com/" });
  });

  it("copes with missing or unsafe answers", () => {
    const answers = premiumCheckoutAnswers([
      { key: "category", dropdown: { value: "nonsense" } },
      { key: "website", text: { value: "javascript:alert(1)" } },
    ] as never);
    expect(answers).toEqual({ name: "", category: "Something else", website: null });
  });
});

function fakeTx(founding: number) {
  const count = vi.fn(async () => founding);
  return { tx: { partner: { count } } as never, count };
}

describe("partnerCapError", () => {
  const base = { tier: "premium", isFounding: true };

  it("allows a sixth founding premium partner", async () => {
    const { tx } = fakeTx(5);
    expect(await partnerCapError(tx, base)).toBeNull();
  });

  it("refuses a seventh founding premium partner", async () => {
    const { tx } = fakeTx(6);
    expect(await partnerCapError(tx, base)).toMatch(/founding Premium places are taken/);
  });

  it("excludes the partner being edited from the count", async () => {
    const { tx, count } = fakeTx(1);
    await partnerCapError(tx, { ...base, id: "p1" });
    expect((count.mock.calls[0] as unknown as [{ where: object }])[0].where).toMatchObject({ id: { not: "p1" } });
  });

  it("never limits standard-price or Business partners", async () => {
    const { tx, count } = fakeTx(99);
    expect(await partnerCapError(tx, { ...base, isFounding: false })).toBeNull();
    expect(await partnerCapError(tx, { tier: "business", isFounding: true })).toBeNull();
    expect(count).not.toHaveBeenCalled();
  });
});

describe("partner helpers", () => {
  it("only allows http and https links", () => {
    expect(safeHttpUrl("https://example.com/logo.png")).toBe("https://example.com/logo.png");
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("not a url")).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
  });

  it("lists premium partners first, then featured, then by name", () => {
    const now = new Date("2026-09-30T12:00:00Z");
    const later = new Date("2026-12-31T00:00:00Z");
    const rows = [
      { name: "Birch", tier: "business", featuredUntil: later },
      { name: "Alder", tier: "business", featuredUntil: null },
      { name: "Cedar", tier: "premium", featuredUntil: null },
      { name: "Aspen", tier: "premium", featuredUntil: null },
    ];
    expect(sortPartners(rows, now).map((r) => r.name)).toEqual(["Aspen", "Cedar", "Birch", "Alder"]);
  });
});
