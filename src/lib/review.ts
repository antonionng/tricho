import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * Private review links for Trichozette. Where REVIEW_TOKEN is set (preview deployments),
 * adding `?review=<REVIEW_TOKEN>` to an edition's address shows the whole edition to whoever
 * holds the link. Where it isn't set, nothing changes and the query string is never read.
 * Only use it on pages that already render per request (the edition reader does), because
 * reading the query string on a cached page breaks it.
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
