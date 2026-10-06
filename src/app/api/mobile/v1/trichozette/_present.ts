import "server-only";
import { coverLinesFor } from "@/components/gazette/cover-lines";
import { artFor, coverImage, img } from "@/components/gazette/art";
import { editionLabel, type Edition } from "@/content/gazette";

/** An edition as a cover on the shelf. */
export function editionCard(e: Edition) {
  const cover = coverImage(e);
  return {
    slug: e.slug,
    number: e.number,
    label: editionLabel(e),
    title: e.title,
    fade: e.fade,
    theme: e.theme,
    standfirst: e.standfirst,
    published:
      e.series === "archive"
        ? `Looking back at ${e.period}`
        : new Date(e.published).toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    series: e.series ?? "current",
    cover: { url: img(cover, 900), alt: cover.alt },
    coverLines: coverLinesFor(e),
  };
}

/** A whole edition for the reader, with the photograph chosen for each feature and spread. */
export function editionForReader(e: Edition) {
  return {
    ...editionCard(e),
    audience: e.audience,
    pages: e.pages.map((page, i) => {
      if (page.kind === "article" || page.kind === "image") {
        const art = artFor(e, page, i);
        return { ...page, image: { url: img(art, 1400), alt: art.alt, credit: art.credit } };
      }
      return page;
    }),
    sources: e.sources ?? [],
  };
}
