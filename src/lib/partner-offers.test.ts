import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { newOfferToken, offerPriceLabel, offerPriceNote, parseAcceptance, parseInclusions, parseOfferForm } = await import(
  "@/lib/partner-offers"
);
const { isPremiumSubscription } = await import("@/config/subscriptions");

const form = (values: Record<string, string>) => (k: string) => values[k] ?? null;

describe("partner offers", () => {
  it("makes long, unguessable link tokens", () => {
    const a = newOfferToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(newOfferToken()).not.toBe(a);
  });

  it("reads one benefit per line, without bullets or blank lines", () => {
    expect(parseInclusions("- One masterclass a month\n\n• Two spotlights\n3. A talk slot\n  ")).toEqual([
      "One masterclass a month",
      "Two spotlights",
      "A talk slot",
    ]);
  });

  it("describes the price and whether it is fixed", () => {
    expect(offerPriceLabel({ priceGBP: 1400, interval: "year" })).toBe("£1,400 a year");
    expect(offerPriceNote({ fixedPrice: true, isFounding: true })).toMatch(/founding partner price/);
  });

  const offer = {
    businessName: "Livdor",
    email: "Team@Livdor.com",
    priceGBP: "£1,400",
    inclusions: "- Everything in Business",
    category: "Haircare",
    website: "livdor.com",
    paymentUrl: "https://buy.stripe.com/abc",
    isFounding: "on",
    fixedPrice: "on",
  };

  it("accepts a complete offer", () => {
    const r = parseOfferForm(form(offer));
    expect(r.ok && r.value).toMatchObject({
      email: "team@livdor.com",
      priceGBP: 1400,
      interval: "year",
      isFounding: true,
      fixedPrice: true,
      website: "https://livdor.com/",
      inclusions: ["Everything in Business"],
    });
  });

  it("rejects an offer without a price or benefits", () => {
    expect(parseOfferForm(form({ ...offer, priceGBP: "free" })).ok).toBe(false);
    expect(parseOfferForm(form({ ...offer, inclusions: "\n" })).ok).toBe(false);
    expect(parseOfferForm(form({ ...offer, paymentUrl: "javascript:alert(1)" })).ok).toBe(false);
  });

  const acceptance = {
    signerName: "Ann Byrne",
    signerRole: "Director",
    legalName: "Livdor Ltd",
    address: "1 Main Street, Dublin",
    accountEmail: "ann@livdor.com",
    agree: "on",
    authorised: "on",
    signature: "Ann Byrne",
  };

  it("needs both boxes ticked to accept", () => {
    expect(parseAcceptance(form(acceptance)).ok).toBe(true);
    expect(parseAcceptance(form({ ...acceptance, agree: "" })).ok).toBe(false);
    expect(parseAcceptance(form({ ...acceptance, authorised: "" })).ok).toBe(false);
  });
});

describe("bespoke Premium prices", () => {
  it("counts a subscription marked premium in its metadata", () => {
    expect(isPremiumSubscription("price_bespoke", { tier: "premium", partner: "Livdor" })).toBe(true);
    expect(isPremiumSubscription("price_bespoke", {})).toBe(false);
    expect(isPremiumSubscription(null, null)).toBe(false);
  });
});

describe("onboarding page and contract", async () => {
  const { contractText, groupInclusions, offerStripeMetadata, offerUnitAmount, sha256, foundingLabel } = await import("@/lib/partner-offers");
  const { offerIdFrom } = await import("@/lib/partner-offer-payments");

  it("charges the offer price in pence and tags the payment with the offer", () => {
    expect(offerUnitAmount({ priceGBP: 1400 })).toBe(140000);
    const meta = offerStripeMetadata({ id: "cmoffer1234567", businessName: "Livdor", isFounding: true });
    expect(meta).toMatchObject({ tier: "premium", offerId: "cmoffer1234567", founding: "1" });
    expect(offerIdFrom(meta)).toBe("cmoffer1234567");
    expect(offerIdFrom({ offerId: "../../etc" })).toBeNull();
    expect(offerIdFrom(null)).toBeNull();
  });

  it("groups benefits under plain headings, numbered in order", () => {
    const groups = groupInclusions([
      "Everything in Business, including a business page",
      "One sponsored masterclass every month",
      "Two newsletter spotlights a year",
      "A quarterly report on how members engaged",
    ]);
    expect(groups.map((g) => g.title)).toEqual(["Your page", "Education", "Editorial", "Insight"]);
  });

  it("names founding partners by number", () => {
    expect(foundingLabel({ isFounding: true, foundingNumber: 1 }, 6)).toBe("Founding partner No. 1 of 6");
    expect(foundingLabel({ isFounding: false, foundingNumber: 1 }, 6)).toBeNull();
  });

  const facts = {
    offerId: "cmoffer1234567",
    businessName: "LIVDOR",
    legalName: "ACB Commerce Ltd",
    companyNumber: "16223770",
    address: "124 City Road\nLondon EC1V 2NX",
    signerName: "Ann Byrne",
    signerRole: "Director",
    signature: "Ann Byrne",
    accountEmail: "ann@livdor.com",
    price: "£1,400 a year",
    priceNote: "Fixed.",
    inclusions: ["One masterclass a month"],
    specialTerms: null,
    firstMasterclass: null,
    firstFeature: null,
    termsVersion: "2026-10-07",
    terms: [{ heading: "The agreement", paragraphs: ["These terms…"] }],
    signedAt: new Date("2026-10-08T10:00:00Z"),
    ip: "203.0.113.5",
    countersignedBy: "Karley Weir, Founder, for Trichollective Ltd",
  };

  it("writes the agreement text the same way every time, so its fingerprint can be checked", () => {
    const text = contractText(facts);
    expect(text).toContain("ACB Commerce Ltd (company number 16223770), trading as LIVDOR, of 124 City Road, London EC1V 2NX.");
    expect(text).toContain('typed signature "Ann Byrne"');
    expect(sha256(contractText(facts))).toBe(sha256(text));
    expect(sha256(contractText({ ...facts, price: "£1,500 a year" }))).not.toBe(sha256(text));
  });

  it("asks the signature to match the signer's name", async () => {
    const { parseAcceptance } = await import("@/lib/partner-offers");
    const base = { signerName: "Ann Byrne", signerRole: "Director", legalName: "ACB Commerce Ltd", address: "124 City Road, London", accountEmail: "ann@livdor.com", agree: "on", authorised: "on" };
    const get = (v: Record<string, string>) => (k: string) => v[k] ?? null;
    expect(parseAcceptance(get({ ...base, signature: "ann byrne" })).ok).toBe(true);
    expect(parseAcceptance(get({ ...base, signature: "Someone Else" })).ok).toBe(false);
    expect(parseAcceptance(get({ ...base, signature: "" })).ok).toBe(false);
  });
});

describe("partner page prefill", async () => {
  const { readPagePrefill } = await import("@/lib/partner-offers");

  it("keeps only safe, well-formed content", () => {
    const p = readPagePrefill({
      story: "  Our story.  ",
      offerings: [{ title: "Cap", body: "Hands-free." }, { body: "no title" }],
      highlights: [{ value: "272", label: "Laser diodes" }],
      ctaLabel: "Visit",
      ctaUrl: "javascript:alert(1)",
      socials: { instagram: "livdoruk", "bad key!": "x" },
    });
    expect(p.story).toBe("Our story.");
    expect(p.offerings).toEqual([{ title: "Cap", body: "Hands-free." }]);
    expect(p.highlights).toHaveLength(1);
    expect(p.ctaUrl).toBeNull();
    expect(p.socials).toEqual({ instagram: "livdoruk" });
  });

  it("is empty for an offer without a prefill", () => {
    expect(readPagePrefill(null)).toMatchObject({ story: null, offerings: [], socials: {} });
  });
});
