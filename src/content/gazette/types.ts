import type { images } from "@/content/images";

export type ImageKey = keyof typeof images;

/** Content blocks inside a page. Interactive blocks render as working widgets. */
export type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] }
  /** A line lifted from this article's own text. Never attributed to a real person. */
  | { type: "pull"; text: string }
  | { type: "callout"; title: string; text: string }
  /** Interactive: readers tick items off; progress is shown. */
  | { type: "checklist"; title: string; items: string[] }
  /** Interactive: pick an answer, then see the explanation. `answer` is the index of the correct option. */
  | { type: "quiz"; question: string; options: string[]; answer: number; explain: string }
  /** Interactive: tap to reveal the answer. */
  | { type: "reveal"; prompt: string; answer: string };

/** A company at an event: the sponsor or an exhibitor. `logo` is filled on the server from the Partner table by slug. */
export type PartnerEntry = {
  name: string;
  /** The Partner slug, when they have a partner page here. */
  slug?: string;
  /** Who came on the day, e.g. "Amy and Adam". */
  people?: string;
  note: string;
  url: string;
  logo?: string;
  /** Set on the server when they have a published partner page. */
  href?: string;
};

/** A speaker or contributor. Monograms stand in until a headshot is supplied. */
export type Person = {
  name: string;
  role: string;
  org?: string;
  place?: string;
  note: string;
  /** A path inside the site, such as their partner or directory page. */
  href?: string;
  /** A short highlighted line, e.g. "Co-organiser". */
  highlight?: string;
};

export type Page =
  | { kind: "letter"; title: string; blocks: Block[]; signoff: string }
  | { kind: "article"; kicker: string; title: string; standfirst: string; imageKey?: ImageKey; blocks: Block[] }
  /** A full-bleed photographic spread. */
  | { kind: "image"; imageKey: ImageKey; caption: string }
  /** Facts at a glance: programme notes, a protocol, a timeline. */
  | { kind: "glance"; kicker: string; title: string; rows: { label: string; value: string }[] }
  | { kind: "interactive"; kicker: string; title: string; intro: string; blocks: Block[] }
  /** Real, sourced news. Filled automatically from src/content/news.ts. */
  | { kind: "news"; kicker: string; title: string; intro: string; items: import("@/content/news").NewsItem[] }
  /** The same topic seen from the cosmetic chair, the trichology clinic and the medical consulting room. */
  | {
      kind: "perspectives";
      kicker: string;
      title: string;
      intro: string;
      views: { discipline: "cosmetic" | "clinical" | "medical"; heading: string; blocks: Block[] }[];
    }
  /* Built-in editions only: these are not offered in Studio. */
  /** A set of our own photographs from an event, laid out as an editorial gallery. */
  | { kind: "gallery"; kicker: string; title: string; intro: string; photos: { imageKey: ImageKey; caption: string }[] }
  /** Speakers and contributors. */
  | { kind: "people"; kicker: string; title: string; intro: string; people: Person[] }
  /** The sponsor and exhibitors at an event, on one page. */
  | { kind: "partners"; kicker: string; title: string; intro: string; sponsor: PartnerEntry; exhibitors: PartnerEntry[] }
  /** A labelled partner feature in the partner's own colours. */
  | {
      kind: "partner";
      kicker: string;
      title: string;
      standfirst: string;
      partner: { name: string; slug?: string; logo?: string; url: string; ctaLabel: string; href?: string; /** Turn a dark logo white on the ink band. */ invertLogo?: boolean };
      /** The partner's palette: page background, text and one accent. Defaults to the magazine's. */
      theme?: { paper: string; ink: string; accent: string; /** Text on the accent, when ink is too dark against it. */ onAccent?: string; sans?: boolean };
      imageKey?: ImageKey;
      blocks: Block[];
      /** Short facts shown beside the story. */
      facts?: { label: string; value: string }[];
      /** A plain statement of any connection between the partner and Trichollective. */
      disclosure?: string;
      /** The label on the page. Defaults to "Partner feature"; charities use "Charity feature" and are never labelled sponsored. */
      label?: string;
    }
  /** Join as a member or list a business. Shown to everyone, including readers without membership. */
  | { kind: "cta"; kicker: string; title: string; intro: string; blocks: Block[]; offers: ("member" | "business")[] };

/** Page kinds that only built-in editions use. Studio cannot write them, so they have no form or schema there. */
export type BuiltInOnlyKind = "gallery" | "people" | "partners" | "partner" | "cta";

export type Edition = {
  number: number;
  slug: string;
  title: string;
  /** Second line of the cover title, in the grey fade. */
  fade: string;
  theme: string;
  standfirst: string;
  coverImageKey?: ImageKey;
  coverTone: "light" | "dark";
  /** Who each edition is most useful for. */
  audience: ("cosmetic" | "clinical" | "medical")[];
  /** ISO date the edition was published on the platform. */
  published: string;
  /** Pages after the automatic cover and contents pages. */
  pages: Page[];
  /** "current" editions are the monthly magazine; "archive" editions look back at a past year. */
  series?: "current" | "archive";
  /** For archive editions: the year covered, e.g. "2023". */
  period?: string;
  /** For archive editions: which field it covers, or "review" for the year overall. */
  focus?: "review" | "cosmetic" | "clinical" | "medical";
  /** Sources behind every factual claim. Shown at the end of the edition. */
  sources?: { label: string; url: string }[];
};

/** Pages the public may read before the membership gate (after cover + contents). */
export const PUBLIC_PREVIEW_PAGES = 2;
