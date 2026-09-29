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
      "Tricho-AI clinical assistant (unlimited)",
      "The Gazette — monthly digital magazine + full archive",
      "The Audio Dispatch podcast archive",
      "The Hub — private professional community",
      "Verified Directory listing",
      "Monthly live education (Zoom) + replays",
      "Member pricing on Trichollective events",
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
      "Everything in Membership",
      "Half-page Gazette feature monthly",
      "Brand profile in the Directory",
      "Exhibition add-on options",
      "Lead delivery from the network",
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
      "Full-page Gazette feature",
      "Exhibition included (all events)",
      "Speaking slot at the Summit",
      "Audio Dispatch guest feature",
      "Guest on 2 live education sessions",
      "2 event tickets included",
    ],
  },
];

export const flagshipTier = subscriptionTiers.find((t) => t.featured)!;

/** Resolve a Stripe price id back to the tier that owns it (used by webhooks). */
export function tierByPriceId(priceId: string | null | undefined) {
  if (!priceId) return undefined;
  return subscriptionTiers.find((t) => t.stripePriceId === priceId);
}
