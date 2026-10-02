import { editionsA } from "./editions-a";
import { editionsB } from "./editions-b";
import { archive2023 } from "./archive-2023";
import { archive2024 } from "./archive-2024";
import { archive2025 } from "./archive-2025";
import { archive2026 } from "./archive-2026";
import { news, type NewsItem } from "@/content/news";
import type { Edition, Page } from "./types";

export * from "./types";

/** Which news topics each edition's "In the news" page draws on. */
const NEWS_TOPICS: Record<string, NewsItem["topics"]> = {
  "the-founding-edition": ["regulation", "events", "business"],
  "from-the-room-whittlebury-park": ["events", "research", "hair-loss"],
  "head-spa-properly": ["head-spa", "products", "regulation"],
  "shedding-season": ["hair-loss", "research"],
  "light-and-devices": ["devices", "research", "regulation"],
  "the-business-of-scalp-care": ["business", "regulation", "products"],
  "textured-hair-and-traction": ["products", "hair-loss", "research"],
  dublin: ["events", "regulation", "hair-loss", "products"],
};

/** The news topics an edition draws on: its own list if given, otherwise the built-in map. */
export function newsFor(e: Edition, topicsOverride?: NewsItem["topics"]): NewsItem[] {
  const topics = topicsOverride ?? NEWS_TOPICS[e.slug] ?? [];
  const scored = news
    .map((n) => ({
      n,
      score:
        n.topics.filter((t) => topics.includes(t)).length * 2 +
        n.disciplines.filter((d) => e.audience.includes(d)).length,
    }))
    .filter((x) => x.score > 1)
    .sort((a, b) => b.score - a.score || b.n.date.localeCompare(a.n.date));
  // Keep a spread of disciplines where possible.
  const picked: NewsItem[] = [];
  for (const d of ["medical", "clinical", "cosmetic"] as const) {
    const hit = scored.find((x) => x.n.disciplines.includes(d) && !picked.includes(x.n));
    if (hit) picked.push(hit.n);
  }
  for (const x of scored) if (picked.length < 5 && !picked.includes(x.n)) picked.push(x.n);
  return picked.sort((a, b) => b.date.localeCompare(a.date));
}

/** Adds the generated "In the news" page after the preview and perspectives, when there are at least two items. */
export function withNews(e: Edition, topicsOverride?: NewsItem["topics"]): Edition {
  const items = newsFor(e, topicsOverride);
  if (items.length < 2) return e;
  const page: Page = {
    kind: "news",
    kicker: "In the news",
    title: "What's happening in the field",
    intro: "Real news from regulators, professional bodies and researchers, chosen for this edition, with a note on why each item matters in practice.",
    items,
  };
  // After the public preview and the three perspectives.
  const pages = [...e.pages];
  pages.splice(Math.min(3, pages.length), 0, page);
  return { ...e, pages };
}

/** Newest monthly edition first. */
export const byNumberDesc = (a: Edition, b: Edition) => b.number - a.number;
/** Newest year first, then in edition order within a year. */
export const byPeriodDesc = (a: Edition, b: Edition) =>
  (b.period ?? "").localeCompare(a.period ?? "") || a.number - b.number;

/** The monthly magazine, newest first. Built-in editions only: server code reads src/content/gazette/loader.ts to include Studio editions. */
export const editions: Edition[] = [...editionsA, ...editionsB]
  .map((e) => withNews(e))
  .sort(byNumberDesc);

/** "Four years in review": look-back editions for 2023–2026, newest year first. */
export const archive: Edition[] = [...archive2026, ...archive2025, ...archive2024, ...archive2023]
  .map((e) => ({ ...e, series: "archive" as const }))
  .sort(byPeriodDesc);

/** Everything readable, for lookups, the sitemap and static params. */
export const allEditions: Edition[] = [...editions, ...archive];

export function editionBySlug(slug: string) {
  return allEditions.find((e) => e.slug === slug);
}

export function pageTitle(p: Page): string {
  switch (p.kind) {
    case "letter":
    case "article":
    case "glance":
    case "interactive":
    case "perspectives":
    case "news":
      return p.title;
    case "image":
      return p.caption;
  }
}

export function pageKicker(p: Page): string {
  switch (p.kind) {
    case "letter":
      return "Letter";
    case "article":
    case "glance":
    case "interactive":
    case "perspectives":
    case "news":
      return p.kicker;
    case "image":
      return "Photograph";
  }
}

export const editionLabel = (e: Pick<Edition, "number" | "series" | "period" | "focus">) =>
  e.series === "archive"
    ? `${e.period} · ${FOCUS_LABEL[e.focus ?? "review"]}`
    : `Edition ${String(e.number).padStart(2, "0")}`;

export const FOCUS_LABEL = {
  review: "Year in review",
  cosmetic: "Cosmetic",
  clinical: "Clinical",
  medical: "Medical",
} as const;
