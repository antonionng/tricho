/**
 * The course-build service: the Trichollective team builds or tailors a course
 * with an educator, for a one-off fee. Each request is quoted in Studio, and
 * the educator accepts and pays the quote before work starts. Prices include
 * VAT, like every other price on the site.
 *
 * TODO: Karley — every price and share below is a placeholder until you
 * confirm them. While `pricesConfirmed` is false the public /educators page
 * says each build is quoted per project instead of showing these prices.
 */

export type CourseBuildTierId = "tailor" | "build" | "build_film";

export type CourseBuildTier = {
  id: CourseBuildTierId;
  name: string;
  /** One sentence for the public page and the quote email. */
  summary: string;
  includes: string[];
  /** Whole pounds, VAT included. The usual starting point for a quote. */
  fromPrice: number;
  /**
   * The educator's share of each sale on a course built at this tier, in
   * percent. Empty keeps the educator's own rate (70% by default).
   */
  defaultSharePct?: number;
};

export const courseBuild = {
  name: "Course build service",
  /** Shows the prices and share overrides on the public page. TODO: Karley — set to true once they are agreed. */
  pricesConfirmed: false,
  summary:
    "Send us your notes, slides or the talk you already give, and the Trichollective team turns them into a finished course that is sold under your name.",
  tiers: [
    {
      id: "tailor",
      name: "Tailor",
      summary: "We take a course you have already written and shape it into lessons, case studies and a final assessment ready for review.",
      includes: [
        "Your existing material edited into clear lessons",
        "Knowledge checks and a final assessment written for you",
        "One round of changes after you review it",
      ],
      // TODO: Karley — placeholder price.
      fromPrice: 450,
    },
    {
      id: "build",
      name: "Build",
      summary: "We write the whole course with you from your notes, slides or talk, including case studies, handouts and the assessment.",
      includes: [
        "A course plan agreed with you before we start writing",
        "Every lesson, case study and handout written by the team",
        "Knowledge checks and a final assessment",
        "Two rounds of changes after you review it",
      ],
      // TODO: Karley — placeholder price and share.
      fromPrice: 1450,
      defaultSharePct: 60,
    },
    {
      id: "build_film",
      name: "Build + film",
      summary: "Everything in Build, plus a filmed introduction and demonstration lessons, edited and hosted for you.",
      includes: [
        "Everything in Build",
        "A half-day filming session for your introduction and demonstrations",
        "Edited video hosted on Vimeo and placed in your lessons",
        "Two rounds of changes after you review it",
      ],
      // TODO: Karley — placeholder price and share.
      fromPrice: 2950,
      defaultSharePct: 50,
    },
  ] satisfies CourseBuildTier[] as CourseBuildTier[],
};

export function buildTierById(id: string | null | undefined) {
  return courseBuild.tiers.find((t) => t.id === id);
}

/** The educator's share on a course built at this tier: the override if there is one, otherwise their own rate. */
export function buildSharePct(tierId: string | null | undefined, educatorSharePct: number) {
  return buildTierById(tierId)?.defaultSharePct ?? educatorSharePct;
}
