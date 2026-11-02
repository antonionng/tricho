import "server-only";
import { cache } from "react";
import type { BlogArticle } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { filePosts, newestFirst, type BlogPost } from "@/content/blog";
import { BlogPostSchema } from "@/content/blog/schema";

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** A Studio row as a post, whatever state it is in. Used by the editor's preview. */
export function rowToPost(row: BlogArticle): BlogPost {
  const published = isoDay(row.publishedAt ?? row.createdAt);
  const updated = isoDay(row.updatedAt);
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category as BlogPost["category"],
    audience: row.audience as BlogPost["audience"],
    tags: row.tags,
    author: row.author as BlogPost["author"],
    published,
    // Only show "Updated" once the change is a day or more after publication.
    ...(updated > published ? { updated } : {}),
    reviewer: (row.reviewer as BlogPost["reviewer"]) ?? null,
    image: row.image as BlogPost["image"],
    standfirst: row.standfirst,
    answer: row.answer,
    takeaways: row.takeaways,
    body: row.body.trim(),
    faqs: Array.isArray(row.faqs) ? (row.faqs as BlogPost["faqs"]) : [],
    sources: Array.isArray(row.sources) ? (row.sources as BlogPost["sources"]) : [],
    related: (row.related as BlogPost["related"]) ?? undefined,
    featured: row.featured,
  };
}

/**
 * Every post readers can see: the ones in code plus published Studio posts.
 * A Studio post that no longer passes the schema is left out rather than shown broken,
 * and if the database can't be read (or the migration hasn't run) the blog still works.
 */
export const getAllPosts = cache(async (): Promise<BlogPost[]> => {
  let fromDb: BlogPost[] = [];
  try {
    const rows = await prisma.blogArticle.findMany({ where: { status: "published" }, orderBy: { publishedAt: "desc" } });
    fromDb = rows.flatMap((row) => {
      const parsed = BlogPostSchema.safeParse(rowToPost(row));
      if (!parsed.success) console.error(`[blog] skipped "${row.slug}": it no longer passes the schema`);
      return parsed.success ? [parsed.data] : [];
    });
  } catch (error) {
    console.error("[blog] couldn't load Studio posts, showing the posts in code only", error);
  }
  // A post in code wins over a Studio post with the same address.
  const taken = new Set(filePosts.map((p) => p.slug));
  return [...filePosts, ...fromDb.filter((p) => !taken.has(p.slug))].sort(newestFirst);
});

export async function getPost(slug: string) {
  return (await getAllPosts()).find((p) => p.slug === slug);
}
