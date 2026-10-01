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
    };

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
