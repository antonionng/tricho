import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EditionView } from "@/components/gazette/EditionView";
import { coverLinesFor } from "@/components/gazette/Cover";
import { NoAccess } from "@/components/studio/ui";
import { withNews, type Edition, type ImageKey } from "@/content/gazette";
import { checkPages, IMAGE_KEYS, NEWS_TOPICS } from "@/content/gazette/schema";
import type { NewsItem } from "@/content/news";
import { studioPage } from "../../../_lib/guard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false, nocache: true } };

/** Hides Studio's own chrome so the edition reads exactly as it will on the site. */
const FULL_BLEED = `
body:has([data-gazette-preview]) aside.fixed,
body:has([data-gazette-preview]) header.sticky { display: none !important; }
body:has([data-gazette-preview]) .lg\\:ml-60 { margin-left: 0 !important; }
body:has([data-gazette-preview]) main { max-width: none !important; padding: 0 !important; }
`;

export default async function EditionPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await studioPage(`/studio/gazette/${id}/preview`, "gazette.view"))) return <NoAccess what="Trichozette" />;
  const row = await prisma.gazetteEdition.findUnique({ where: { id } });
  if (!row) notFound();

  const { pages, errors } = checkPages(row.pages);
  const total = Array.isArray(row.pages) ? row.pages.length : 0;
  const base: Edition = {
    number: row.number,
    slug: row.slug,
    title: row.title || "Untitled edition",
    fade: row.fade,
    theme: row.theme,
    standfirst: row.standfirst,
    coverImageKey: (IMAGE_KEYS as string[]).includes(row.coverImageKey ?? "") ? (row.coverImageKey as ImageKey) : undefined,
    coverTone: row.coverTone === "dark" ? "dark" : "light",
    audience: row.audience.filter((a): a is Edition["audience"][number] => ["cosmetic", "clinical", "medical"].includes(a)),
    published: (row.publishedAt ?? row.scheduledFor ?? new Date()).toISOString().slice(0, 10),
    pages,
    series: row.series === "archive" ? "archive" : "current",
    period: row.period ?? undefined,
    focus: (["review", "cosmetic", "clinical", "medical"].includes(row.focus ?? "") ? row.focus : undefined) as Edition["focus"],
    sources: Array.isArray(row.sources) ? (row.sources as Edition["sources"]) : undefined,
  };
  const topics = row.newsTopics.filter((t) => (NEWS_TOPICS as readonly string[]).includes(t)) as NewsItem["topics"];
  const edition = topics.length ? withNews(base, topics) : base;

  return (
    <div data-gazette-preview>
      <style>{FULL_BLEED}</style>
      <div className="fixed bottom-4 left-1/2 z-[95] flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/85 px-4 py-2 text-xs text-white shadow-lg">
        <span>
          Preview of every page, as a member sees it.
          {errors.length > 0 && ` ${total - pages.length} of ${total} pages are hidden because they are unwritten or need fixing.`}
        </span>
        <Link href={`/studio/gazette/${row.id}`} className="underline underline-offset-4">
          Back to the editor
        </Link>
      </div>
      {pages.length === 0 ? (
        <p className="p-10 text-sm">This edition has no finished pages to preview yet.</p>
      ) : (
        <EditionView edition={edition} lockedTitles={[]} signedIn coverLines={coverLinesFor(edition)} />
      )}
    </div>
  );
}
