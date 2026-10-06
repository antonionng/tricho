import { pageTitle, type Edition } from "@/content/gazette";

/** Cover lines from the edition's features, newsstand style. Kept apart from Cover so route handlers can use it without the magazine fonts. */
export function coverLinesFor(edition: Edition, n = 3) {
  return edition.pages
    .filter((p) => p.kind === "article" || p.kind === "perspectives" || p.kind === "interactive")
    .slice(0, n)
    .map((p) => pageTitle(p));
}
