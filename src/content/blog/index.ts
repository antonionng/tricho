import { authors } from "@/content/authors";
import { BLOG_CATEGORIES, type BlogCategorySlug, type BlogPost } from "./types";
import { post as redFlags } from "./posts/red-flags-in-a-hair-and-scalp-consultation";
import { post as becomeTrichologist } from "./posts/how-to-become-a-trichologist";
import { post as trichoscopy } from "./posts/what-trichoscopy-can-and-cannot-tell-you";
import { post as postpartum } from "./posts/postpartum-hair-loss";
import { post as headSpaSalon } from "./posts/adding-head-spa-to-your-salon";

export * from "./types";

/**
 * Posts kept in code, newest first. Posts written in Studio live in the database;
 * src/lib/blog.ts merges the two, so pages should load posts from there.
 */
export const filePosts: BlogPost[] = [redFlags, becomeTrichologist, trichoscopy, postpartum, headSpaSalon]
  .map((p) => ({ ...p, body: p.body.trim() }))
  .sort(newestFirst);

export function newestFirst(a: BlogPost, b: BlogPost) {
  return b.published.localeCompare(a.published);
}

export const categoryBySlug = (slug: string) => BLOG_CATEGORIES.find((c) => c.slug === slug);

export const categoryName = (slug: BlogCategorySlug) => categoryBySlug(slug)!.name;

/** Categories that have at least one post, in their listed order. */
export const activeCategories = (posts: BlogPost[]) => BLOG_CATEGORIES.filter((c) => posts.some((p) => p.category === c.slug));

export const postsIn = (posts: BlogPost[], category: string) => posts.filter((p) => p.category === category);

export const authorOf = (p: BlogPost) => authors[p.author];

export const lastUpdated = (p: BlogPost) => p.updated ?? p.published;

/** The post that leads the blog page: the newest featured one, or simply the newest. */
export function leadPost(posts: BlogPost[]) {
  return posts.find((p) => p.featured) ?? posts[0];
}

/** Posts in the same category first, then posts that share the most tags. */
export function relatedPosts(posts: BlogPost[], p: BlogPost, count = 3) {
  const score = (o: BlogPost) =>
    (o.category === p.category ? 10 : 0) + o.tags.filter((t) => p.tags.includes(t)).length;
  return posts
    .filter((o) => o.slug !== p.slug)
    .map((o) => ({ o, s: score(o) }))
    .sort((a, b) => b.s - a.s || b.o.published.localeCompare(a.o.published))
    .slice(0, count)
    .map(({ o }) => o);
}

export function headingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** The "##" sections of a post, for the contents list. */
export function headingsOf(body: string) {
  return [...body.matchAll(/^## (.+)$/gm)].map((m) => ({ id: headingId(m[1]), text: m[1].trim() }));
}

export function wordCount(p: BlogPost) {
  const text = [p.standfirst, p.answer, ...p.takeaways, p.body, ...p.faqs.flatMap((f) => [f.q, f.a])].join(" ");
  return text.replace(/[#*_`>\-[\]()]/g, " ").split(/\s+/).filter(Boolean).length;
}

export function readingMinutes(p: BlogPost) {
  return Math.max(1, Math.round(wordCount(p) / 220));
}
