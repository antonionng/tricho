import { afterEach, describe, expect, it, vi } from "vitest";
import { lineTotal, priceText, resetVatCache, sellerVatLine, ukVatTaxRateId, vatOn } from "./vat";

describe("VAT on top", () => {
  it("charges £150 for a £125 ticket before VAT", () => {
    expect(lineTotal(12500, 1, true)).toEqual({ net: 12500, vat: 2500, gross: 15000 });
  });
  it("works out the VAT on the whole line, as Stripe does", () => {
    expect(lineTotal(12500, 3, true)).toEqual({ net: 37500, vat: 7500, gross: 45000 });
    expect(lineTotal(11250, 1, true)).toEqual({ net: 11250, vat: 2250, gross: 13500 });
    expect(lineTotal(10000, 5, true).gross).toBe(60000);
    expect(lineTotal(75000, 1, true).gross).toBe(90000);
    expect(vatOn(333)).toBe(67);
  });
  it("adds nothing when prices include VAT", () => {
    expect(lineTotal(12500, 2, false)).toEqual({ net: 25000, vat: 0, gross: 25000 });
  });
  it("shows prices before VAT as + VAT", () => {
    expect(priceText(12500, true)).toBe("£125 + VAT");
    expect(priceText(11250, true)).toBe("£112.50 + VAT");
    expect(priceText(100000, false)).toBe("£1,000");
  });
});

describe("our VAT number", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("is left off invoices until it is set", () => {
    vi.stubEnv("TRICHOLLECTIVE_VAT_NUMBER", "");
    expect(sellerVatLine()).toBeNull();
    vi.stubEnv("TRICHOLLECTIVE_VAT_NUMBER", "GB 123 4567 89");
    expect(sellerVatLine()).toBe("Trichollective VAT number: GB 123 4567 89");
  });
});

describe("ukVatTaxRateId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetVatCache();
  });
  const stripe = (data: unknown[]) => ({
    taxRates: { list: vi.fn().mockResolvedValue({ data }), create: vi.fn().mockResolvedValue({ id: "txr_new" }) },
  });

  it("uses STRIPE_TAX_RATE_UK_VAT when set", async () => {
    vi.stubEnv("STRIPE_TAX_RATE_UK_VAT", "txr_env");
    const s = stripe([]);
    expect(await ukVatTaxRateId(s as never)).toBe("txr_env");
    expect(s.taxRates.list).not.toHaveBeenCalled();
  });

  it("finds a matching 20% UK VAT rate added on top", async () => {
    vi.stubEnv("STRIPE_TAX_RATE_UK_VAT", "");
    const s = stripe([
      { id: "txr_ie", percentage: 23, country: "IE", display_name: "VAT" },
      { id: "txr_gb", percentage: 20, country: "GB", display_name: "VAT" },
    ]);
    expect(await ukVatTaxRateId(s as never)).toBe("txr_gb");
    expect(s.taxRates.list).toHaveBeenCalledWith({ active: true, inclusive: false, limit: 100 });
    expect(s.taxRates.create).not.toHaveBeenCalled();
  });

  it("creates one when there is none, never with automatic tax", async () => {
    vi.stubEnv("STRIPE_TAX_RATE_UK_VAT", "");
    const s = stripe([]);
    expect(await ukVatTaxRateId(s as never)).toBe("txr_new");
    expect(s.taxRates.create).toHaveBeenCalledWith(expect.objectContaining({ display_name: "VAT", percentage: 20, inclusive: false, country: "GB" }));
    // Remembered for the next checkout.
    expect(await ukVatTaxRateId(s as never)).toBe("txr_new");
    expect(s.taxRates.create).toHaveBeenCalledTimes(1);
  });
});
