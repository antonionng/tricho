import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { rowToPost } from "@/lib/blog";
import { Notice, NoAccess } from "@/components/studio/ui";
import { authors } from "@/content/authors";
import { BLOG_CATEGORIES } from "@/content/blog";
import { guides } from "@/content/guides";
import { glossary } from "@/content/glossary";
import { images } from "@/content/images";
import { writerState } from "@/content/blog/writer";
import { studioPage } from "../../_lib/guard";
import { Editor } from "./Editor";
import { WriterProgress } from "./WriterProgress";
import type { EditorData } from "../types";

export const dynamic = "force-dynamic";

export default async function BlogEditorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
  const { id } = await params;
  const staff = await studioPage(`/studio/blog/${id}`, "gazette.view");
  if (!staff) return <NoAccess what="the blog" />;
  const sp = await searchParams;
  const row = await prisma.blogArticle.findUnique({ where: { id } });
  if (!row) notFound();

  const post = rowToPost(row);
  const ai = writerState(row.ai);
  // The source text stays on the server; the editor only needs what was read.
  const view = ai ? { ...ai, extracts: undefined } : null;

  const data: EditorData = {
    title: row.title,
    slug: row.slug,
    description: row.description,
    category: row.category,
    audience: row.audience,
    author: row.author,
    image: row.image,
    tags: row.tags.join(", "),
    standfirst: row.standfirst,
    answer: row.answer,
    takeaways: row.takeaways.join("\n"),
    body: row.body,
    faqs: post.faqs,
    sources: post.sources,
    relatedGuides: post.related?.guides ?? [],
    relatedGlossary: post.related?.glossary ?? [],
    discipline: post.related?.discipline ?? "",
    featured: row.featured,
    reviewerName: post.reviewer?.name ?? "",
    reviewerCredentials: post.reviewer?.credentials ?? "",
    reviewedOn: post.reviewer?.reviewedOn ?? "",
    targetQuery: row.targetQuery,
  };

  return (
    <div className="space-y-6">
      <Link href="/studio/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All posts
      </Link>
      {sp.notice && <Notice tone="danger">{sp.notice}</Notice>}

      {row.status === "writing" ? (
        <WriterProgress id={row.id} question={row.targetQuery} state={view} canEdit={staff.perms.has("gazette.edit")} />
      ) : (
        <Editor
          id={row.id}
          status={row.status}
          initial={data}
          ai={view}
          canEdit={staff.perms.has("gazette.edit")}
          canPublish={staff.perms.has("gazette.publish")}
          options={{
            categories: BLOG_CATEGORIES.map((c) => ({ value: c.slug, label: c.name })),
            authors: Object.values(authors).map((a) => ({ value: a.id, label: a.name })),
            images: (Object.keys(images) as (keyof typeof images)[]).map((k) => ({ value: k, label: images[k].alt, src: images[k].src })),
            guides: guides.map((g) => ({ value: g.slug, label: g.title })),
            glossary: glossary.map((t) => ({ value: t.slug, label: t.term })),
          }}
        />
      )}
    </div>
  );
}
