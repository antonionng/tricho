import { describe, expect, it } from "vitest";
import { currencyForLanguage, money } from "./useCurrency";

describe("currencyForLanguage", () => {
  it("defaults Irish and European browsers to euro", () => {
    for (const tag of ["en-IE", "ga", "ga-IE", "fr", "fr-FR", "de-DE", "es", "it-IT", "nl", "pt-PT", "fi"]) {
      expect(currencyForLanguage(tag)).toBe("eur");
    }
  });

  it("keeps pounds for the UK and everyone else", () => {
    for (const tag of ["en-GB", "en", "en-US", "cy-GB", "pl", "", undefined, null]) {
      expect(currencyForLanguage(tag)).toBe("gbp");
    }
  });

  it("prefers the region over the language", () => {
    expect(currencyForLanguage("en-DE")).toBe("eur");
    expect(currencyForLanguage("fr-GB")).toBe("gbp");
  });
});

describe("money", () => {
  it("formats whole amounts with a symbol and separators", () => {
    expect(money("gbp", 3500)).toBe("£3,500");
    expect(money("eur", 115)).toBe("€115");
  });
});
