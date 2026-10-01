import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { premiumBusiness, priceIdFor, subscriptionTiers, tierById, tierByPriceId } from "@/config/subscriptions";
import { partnerCapError, safeHttpUrl, sortPartners } from "./partners";

describe("Premium Business can never be sold through checkout", () => {
  it("has no Stripe price of any kind", () => {
    const keys = Object.keys(premiumBusiness).filter((k) => /stripe|price.?id/i.test(k));
    expect(keys).toEqual([]);
  });

  it("is not a checkout tier", () => {
    expect(tierById("premium")).toBeUndefined();
    expect(tierById(premiumBusiness.id)).toBeUndefined();
    expect(subscriptionTiers.map((t) => t.id)).not.toContain("premium");
  });

  it("no checkout price resolves to a premium plan", () => {
    for (const t of subscriptionTiers) {
      for (const interval of ["month", "year"] as const) {
        for (const founding of [true, false]) {
          const id = priceIdFor(t, interval, founding);
          if (id) expect(tierByPriceId(id)?.id).not.toBe("premium");
        }
      }
    }
  });
});

function fakeTx(counts: { category?: number; founding?: number }) {
  const count = vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
    "published" in where ? (counts.category ?? 0) : (counts.founding ?? 0)
  );
  return { tx: { partner: { count } } as never, count };
}

describe("partnerCapError", () => {
  const base = { tier: "premium", category: "Devices and diagnostics", published: true, isFounding: false };

  it("allows a second premium partner in a category", async () => {
    const { tx } = fakeTx({ category: 1 });
    expect(await partnerCapError(tx, base)).toBeNull();
  });

  it("refuses a third published premium partner in a category", async () => {
    const { tx } = fakeTx({ category: 2 });
    expect(await partnerCapError(tx, base)).toMatch(/already has 2 published Premium partners/);
  });

  it("lets a full category's partner be saved unpublished", async () => {
    const { tx } = fakeTx({ category: 2 });
    expect(await partnerCapError(tx, { ...base, published: false })).toBeNull();
  });

  it("refuses a seventh founding premium partner", async () => {
    const { tx } = fakeTx({ founding: 6 });
    expect(await partnerCapError(tx, { ...base, isFounding: true })).toMatch(/founding Premium places are taken/);
  });

  it("excludes the partner being edited from the counts", async () => {
    const { tx, count } = fakeTx({ category: 1 });
    await partnerCapError(tx, { ...base, id: "p1" });
    expect(count.mock.calls[0][0].where).toMatchObject({ id: { not: "p1" } });
  });

  it("never limits Business partners", async () => {
    const { tx, count } = fakeTx({ category: 9, founding: 9 });
    expect(await partnerCapError(tx, { ...base, tier: "business", isFounding: true })).toBeNull();
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
