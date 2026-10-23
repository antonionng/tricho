import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * Private review links. Where REVIEW_TOKEN is set (preview deployments), adding
 * `?review=<REVIEW_TOKEN>` to an edition or event address shows the whole edition, or an
 * event that isn't published yet, to whoever holds the link. Where it isn't set, nothing
 * changes and pages never read the query string, so cached pages stay cached.
 */
export function reviewEnabled() {
  return (process.env.REVIEW_TOKEN ?? "").length >= 24;
}

type SearchParams = Promise<Record<string, string | string[] | undefined>> | undefined;

export async function isReviewLink(searchParams: SearchParams) {
  if (!reviewEnabled() || !searchParams) return false;
  const v = (await searchParams).review;
  const given = Buffer.from(typeof v === "string" ? v : "");
  const want = Buffer.from(process.env.REVIEW_TOKEN ?? "");
  return given.length === want.length && timingSafeEqual(given, want);
}
