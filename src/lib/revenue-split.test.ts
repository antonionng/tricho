import { describe, expect, it } from "vitest";
import { reversalFor, splitSale, totals } from "./revenue-split";

describe("splitSale", () => {
  it("gives the educator 70% of a £79 course", () => {
    expect(splitSale(7900, 70)).toEqual({ gross: 7900, sharePct: 70, educatorAmount: 5530, platformAmount: 2370 });
  });
  it("rounds the educator's share down so the parts always add up", () => {
    for (const gross of [1, 99, 3333, 4999, 12345]) {
      for (const pct of [0, 33, 70, 85, 100]) {
        const s = splitSale(gross, pct);
        expect(s.educatorAmount + s.platformAmount).toBe(gross);
        expect(s.educatorAmount).toBeLessThanOrEqual((gross * pct) / 100);
      }
    }
  });
  it("clamps nonsense", () => {
    expect(splitSale(-5, 150)).toEqual({ gross: 0, sharePct: 100, educatorAmount: 0, platformAmount: 0 });
  });
});

describe("reversalFor", () => {
  const sale = { gross: 7900, educatorAmount: 5530, reversedAmount: 0 };
  it("takes back everything on a full refund", () => {
    expect(reversalFor(sale, 7900)).toBe(5530);
  });
  it("takes back the same proportion on a partial refund", () => {
    expect(reversalFor(sale, 3950)).toBe(2765);
  });
  it("never takes back twice", () => {
    expect(reversalFor({ ...sale, reversedAmount: 2765 }, 3950)).toBe(0);
    expect(reversalFor({ ...sale, reversedAmount: 2765 }, 7900)).toBe(2765);
  });
  it("takes nothing back from Trichollective's own courses", () => {
    expect(reversalFor({ gross: 4900, educatorAmount: 0, reversedAmount: 0 }, 4900)).toBe(0);
  });
});

describe("totals", () => {
  it("works out what Trichollective keeps after fees and refunds", () => {
    const t = totals([
      { gross: 7900, educatorAmount: 5530, platformAmount: 2370, stripeFee: 140, refundedAmount: 0, reversedAmount: 0 },
      { gross: 7900, educatorAmount: 5530, platformAmount: 2370, stripeFee: 140, refundedAmount: 7900, reversedAmount: 5530 },
    ]);
    expect(t).toMatchObject({ sales: 2, gross: 15800, educator: 5530, platform: 4740, stripeFees: 280, refunded: 7900, reversed: 5530 });
    expect(t.net).toBe(4740 - 280 - (7900 - 5530));
  });
});
