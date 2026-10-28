"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/staff";
import { rowToPost } from "@/lib/blog";
import { aiAvailable } from "@/agents/ai";
import { freshState, uniqueSlug } from "@/agents/blog-writer";
import { isFetchableUrl } from "@/agents/research";
import { filePosts } from "@/content/blog";
import { BlogPostSchema, describeIssues } from "@/content/blog/schema";
import { writerState } from "@/content/blog/writer";
import type { EditorData } from "./types";

const asJson = (v: unknown) => JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
const s = (form: FormData, key: string, max = 4000) => String(form.get(key) ?? "").trim().slice(0, max);

/** The public pages a Studio post can appear on. */
function revalidatePublic(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/blog/topic/[category]", "page");
  revalidatePath("/blog/feed.xml");
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");
  if (slug) {
    revalidatePath(`/blog/${slug}`);
    revalidatePath(`/md/blog/${slug}`);
  }
}

/** Start a post from a question. The editor page runs the writer as soon as it opens. */
export async function createBlogPost(form: FormData) {
  const staff = await requirePermission("gazette.edit");
  const targetQuery = s(form, "targetQuery", 200);
  if (targetQuery.length < 8) redirect("/studio/blog/new?notice=" + encodeURIComponent("Write the question the post should answer."));
  const urls = s(form, "sourceUrls", 4000)
    .split(/\s+/)
    .filter(Boolean);
  const bad = urls.filter((u) => !isFetchableUrl(u));
  if (bad.length) redirect("/studio/blog/new?notice=" + encodeURIComponent(`These can't be read: ${bad.join(", ")}. Use full https addresses of public pages.`));

  const audience = ["public", "professional", "both"].includes(s(form, "audience")) ? s(form, "audience") : "both";
  const row = await prisma.blogArticle.create({
    data: {
      slug: await uniqueSlug(targetQuery),
      status: aiAvailable() ? "writing" : "draft",
      title: targetQuery.slice(0, 90),
      targetQuery,
      brief: s(form, "brief") || null,
      audience,
      ...(s(form, "category") ? { category: s(form, "category") } : {}),
      sourceUrls: urls.slice(0, 6),
      tags: [],
      takeaways: [],
      ai: aiAvailable() ? asJson(freshState()) : undefined,
      createdById: staff.userId,
      updatedById: staff.userId,
    },
  });
  await audit(staff, { action: "blog.create", targetType: "blog_article", targetId: row.id, summary: `Started a blog post: "${targetQuery}".` });
  revalidatePath("/studio/blog");
  redirect(`/studio/blog/${row.id}`);
}

export type SaveResult = { ok: boolean; message: string; issues?: string[]; slug?: string };

function toRowData(d: EditorData) {
  const lines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);
  return {
    title: d.title.trim(),
    description: d.description.trim(),
    category: d.category,
    audience: d.audience,
    author: d.author,
    image: d.image,
    tags: d.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 12),
    standfirst: d.standfirst.trim(),
    answer: d.answer.trim(),
    takeaways: lines(d.takeaways).map((t) => t.replace(/^[-•]\s*/, "")),
    body: d.body.trim(),
    faqs: asJson(d.faqs.filter((f) => f.q.trim() || f.a.trim()).map((f) => ({ q: f.q.trim(), a: f.a.trim() }))),
    sources: asJson(d.sources.filter((x) => x.url.trim()).map((x) => ({ label: x.label.trim() || x.url.trim(), url: x.url.trim() }))),
    related: asJson({
      guides: d.relatedGuides,
      glossary: d.relatedGlossary,
      ...(d.discipline ? { discipline: d.discipline } : {}),
    }),
    reviewer: d.reviewerName.trim()
      ? asJson({ name: d.reviewerName.trim(), credentials: d.reviewerCredentials.trim(), reviewedOn: d.reviewedOn || new Date().toISOString().slice(0, 10) })
      : (null as unknown as Prisma.InputJsonValue),
    featured: d.featured,
    targetQuery: d.targetQuery.trim(),
  };
}

export async function saveBlogPost(id: string, d: EditorData): Promise<SaveResult> {
  const staff = await requirePermission("gazette.edit");
  const row = await prisma.blogArticle.findUnique({ where: { id } });
  if (!row) return { ok: false, message: "That post no longer exists." };
  if (writerState(row.ai)?.lockedUntil && new Date(writerState(row.ai)!.lockedUntil!) > new Date())
    return { ok: false, message: "The writer is still working on this post. Save again when it has finished." };

  const slug = d.slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return { ok: false, message: "The web address can only use lower-case letters, numbers and hyphens." };
  const clash = filePosts.some((p) => p.slug === slug) || !!(await prisma.blogArticle.findFirst({ where: { slug, id: { not: id } }, select: { id: true } }));
  if (clash) return { ok: false, message: "Another post already uses that web address." };

  const data = { ...toRowData(d), slug, updatedById: staff.userId };
  // A live post must stay valid, so check it before saving rather than after.
  if (row.status === "published") {
    const parsed = BlogPostSchema.safeParse(rowToPost({ ...row, ...data, faqs: data.faqs, sources: data.sources, related: data.related, reviewer: data.reviewer } as typeof row));
    if (!parsed.success) return { ok: false, message: "This post is live, so these need fixing before it can be saved:", issues: describeIssues(parsed.error) };
  }
  if (row.status === "published" && slug !== row.slug) return { ok: false, message: "Unpublish the post before changing its web address, so existing links keep working." };

  await prisma.blogArticle.update({ where: { id }, data });
  revalidatePath(`/studio/blog/${id}`);
  revalidatePath("/studio/blog");
  if (row.status === "published") revalidatePublic(slug);
  return { ok: true, message: row.status === "published" ? "Saved. The live post is updated." : "Saved.", slug };
}

export async function publishBlogPost(id: string): Promise<SaveResult> {
  const staff = await requirePermission("gazette.publish");
  const row = await prisma.blogArticle.findUnique({ where: { id } });
  if (!row) return { ok: false, message: "That post no longer exists." };
  if (row.status === "writing") return { ok: false, message: "Wait for the writer to finish first." };
  const parsed = BlogPostSchema.safeParse(rowToPost({ ...row, publishedAt: row.publishedAt ?? new Date() }));
  if (!parsed.success) return { ok: false, message: "Fix these before publishing:", issues: describeIssues(parsed.error) };

  await prisma.blogArticle.update({ where: { id }, data: { status: "published", publishedAt: row.publishedAt ?? new Date(), updatedById: staff.userId } });
  await audit(staff, { action: "blog.publish", targetType: "blog_article", targetId: id, summary: `Published the blog post "${row.title}".` });
  revalidatePublic(row.slug);
  revalidatePath(`/studio/blog/${id}`);
  revalidatePath("/studio/blog");
  return { ok: true, message: "Published. It is live on the blog, in the sitemap, the RSS feed and llms.txt." };
}

export async function unpublishBlogPost(id: string): Promise<SaveResult> {
  const staff = await requirePermission("gazette.publish");
  const row = await prisma.blogArticle.update({ where: { id }, data: { status: "draft", updatedById: staff.userId } });
  await audit(staff, { action: "blog.unpublish", targetType: "blog_article", targetId: id, summary: `Took the blog post "${row.title}" off the site.` });
  revalidatePublic(row.slug);
  revalidatePath(`/studio/blog/${id}`);
  revalidatePath("/studio/blog");
  return { ok: true, message: "Taken off the site. It is a draft again." };
}

export async function archiveBlogPost(id: string) {
  const staff = await requirePermission("gazette.edit");
  const row = await prisma.blogArticle.findUnique({ where: { id }, select: { status: true, title: true, slug: true } });
  if (!row) redirect("/studio/blog");
  if (row.status === "published") redirect(`/studio/blog/${id}?notice=${encodeURIComponent("Unpublish the post before archiving it.")}`);
  await prisma.blogArticle.update({ where: { id }, data: { status: "archived", updatedById: staff.userId } });
  await audit(staff, { action: "blog.archive", targetType: "blog_article", targetId: id, summary: `Archived the blog post "${row.title}".` });
  revalidatePath("/studio/blog");
  redirect("/studio/blog?notice=" + encodeURIComponent(`Archived "${row.title}".`));
}

/** Ask the writer for a new version, guided by the editor's note. */
export async function rewriteBlogPost(id: string, note: string): Promise<SaveResult> {
  const staff = await requirePermission("gazette.edit");
  if (!aiAvailable()) return { ok: false, message: "The AI writer needs AI_GATEWAY_API_KEY to be set." };
  const row = await prisma.blogArticle.findUnique({ where: { id } });
  if (!row) return { ok: false, message: "That post no longer exists." };
  if (row.status === "published") return { ok: false, message: "Unpublish the post first, so readers never see a half-written version." };
  await prisma.blogArticle.update({
    where: { id },
    data: { status: "writing", ai: asJson(freshState(note.trim().slice(0, 1500) || "Make it clearer, more practical and better supported by the sources.")), updatedById: staff.userId },
  });
  await audit(staff, { action: "blog.rewrite", targetType: "blog_article", targetId: id, summary: `Asked the AI writer to rewrite "${row.title}".` });
  revalidatePath(`/studio/blog/${id}`);
  return { ok: true, message: "The writer has started." };
}
