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
    audience: "For head spa therapists, stylists, students and anyone building a career in scalp care",
    summary:
      "Join the conversation, learn from people further along, and never miss a gathering.",
    grantsRole: "individual",
    stripePriceId: process.env.STRIPE_PRICE_ID_COMMUNITY,
    stripeAnnualPriceId: process.env.STRIPE_PRICE_ID_COMMUNITY_ANNUAL,
    stripeFoundingPriceId: process.env.STRIPE_PRICE_ID_COMMUNITY_FOUNDING,
    features: [
      "The full community: every open space, your local chapter and direct messages",
      "Trichozette each month, the podcast and the monthly newsletter",
      "Monthly live masterclass, with recordings you can watch later",
      "Member prices on courses and gatherings",
      "Member perks from partner brands",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 19,
    foundingPrice: 14,
    annualPrice: 190,
    featured: true,
    audience: "For qualified practitioners: trichologists, nurses, doctors and established head spa and salon owners",
    summary:
      "Everything in Community, plus the tools that bring you clients and referrals.",
    grantsRole: "trichologist",
    stripePriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL,
    stripeAnnualPriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL,
    stripeFoundingPriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL_FOUNDING,
    legacyPriceIds: [process.env.STRIPE_PRICE_ID_MEMBER],
    features: [
      "Everything in Community",
      "Claim your directory listing and make it a full profile, with enquiries sent straight to you",
      "The verified badge once your qualifications are checked",
      "The Case Room, for anonymised case discussion with other professionals",
      "The referral network across cosmetic, clinical and medical practice",
      "The Assistant, for referral routes, write-ups and questions answered from our library",
      "A CPD log that fills itself in as you learn",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 99,
    annualPrice: 990,
    audience: "For clinics, salons, brands and device makers",
    summary:
      "Put your business in front of a trusted, specialist audience and hire from it.",
    grantsRole: "business",
    stripePriceId: process.env.STRIPE_PRICE_ID_BUSINESS,
    stripeAnnualPriceId: process.env.STRIPE_PRICE_ID_BUSINESS_ANNUAL,
    legacyPriceIds: [
      process.env.STRIPE_PRICE_ID_BUSINESS_STANDARD,
      process.env.STRIPE_PRICE_ID_BUSINESS_LUXURY,
    ],
    features: [
      "A business page in the directory",
      "Five Professional seats for your team",
      "Job posts on the jobs board",
      "A listing in member perks",
      "A quarterly summary of how members engaged with you",
    ],
  },
];

/** What anyone gets without paying. Shown as the first column on /pricing. */
export const FREE_LISTING_DAYS = 90;

export const freeListing = {
  name: "Founding listing",
  price: 0,
  audience: "For every cosmetic, clinical and medical professional who signs up early",
  summary: `Be in the founding directory free for ${FREE_LISTING_DAYS} days. Choose a plan to stay listed after that.`,
  features: [
    `A basic listing for ${FREE_LISTING_DAYS} days: name, discipline, city and specialism`,
    "The founding badge, kept if you stay on",
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
