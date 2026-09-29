export type BillingInterval = "month" | "year";

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  interval: BillingInterval;
  /** Visually highlighted as the primary offer. */
  featured?: boolean;
  /** Short audience descriptor shown under the price. */
  tagline?: string;
  /** Maps a successful checkout to a platform role. */
  grantsRole: "trichologist" | "business";
  stripePriceId?: string;
  features: string[];
}

/**
 * The Trichollective revenue model.
 *
 * The flagship offer is a single £12/month Membership aimed at every
 * professional in the field (trichologists, doctors, stylists, and wider
 * industry). The two Business tiers are the B2B / exhibitor track.
 */
export const MEMBERSHIP_PRICE = 12;

export const subscriptionTiers: SubscriptionTier[] = [
  {
    id: "member",
    name: "Membership",
    price: MEMBERSHIP_PRICE,
    interval: "month",
    featured: true,
    tagline: "For trichologists, doctors, stylists & industry professionals",
    grantsRole: "trichologist",
    stripePriceId: process.env.STRIPE_PRICE_ID_MEMBER,
    features: [
      "Rooms for Everyone, Cosmetic, Clinical, and Medical",
      "Learn — education useful from day one",
      "Tricho-AI for cosmetic, clinical, and medical work",
      "Member directory listing",
      "Exchange — tools and services from the network",
      "Built around the conference room, year-round",
    ],
  },
  {
    id: "business-standard",
    name: "Business",
    price: 150,
    interval: "month",
    tagline: "For brands & exhibitors",
    grantsRole: "business",
    stripePriceId: process.env.STRIPE_PRICE_ID_BUSINESS_STANDARD,
    features: [
      "Brand listing in the directory",
      "Place in the Exchange",
      "Path to the professionals in the network",
      "Does not post inside clinical rooms",
      "Conference exhibitor track online",
    ],
  },
  {
    id: "business-luxury",
    name: "Business Luxury",
    price: 3500,
    interval: "year",
    tagline: "Flagship partner package",
    grantsRole: "business",
    stripePriceId: process.env.STRIPE_PRICE_ID_BUSINESS_LUXURY,
    features: [
      "Everything in Business",
      "Priority brand placement",
      "Flagship Exchange presence",
      "Closer path to the conference room",
      "Annual partner commitment",
    ],
  },
];

export const flagshipTier = subscriptionTiers.find((t) => t.featured)!;

/** Resolve a Stripe price id back to the tier that owns it (used by webhooks). */
export function tierByPriceId(priceId: string | null | undefined) {
  if (!priceId) return undefined;
  return subscriptionTiers.find((t) => t.stripePriceId === priceId);
}
