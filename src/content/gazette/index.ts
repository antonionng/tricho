import { editionsA } from "./editions-a";
import { editionsB } from "./editions-b";
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

function newsFor(e: Edition): NewsItem[] {
  const topics = NEWS_TOPICS[e.slug] ?? [];
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

function withNews(e: Edition): Edition {
  const items = newsFor(e);
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

/** All editions, newest first. */
export const editions: Edition[] = [...editionsA, ...editionsB]
  .map(withNews)
  .sort((a, b) => b.number - a.number);

export function editionBySlug(slug: string) {
  return editions.find((e) => e.slug === slug);
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

export const editionLabel = (e: Pick<Edition, "number">) => `Edition ${String(e.number).padStart(2, "0")}`;
