export type ChapterInfo = {
  slug: string;
  city: string;
  country: "Ireland" | "United Kingdom";
  blurb: string;
  imageKey?: "dublin" | "london" | "manchester";
};

/** Launch chapters. A chapter page exists for each; members pick one at onboarding. */
export const CHAPTERS: ChapterInfo[] = [
  {
    slug: "dublin",
    city: "Dublin",
    country: "Ireland",
    blurb:
      "Where Trichollective launches online, at Trichollective Dublin on 5 October. The home chapter for members across Ireland.",
    imageKey: "dublin",
  },
  {
    slug: "cork",
    city: "Cork",
    country: "Ireland",
    blurb: "Practitioners across Cork and Munster who meet between the Dublin gatherings.",
  },
  {
    slug: "galway",
    city: "Galway",
    country: "Ireland",
    blurb: "Members along the west coast, from Galway to Limerick.",
  },
  {
    slug: "belfast",
    city: "Belfast",
    country: "United Kingdom",
    blurb: "Members in Belfast and across Northern Ireland.",
  },
  {
    slug: "london",
    city: "London",
    country: "United Kingdom",
    blurb: "Clinics, salons and head spas across London and the south east.",
    imageKey: "london",
  },
  {
    slug: "manchester",
    city: "Manchester",
    country: "United Kingdom",
    blurb: "Members across Manchester and the north west.",
    imageKey: "manchester",
  },
];

export function chapterBySlug(slug: string) {
  return CHAPTERS.find((c) => c.slug === slug);
}
