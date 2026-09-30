export type BillingInterval = "month" | "year";
export type PlanId = "community" | "professional" | "business";

export interface SubscriptionTier {
  id: PlanId;
  name: string;
  /** Monthly price in GBP. */
  price: number;
  /** Founding price in GBP per month, kept for life by founding members. */
  foundingPrice?: number;
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
    audience: "For head spa therapists, stylists, scalp care specialists and students building their scope of practice",
    summary:
      "Ask colleagues across every discipline, learn from monthly masterclasses and pay less for courses and conferences.",
    grantsRole: "individual",
    stripePriceId: process.env.STRIPE_PRICE_ID_COMMUNITY,
    stripeAnnualPriceId: process.env.STRIPE_PRICE_ID_COMMUNITY_ANNUAL,
    stripeFoundingPriceId: process.env.STRIPE_PRICE_ID_COMMUNITY_FOUNDING,
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
    featured: true,
    audience: "For qualified practitioners: trichologists, doctors, nurses and established head spa and salon owners",
    summary:
      "Everything in Community, plus a public profile, the Case Room, the referral network and your CPD recorded for you.",
    grantsRole: "trichologist",
    stripePriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL,
    stripeAnnualPriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL,
    stripeFoundingPriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL_FOUNDING,
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
  name: "Founding listing",
  price: 0,
  audience: "For every cosmetic, clinical and medical professional who signs up early",
  summary: `Be found in the founding directory free for ${FREE_LISTING_DAYS} days. Choose a plan to stay listed after that.`,
  features: [
    `A basic listing for ${FREE_LISTING_DAYS} days: name, discipline, city and specialism`,
    "The founding badge, which you keep if you stay on",
    "The monthly newsletter",
  ],
  excludes: [
    "Photo, services, website and full profile",
    "Enquiries from the public (held until you claim)",
    "The community, courses and events",
  ],
};

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
      t.legacyPriceIds?.includes(priceId)
  );
}

/** Pick the Stripe price for a checkout request. */
export function priceIdFor(
  tier: SubscriptionTier,
  interval: BillingInterval,
  founding: boolean
) {
  if (founding && tier.stripeFoundingPriceId) return tier.stripeFoundingPriceId;
  if (interval === "year" && tier.stripeAnnualPriceId) return tier.stripeAnnualPriceId;
  return tier.stripePriceId;
}
