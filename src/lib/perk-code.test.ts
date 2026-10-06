import { describe, expect, it } from "vitest";
import { perkCode } from "./perk-code";

describe("perkCode", () => {
  it("finds a code written after 'code'", () => {
    expect(perkCode("Use code TRICHO15 at checkout for 15% off.")).toBe("TRICHO15");
    expect(perkCode("Discount code: SCALP-20")).toBe("SCALP-20");
    expect(perkCode('Enter the promo code "WELCOME10" when you order.')).toBe("WELCOME10");
    expect(perkCode("Voucher MEMBERS2026 gives a free trial.")).toBe("MEMBERS2026");
  });

  it("ignores ordinary words and perks without a code", () => {
    expect(perkCode("Members receive 10% off their first consultation.")).toBeNull();
    expect(perkCode("Ask for the code at checkout.")).toBeNull();
    expect(perkCode("A code of practice applies.")).toBeNull();
    expect(perkCode(null)).toBeNull();
  });
});
