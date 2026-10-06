/** What /api/mobile/v1/trichozette sends. Editions are structured pages of blocks, not markdown. */
export type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] }
  | { type: "pull"; text: string }
  | { type: "callout"; title: string; text: string }
  | { type: "checklist"; title: string; items: string[] }
  | { type: "quiz"; question: string; options: string[]; answer: number; explain: string }
  | { type: "reveal"; prompt: string; answer: string };

export type Art = { url: string; alt: string; credit: string };

export type NewsItem = { id: string; headline: string; summary: string; whyItMatters: string; date: string; source: string; url: string };

export type Page =
  | { kind: "letter"; title: string; blocks: Block[]; signoff: string }
  | { kind: "article"; kicker: string; title: string; standfirst: string; blocks: Block[]; image: Art }
  | { kind: "image"; caption: string; image: Art }
  | { kind: "glance"; kicker: string; title: string; rows: { label: string; value: string }[] }
  | { kind: "interactive"; kicker: string; title: string; intro: string; blocks: Block[] }
  | { kind: "news"; kicker: string; title: string; intro: string; items: NewsItem[] }
  | {
      kind: "perspectives";
      kicker: string;
      title: string;
      intro: string;
      views: { discipline: "cosmetic" | "clinical" | "medical"; heading: string; blocks: Block[] }[];
    };

export type EditionCard = {
  slug: string;
  number: number;
  label: string;
  title: string;
  fade: string;
  theme: string;
  standfirst: string;
  published: string;
  series: "current" | "archive";
  cover: { url: string; alt: string };
  coverLines: string[];
};

export type Edition = EditionCard & {
  audience: string[];
  pages: Page[];
  sources: { label: string; url: string }[];
};

export type GazetteHome = {
  editions: EditionCard[];
  archive: EditionCard[];
  months: { month: string; items: { id: string; title: string; summary: string | null; date: string }[] }[];
};

export type GazetteItem =
  | { type: "edition"; edition: Edition }
  | {
      type: "article";
      article: { id: string; title: string; summary: string | null; label: string; date: string; blocks: { type: "h2" | "p"; text: string }[] };
    };

export const gazetteKey = ["trichozette"] as const;

/** Paper and ink for the magazine pages. */
export const mag = { paper: "#fbfaf7", ink: "#0b0b0b", soft: "rgba(11,11,11,0.62)", faint: "rgba(11,11,11,0.15)" } as const;
