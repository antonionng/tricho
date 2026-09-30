import { notFound } from "next/navigation";
import { EditionView } from "@/components/gazette/EditionView";
import { coverLinesFor } from "@/components/gazette/Cover";
import { coverImage } from "@/components/gazette/art";
import {
  editionBySlug,
  editionLabel,
  editions,
  pageKicker,
  pageTitle,
  PUBLIC_PREVIEW_PAGES,
} from "@/content/gazette";
import { getMemberContext } from "@/lib/member";
import { absoluteUrl, breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";

export function generateStaticParams() {
  return editions.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const e = editionBySlug((await params).slug);
  if (!e) return {};
  return pageMetadata({
    title: `${e.title}: Trichozette, ${editionLabel(e)}`,
    description: e.standfirst,
    path: `/trichozette/${e.slug}`,
    og: { title: e.title, sub: e.fade, eyebrow: `Edition ${String(e.number).padStart(2, "0")}`, img: coverImage(e).src, variant: "cover" },
    type: "article",
    published: e.published,
  });
}

export default async function EditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const edition = editionBySlug((await params).slug);
  if (!edition) notFound();

  const ctx = await getMemberContext();
  const full = ctx.allowed;

  // Members-only pages never leave the server for non-members: only their titles do.
  const visiblePages = full ? edition.pages : edition.pages.slice(0, PUBLIC_PREVIEW_PAGES);
  const lockedTitles = full
    ? []
    : edition.pages.slice(PUBLIC_PREVIEW_PAGES).map((p) => ({ kicker: pageKicker(p), title: pageTitle(p) }));

  return (
    <>
      <EditionView
        nextEdition={editions[(editions.indexOf(edition) + 1) % editions.length]}
        edition={{ ...edition, pages: visiblePages }}
        lockedTitles={lockedTitles}
        signedIn={!!ctx.session}
        coverLines={coverLinesFor(edition)}
      />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "PublicationIssue",
            issueNumber: edition.number,
            name: `${edition.title}. ${edition.fade}`,
            description: edition.standfirst,
            datePublished: edition.published,
            url: absoluteUrl(`/trichozette/${edition.slug}`),
            isAccessibleForFree: false,
            hasPart: {
              "@type": "WebPageElement",
              isAccessibleForFree: false,
              cssSelector: "[data-sheet]",
            },
            isPartOf: { "@type": "Periodical", name: "Trichozette", publisher: { "@type": "Organization", name: site.name } },
          },
          breadcrumbLd([
            { name: "Trichozette", path: "/trichozette" },
            { name: edition.title, path: `/trichozette/${edition.slug}` },
          ]),
        ]}
      />
    </>
  );
}
