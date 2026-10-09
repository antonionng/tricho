import { createHash, randomBytes } from "node:crypto";
import { PARTNER_CATEGORIES, partnerLogoSrc, safeHttpUrl } from "@/lib/partners";
import { safeHex } from "@/lib/showcase";
import { site } from "@/config/site";
import { cleanEmail } from "@/lib/signin-email";

/**
 * Bespoke Premium Business offers: the team agrees a deal (often a founding rate paid through a
 * Stripe payment link), then sends a private onboarding link where the brand accepts the terms.
 * Everything here is pure, so it can be tested.
 */

/** The private part of the onboarding link: long enough that it can't be guessed. */
export function newOfferToken() {
  return randomBytes(18).toString("base64url");
}

export function offerPath(token: string) {
  return `/onboard/${token}`;
}

/** One benefit per line; bullets and numbering are stripped, blank lines ignored. */
export function parseInclusions(text: string) {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 30)
    .map((l) => l.slice(0, 300));
}

export function inclusionsFrom(json: unknown): string[] {
  return Array.isArray(json) ? json.filter((x): x is string => typeof x === "string") : [];
}

/** "£1,400 a year" */
export function offerPriceLabel(o: { priceGBP: number; interval: string }) {
  return `£${o.priceGBP.toLocaleString("en-GB")} ${o.interval === "month" ? "a month" : "a year"}`;
}

/** The sentence that sits under the price. */
export function offerPriceNote(o: { fixedPrice: boolean; isFounding: boolean }) {
  if (o.fixedPrice && o.isFounding) return "This is a founding partner price, and it stays the same for as long as you remain a partner.";
  if (o.fixedPrice) return "This price stays the same for as long as you remain a partner.";
  if (o.isFounding) return "This is a founding partner price.";
  return "Billed in advance, and renews automatically until you cancel.";
}

export type OfferInput = {
  businessName: string;
  category: string;
  website: string | null;
  contactName: string | null;
  email: string;
  priceGBP: number;
  interval: "year" | "month";
  fixedPrice: boolean;
  isFounding: boolean;
  inclusions: string[];
  specialTerms: string | null;
  paymentUrl: string | null;
  accentColor: string | null;
  tagline: string | null;
  logoUrl: string | null;
  heroUrl: string | null;
  personalNote: string | null;
  firstMasterclass: string | null;
  firstFeature: string | null;
  foundingNumber: number | null;
  legalNameHint: string | null;
  companyNumberHint: string | null;
  addressHint: string | null;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Checks the Studio form for a new offer. */
export function parseOfferForm(get: (key: string) => unknown): Result<OfferInput> {
  const businessName = str(get("businessName"), 120);
  const email = cleanEmail(get("email"));
  const price = Number(str(get("priceGBP"), 10).replace(/[£,\s]/g, ""));
  const inclusions = parseInclusions(str(get("inclusions"), 8000));
  const categoryRaw = str(get("category"), 60);
  const category = (PARTNER_CATEGORIES as readonly string[]).includes(categoryRaw) ? categoryRaw : "Something else";
  const websiteRaw = str(get("website"), 300);
  const paymentRaw = str(get("paymentUrl"), 500);
  const website = websiteRaw ? safeHttpUrl(/^https?:\/\//i.test(websiteRaw) ? websiteRaw : `https://${websiteRaw}`) : null;
  const paymentUrl = paymentRaw ? safeHttpUrl(paymentRaw) : null;

  if (!businessName) return { ok: false, error: "Please add the business name." };
  if (!email) return { ok: false, error: "Please add the email address the link goes to." };
  if (!Number.isInteger(price) || price < 1 || price > 100000) return { ok: false, error: "Please add the price in whole pounds, for example 1400." };
  if (!inclusions.length) return { ok: false, error: "Please list what is included, one item per line." };
  if (websiteRaw && !website) return { ok: false, error: "Please check the website address." };
  if (paymentRaw && !paymentUrl) return { ok: false, error: "Please check the payment link. It needs to be a full web address." };
  const accentRaw = str(get("accentColor"), 7);
  if (accentRaw && safeHex(accentRaw, "") !== accentRaw.toUpperCase()) return { ok: false, error: "Please give the brand colour as a hex code, for example #0B1A33." };
  const image = (key: string) => {
    const raw = str(get(key), 500);
    return raw ? partnerLogoSrc(raw) : null;
  };
  const logoUrl = image("logoUrl");
  const heroUrl = image("heroUrl");
  if (str(get("logoUrl"), 500) && !logoUrl) return { ok: false, error: "Please check the logo address. It needs to be a full web address." };
  if (str(get("heroUrl"), 500) && !heroUrl) return { ok: false, error: "Please check the cover photo address. It needs to be a full web address." };
  const numberRaw = Number(str(get("foundingNumber"), 3));
  const foundingNumber = Number.isInteger(numberRaw) && numberRaw > 0 && numberRaw < 100 ? numberRaw : null;

  return {
    ok: true,
    value: {
      businessName,
      category,
      website,
      contactName: str(get("contactName"), 120) || null,
      email,
      priceGBP: price,
      interval: str(get("interval"), 10) === "month" ? "month" : "year",
      fixedPrice: get("fixedPrice") === "on",
      isFounding: get("isFounding") === "on",
      inclusions,
      specialTerms: str(get("specialTerms"), 4000) || null,
      paymentUrl,
      accentColor: accentRaw ? accentRaw.toUpperCase() : null,
      tagline: str(get("tagline"), 160) || null,
      logoUrl,
      heroUrl,
      personalNote: str(get("personalNote"), 6000) || null,
      firstMasterclass: str(get("firstMasterclass"), 300) || null,
      firstFeature: str(get("firstFeature"), 300) || null,
      foundingNumber,
      legalNameHint: str(get("legalNameHint"), 160) || null,
      companyNumberHint: str(get("companyNumberHint"), 40) || null,
      addressHint: str(get("addressHint"), 600) || null,
    },
  };
}

export type Acceptance = {
  signerName: string;
  signerRole: string;
  legalName: string;
  companyNumber: string | null;
  address: string;
  accountEmail: string;
  signature: string;
};

/** Checks the brand's acceptance form. Both boxes must be ticked. */
export function parseAcceptance(get: (key: string) => unknown): Result<Acceptance> {
  const signerName = str(get("signerName"), 120);
  const signerRole = str(get("signerRole"), 120);
  const legalName = str(get("legalName"), 160);
  const address = str(get("address"), 600);
  const accountEmail = cleanEmail(get("accountEmail"));

  if (!signerName) return { ok: false, error: "Please add your full name." };
  if (!signerRole) return { ok: false, error: "Please add your job title." };
  if (!legalName) return { ok: false, error: "Please add the registered name of the business." };
  if (address.length < 8) return { ok: false, error: "Please add the registered business address." };
  if (!accountEmail) return { ok: false, error: "Please add the email address you will sign in with." };
  const signature = str(get("signature"), 120);
  if (!signature) return { ok: false, error: "Please type your full name to sign." };
  if (normaliseName(signature) !== normaliseName(signerName)) return { ok: false, error: "Please sign with the same full name you gave above." };
  if (get("agree") !== "on") return { ok: false, error: "Please tick to agree to the partner terms and the terms of business." };
  if (get("authorised") !== "on") return { ok: false, error: "Please confirm that you are authorised to agree for the business." };

  return {
    ok: true,
    value: { signerName, signerRole, legalName, companyNumber: str(get("companyNumber"), 40) || null, address, accountEmail, signature },
  };
}

function normaliseName(name: string) {
  return name.toLowerCase().normalize("NFKD").replace(/[^a-z]/g, "");
}

/** Pence, for Stripe. */
export function offerUnitAmount(o: { priceGBP: number }) {
  return o.priceGBP * 100;
}

/** On the Checkout session and the subscription, so the webhook can tie a payment to its offer. */
export function offerStripeMetadata(o: { id: string; businessName: string; isFounding: boolean }) {
  return {
    tier: "premium",
    plan: "premium",
    offerId: o.id,
    partner: o.businessName.slice(0, 120),
    founding: o.isFounding ? "1" : "0",
  };
}

/** "No. 1 of 6" */
export function foundingLabel(o: { isFounding: boolean; foundingNumber: number | null }, places: number) {
  if (!o.isFounding) return null;
  return o.foundingNumber ? `Founding partner No. ${o.foundingNumber} of ${places}` : "Founding partner";
}

export type InclusionGroup = { title: string; items: string[] };

const GROUPS: [string, RegExp][] = [
  ["Education", /masterclass|course|certificate|cpd|training/i],
  ["Editorial", /trichozette|article|feature|newsletter|spotlight|editorial/i],
  ["Events", /conference|talk|demo|event|delegate|sampling/i],
  ["Members", /perk|trial|panel|member|seat|job/i],
  ["Insight", /report|engag|insight|analytics/i],
];

// Checked most specific first: "a report on how members engaged" is insight, not a member benefit.
const MATCH_ORDER = ["Insight", "Education", "Editorial", "Events", "Members"];

/** Benefits sorted under a few plain headings for the page; anything else goes under "Your page". */
export function groupInclusions(items: string[]): InclusionGroup[] {
  const out = new Map<string, string[]>();
  for (const item of items) {
    // "Everything in Business…" and the partner page itself lead the list.
    const title = /^everything in business|partner page|badge/i.test(item)
      ? "Your page"
      : (MATCH_ORDER.map((t) => GROUPS.find(([g]) => g === t)!).find(([, re]) => re.test(item))?.[0] ?? "Your page");
    out.set(title, [...(out.get(title) ?? []), item]);
  }
  const order = ["Your page", ...GROUPS.map(([t]) => t)];
  return order.filter((t) => out.has(t)).map((title) => ({ title, items: out.get(title)! }));
}

export type ContractFacts = {
  offerId: string;
  businessName: string;
  legalName: string;
  companyNumber: string | null;
  address: string;
  signerName: string;
  signerRole: string;
  signature: string;
  accountEmail: string;
  price: string;
  priceNote: string;
  inclusions: string[];
  specialTerms: string | null;
  firstMasterclass: string | null;
  firstFeature: string | null;
  termsVersion: string;
  terms: { heading: string; paragraphs: string[] }[];
  signedAt: Date;
  ip: string | null;
  countersignedBy: string;
};

/** The agreement as plain text, in a fixed order, so its fingerprint can be checked later. */
export function contractText(f: ContractFacts) {
  return [
    "PREMIUM PARTNER AGREEMENT",
    `Between ${site.company.name} (company number ${site.company.number}, ${site.company.address}) and ${f.legalName}${f.companyNumber ? ` (company number ${f.companyNumber})` : ""}, trading as ${f.businessName}, of ${f.address.replace(/\s*\n\s*/g, ", ")}.`,
    `Price: ${f.price}. ${f.priceNote}`,
    "Schedule: what is included",
    ...f.inclusions.map((i, n) => `${n + 1}. ${i}`),
    ...(f.specialTerms ? ["Also agreed", f.specialTerms] : []),
    ...(f.firstMasterclass ? [`First masterclass: ${f.firstMasterclass}`] : []),
    ...(f.firstFeature ? [`First Trichozette feature: ${f.firstFeature}`] : []),
    `Premium partner terms, version ${f.termsVersion}`,
    ...f.terms.flatMap((t, n) => [`${n + 1}. ${t.heading}`, ...t.paragraphs]),
    `Signed for ${f.legalName} by ${f.signerName}, ${f.signerRole}, typed signature "${f.signature}", on ${f.signedAt.toISOString()}${f.ip ? ` from ${f.ip}` : ""}. Account: ${f.accountEmail}.`,
    `Countersigned for ${site.company.name} by ${f.countersignedBy}.`,
    `Offer reference ${f.offerId}.`,
  ].join("\n\n");
}

export function sha256(text: string) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}
