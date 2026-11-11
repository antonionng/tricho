/** Sponsored placements in the member community. Every ad is labelled "Sponsored by" and makes no clinical claims. */
export type CommunityAd = {
  id: string;
  sponsor: string;
  /** Key into src/content/images.ts */
  imageKey: "livdorCap" | "livdorLifestyleReading" | "livdorLifestyleLaptop";
  imageAlt: string;
  /** Small coloured line above the headline, e.g. "Sponsored masterclass". */
  kicker?: string;
  /** One complete sentence of value. */
  headline: string;
  body: string;
  cta: string;
  href: string;
  /** Only shown between these dates (inclusive), if set. */
  from?: string;
  until?: string;
};

export const communityAds: { sidebar: CommunityAd[]; feed: CommunityAd[] } = {
  sidebar: [
    {
      id: "livdor-masterclass-side",
      sponsor: "LIVDOR",
      imageKey: "livdorCap",
      imageAlt: "The LIVDOR laser cap lit red from inside, resting on its carry case",
      kicker: "Masterclass",
      headline: "Laser, LED and dose, explained.",
      body: "Adam Bond and Karley Weir show you how to read the specification of any light device. Open to every member.",
      cta: "See the masterclass",
      href: "/members/events",
    },
  ],
  feed: [
    {
      id: "livdor-masterclass-feed",
      sponsor: "LIVDOR",
      imageKey: "livdorCap",
      imageAlt: "The LIVDOR laser cap lit red from inside, resting on its carry case beside the battery pack",
      kicker: "Sponsored masterclass",
      headline: "Ask LIVDOR the hard questions about laser, LED and dose.",
      body: "A sponsored masterclass with founder Adam Bond covers wavelength, output, coverage and what to ask any brand, so you can set honest expectations with clients. The date will be announced to every account.",
      cta: "See the masterclass",
      href: "/members/events",
    },
  ],
};

export function activeAds(list: CommunityAd[], now = new Date()) {
  const t = now.toISOString().slice(0, 10);
  return list.filter((a) => (!a.from || a.from <= t) && (!a.until || a.until >= t));
}
