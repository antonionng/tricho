/**
 * Pure helpers that turn Studio's GazetteEdition rows into Edition objects and
 * merge them with the built-in editions. No database access here, so this is
 * safe to test and to import anywhere.
 */
import type { NewsItem } from "@/content/news";
import { byNumberDesc, byPeriodDesc, withNews } from "./index";
import { EditionMetaSchema, NewsTopicSchema, PageSchema, SourceSchema } from "./schema";
import type { Edition, Page } from "./types";

/** The columns of a GazetteEdition row this module needs. */
export type EditionRow = {
  id: string;
  slug: string;
  number: number;
  series: string;
  status: string;
  title: string;
  fade: string;
  theme: string;
  standfirst: string;
  coverImageKey: string | null;
  coverTone: string;
  audience: string[];
  period: string | null;
  focus: string | null;
  pages: unknown;
  sources: unknown;
  newsTopics: string[];
  scheduledFor: Date | null;
  publishedAt: Date | null;
};

/** Readers see published editions, and scheduled ones once their time has come. */
export function isLive(row: Pick<EditionRow, "status" | "scheduledFor">, now: Date) {
  if (row.status === "published") return true;
  return row.status === "scheduled" && !!row.scheduledFor && row.scheduledFor.getTime() <= now.getTime();
}

type Log = (message: string) => void;

/**
 * One row as an Edition, with invalid pages dropped and the news page added.
 * Returns null (and logs why) if the row can't be shown at all.
 */
export function rowToEdition(row: EditionRow, log: Log = (m) => console.warn(m)): Edition | null {
  const meta = EditionMetaSchema.safeParse({
    slug: row.slug,
    title: row.title,
    fade: row.fade,
    theme: row.theme,
    standfirst: row.standfirst,
    coverImageKey: row.coverImageKey ?? undefined,
    coverTone: row.coverTone,
    audience: row.audience,
    series: row.series === "archive" ? "archive" : "current",
    period: row.period ?? undefined,
    focus: row.focus ?? undefined,
  });
  if (!meta.success) {
    log(`[gazette] edition ${row.slug} skipped: ${meta.error.issues[0]?.message ?? "invalid metadata"}`);
    return null;
  }

  const pages: Page[] = [];
  const rawPages = Array.isArray(row.pages) ? row.pages : [];
  rawPages.forEach((raw, i) => {
    const parsed = PageSchema.safeParse(raw);
    if (parsed.success) pages.push(parsed.data);
    else log(`[gazette] edition ${row.slug} page ${i + 1} skipped: ${parsed.error.issues[0]?.message ?? "invalid page"}`);
  });
  if (pages.length === 0) {
    log(`[gazette] edition ${row.slug} skipped: it has no valid pages`);
    return null;
  }

  const sources = Array.isArray(row.sources)
    ? row.sources.flatMap((s) => {
        const parsed = SourceSchema.safeParse(s);
        return parsed.success ? [parsed.data] : [];
      })
    : [];

  const when = row.publishedAt ?? row.scheduledFor ?? new Date();
  const edition: Edition = {
    ...meta.data,
    number: row.number,
    published: when.toISOString().slice(0, 10),
    pages,
    ...(sources.length ? { sources } : {}),
  };

  const topics = row.newsTopics.flatMap((t) => {
    const parsed = NewsTopicSchema.safeParse(t);
    return parsed.success ? [parsed.data] : [];
  }) as NewsItem["topics"];
  return topics.length ? withNews(edition, topics) : edition;
}

/**
 * Built-in editions plus Studio editions. A built-in edition wins if both use
 * the same slug. Sorted the same way as src/content/gazette/index.ts.
 */
export function mergeEditions(staticList: Edition[], dbList: Edition[]) {
  const seen = new Set(staticList.map((e) => e.slug));
  const extra = dbList.filter((e) => {
    if (seen.has(e.slug)) return false;
    seen.add(e.slug);
    return true;
  });
  const all = [...staticList, ...extra];
  const editions = all.filter((e) => e.series !== "archive").sort(byNumberDesc);
  const archive = all.filter((e) => e.series === "archive").sort(byPeriodDesc);
  return { editions, archive, all: [...editions, ...archive] };
}

/** The next edition number in a series: one more than the highest so far. Archive numbers are the year followed by a two-digit index. */
export function nextEditionNumber(
  existing: Pick<Edition, "number" | "series" | "period">[],
  series: "current" | "archive",
  period?: string | null
) {
  if (series === "archive") {
    const year = Number(period) || new Date().getUTCFullYear();
    const base = year * 100;
    const inYear = existing.filter((e) => e.series === "archive" && e.number > base && e.number < base + 100);
    return Math.max(base, ...inYear.map((e) => e.number)) + 1;
  }
  const current = existing.filter((e) => e.series !== "archive").map((e) => e.number);
  return Math.max(0, ...current) + 1;
}
