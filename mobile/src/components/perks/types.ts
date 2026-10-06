/** What /api/mobile/v1/perks sends. */
export type Perk = {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  tier: string;
  tierLabel: string;
  category: string;
  perk: string;
  /** A discount code found in the perk, ready to copy. */
  code: string | null;
  /** The tracked link to the partner's offer, on the website. */
  offerPath: string | null;
  aboutPath: string;
};

export const perksKey = ["perks"] as const;
