export type BillingInterval = "month" | "year";
export type PlanId = "community" | "professional" | "business";

export interface SubscriptionTier {
  id: PlanId;
  name: string;
  /** Monthly price in GBP. */
  price: number;
  /** Founding price in GBP per month, kept while a founding member stays. */
  foundingPrice?: number;
  /** Founding annual price in GBP (ten times the founding monthly price). */
  foundingAnnualPrice?: number;
  /** Euro prices for Ireland and Europe (same Stripe prices, EUR currency option). */
  eur?: { price: number; foundingPrice?: number; annualPrice: number; foundingAnnualPrice?: number };
  /** Annual price in GBP (two months free). */
  annualPrice: number;
  featured?: boolean;
  audience: string;
  summary: string;
  /** Maps a successful checkout to a platform role. */
  grantsRole: "individual" | "trichologist" | "business";
  stripePriceId?: string;
  stripeAnnualPriceId?: string;
  stripeFoundingPriceId?: string;
  stripeFoundingAnnualPriceId?: string;
  /** Older price ids that should still resolve to this plan (existing subscribers). */
  legacyPriceIds?: (string | undefined)[];
  features: string[];
}

export const subscriptionTiers: SubscriptionTier[] = [
  {
    id: "community",
    name: "Community",
    price: 9,
    foundingPrice: 6,
    annualPrice: 90,
    foundingAnnualPrice: 60,
    eur: { price: 10, foundingPrice: 7, annualPrice: 100, foundingAnnualPrice: 70 },
    audience: "For head spa therapists, stylists, scalp care specialists and students building their scope of practice",
    summary:
      "Ask colleagues across every discipline, learn from monthly masterclasses and pay less for courses and conferences.",
    grantsRole: "individual",
    stripePriceId: process.env.STRIPE_PRICE_ID_COMMUNITY,
    stripeAnnualPriceId: process.env.STRIPE_PRICE_ID_COMMUNITY_ANNUAL,
    stripeFoundingPriceId: process.env.STRIPE_PRICE_ID_COMMUNITY_FOUNDING,
    stripeFoundingAnnualPriceId: process.env.STRIPE_PRICE_ID_COMMUNITY_FOUNDING_ANNUAL,
    features: [
      "Ask questions in every open space, meet your country chapter and message any member directly",
      "Read every Trichozette edition in full, including the archive from 2023 to 2026, plus the podcast and newsletter",
      "Learn at a live masterclass and case round each month, with recordings to watch between clients",
      "Pay member prices on courses and conferences",
      "Save with member perks from partner brands",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 19,
    foundingPrice: 14,
    annualPrice: 190,
    foundingAnnualPrice: 140,
    eur: { price: 22, foundingPrice: 16, annualPrice: 220, foundingAnnualPrice: 160 },
    featured: true,
    audience: "For qualified practitioners: trichologists, doctors, nurses and established head spa and salon owners",
    summary:
      "Everything in Community, plus a public profile, the Case Room, the referral network and your CPD recorded for you.",
    grantsRole: "trichologist",
    stripePriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL,
    stripeAnnualPriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL,
    stripeFoundingPriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL_FOUNDING,
    stripeFoundingAnnualPriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL_FOUNDING_ANNUAL,
    legacyPriceIds: [process.env.STRIPE_PRICE_ID_MEMBER],
    features: [
      "Everything in Community",
      "Be found in the directory with a full profile, and receive enquiries from the public directly",
      "Show a verified badge once we have checked your training and registration by hand",
      "Get peer review on anonymised cases in the Case Room",
      "Refer clients to the right cosmetic, clinical or medical colleague through the referral network",
      "Let the Assistant suggest referral routes and draft referral letters, aftercare sheets and consultation summaries",
      "Keep a CPD log that records your learning automatically",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 99,
    annualPrice: 990,
    eur: { price: 115, annualPrice: 1150 },
    audience: "For clinics, salons, brands and device makers",
    summary:
      "Put your clinic, salon or brand in front of hair and scalp professionals, and hire people already trained in the field.",
    grantsRole: "business",
    stripePriceId: process.env.STRIPE_PRICE_ID_BUSINESS,
    stripeAnnualPriceId: process.env.STRIPE_PRICE_ID_BUSINESS_ANNUAL,
    legacyPriceIds: [
      process.env.STRIPE_PRICE_ID_BUSINESS_STANDARD,
      process.env.STRIPE_PRICE_ID_BUSINESS_LUXURY,
    ],
    features: [
      "Be found by the public with a business page in the directory",
      "Give five of your team Professional membership",
      "Advertise roles on the jobs board to trained hair and scalp professionals",
      "Offer members a perk and put your products in front of practitioners",
      "See how members engaged with you in a quarterly summary",
    ],
  },
];

/** What anyone gets without paying. Shown as the first column on /pricing. */
export const FREE_LISTING_DAYS = 90;

export const freeListing = {
  name: "Free account",
  price: 0,
  audience: "For every cosmetic, clinical and medical professional",
  summary: `Be found in the directory for free, with your full profile and enquiries included for your first ${FREE_LISTING_DAYS} days.`,
  features: [
    "A basic directory listing that stays free for as long as you like: name, discipline, town and specialism",
    `Your full profile free for ${FREE_LISTING_DAYS} days: photo, services, website and enquiries sent straight to you`,
    "The opening features of every Trichozette edition, and the news for practitioners",
    "The founding badge, which you keep if you become a member",
  ],
  excludes: [
    `Your full profile and enquiries after the first ${FREE_LISTING_DAYS} days (enquiries wait for you until you join)`,
    "The community, the Case Room, CPD and the referral network",
  ],
};

/**
 * Premium Business: sold by application, never through checkout. Karley approves and invoices.
 * Founding partners (the first six) keep the founding rate while they stay.
 */
export const premiumBusiness = {
  id: "premium" as const,
  name: "Premium Business",
  annualPrice: 3500,
  foundingAnnualPrice: 1950,
  foundingPlaces: 6,
  perCategoryLimit: 2,
  audience: "For brands, device makers and education providers who want to support the profession and reach it properly",
  summary:
    "Everything in Business, plus education, editorial and conference placements with the practitioners who recommend products to their clients.",
  features: [
    "Everything in Business, including a business page, five Professional seats and job posts",
    "One sponsored masterclass a year, reviewed so that it teaches rather than sells, kept in the member library",
    "The option to co-develop a course with a certificate, subject to clinical review",
    "One labelled partner feature in Trichozette a year, and \u201cSupported by\u201d on one edition each quarter",
    "Two newsletter spotlights a year",
    "A talk or demo slot at one conference a year, with sampling or a delegate-bag insert at the others",
    "A member perk with tracked redemptions, and an opt-in product trial panel with structured feedback",
    "A quarterly report on how members engaged with your content and perks",
    "A partner page and the Premium partner badge",
  ],
  guardrails: [
    "At most two partners in each product category",
    "Every sponsored piece is clearly labelled",
    "No clinical claims, and brands never post in the clinical spaces",
  ],
};

/** Individual founding offer: the first members to join keep the founding price while they stay. */
export const FOUNDING_MEMBER_PLACES = 200;

export const flagshipTier = subscriptionTiers.find((t) => t.featured)!;

export function tierById(id: string | null | undefined) {
  return subscriptionTiers.find((t) => t.id === id);
}

/** Resolve a Stripe price id back to the plan that owns it (used by webhooks). */
export function tierByPriceId(priceId: string | null | undefined) {
  if (!priceId) return undefined;
  return subscriptionTiers.find(
    (t) =>
      t.stripePriceId === priceId ||
      t.stripeAnnualPriceId === priceId ||
      t.stripeFoundingPriceId === priceId ||
      t.stripeFoundingAnnualPriceId === priceId ||
      t.legacyPriceIds?.includes(priceId)
  );
}

/** Pick the Stripe price for a checkout request. */
export function priceIdFor(
  tier: SubscriptionTier,
  interval: BillingInterval,
  founding: boolean
) {
  if (founding && interval === "year" && tier.stripeFoundingAnnualPriceId) return tier.stripeFoundingAnnualPriceId;
  if (founding && interval === "month" && tier.stripeFoundingPriceId) return tier.stripeFoundingPriceId;
  if (interval === "year" && tier.stripeAnnualPriceId) return tier.stripeAnnualPriceId;
  return tier.stripePriceId;
}
