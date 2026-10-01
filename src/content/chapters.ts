import type { ImageKey } from "@/content/gazette/types";

export type ChapterInfo = {
  slug: string;
  /** Display name of the chapter, e.g. "Ireland". (Stored as `city` on the Chapter row.) */
  city: string;
  /** Wider region label shown above the name. */
  country: string;
  /** Values of DirectoryListing.country that belong to this chapter. */
  countries: string[];
  blurb: string;
  imageKey: ImageKey;
};

/** Chapters are country-based, so members meet the people who practise under the same rules and in the same places. */
export const CHAPTERS: ChapterInfo[] = [
  {
    slug: "ireland",
    city: "Ireland",
    country: "Ireland and Northern Ireland",
    countries: ["Ireland", "Northern Ireland"],
    blurb:
      "The chapter for members across the whole island of Ireland, and the home of Trichollective Dublin, where the online collective launches on 5 October.",
    imageKey: "ed02",
  },
  {
    slug: "england",
    city: "England",
    country: "United Kingdom",
    countries: ["England"],
    blurb:
      "Where Trichollective began, at Whittlebury Hall, and the chapter for clinics, salons, head spas and practitioners from Cornwall to Cumbria.",
    imageKey: "ed12",
  },
  {
    slug: "scotland",
    city: "Scotland",
    country: "United Kingdom",
    countries: ["Scotland"],
    blurb:
      "The chapter for members across Scotland, where new rules on non-surgical cosmetic procedures make meeting colleagues more useful than ever.",
    imageKey: "ed13",
  },
  {
    slug: "wales",
    city: "Wales",
    country: "United Kingdom",
    countries: ["Wales"],
    blurb: "The chapter for members across Wales, from Cardiff and Swansea to the north, who want colleagues close to home.",
    imageKey: "ed08",
  },
  {
    slug: "europe",
    city: "Europe",
    country: "International",
    countries: ["Europe"],
    blurb: "The chapter for members practising across mainland Europe, who bring new techniques and fresh perspectives to the collective.",
    imageKey: "ed06",
  },
  {
    slug: "united-states",
    city: "United States",
    country: "International",
    countries: ["United States"],
    blurb:
      "The chapter for members in the United States, growing ahead of our first American conference in Los Angeles, with the date to be confirmed.",
    imageKey: "ed04",
  },
];

export function chapterBySlug(slug: string) {
  return CHAPTERS.find((c) => c.slug === slug);
}

/** Country choices on the listing form, in the order people expect. */
export const LISTING_COUNTRIES = ["Ireland", "Northern Ireland", "England", "Scotland", "Wales", "Europe", "United States"] as const;

export function chapterForCountry(country: string) {
  return CHAPTERS.find((c) => c.countries.includes(country));
}
