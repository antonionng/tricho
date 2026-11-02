import { z } from "zod";
import { authors } from "@/content/authors";
import { images } from "@/content/images";
import { BLOG_CATEGORIES, type BlogPost } from "./types";

export const CATEGORY_SLUGS = BLOG_CATEGORIES.map((c) => c.slug) as [BlogPost["category"], ...BlogPost["category"][]];
export const IMAGE_KEYS = Object.keys(images) as [BlogPost["image"], ...BlogPost["image"][]];
export const AUTHOR_IDS = Object.keys(authors) as [BlogPost["author"], ...BlogPost["author"][]];

const text = (min: number, label: string) => z.string().trim().min(min, `${label} is missing or too short.`);

/** What a post must have before readers can see it. Studio checks this on publish. */
export const BlogPostSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "The web address can only use lower-case letters, numbers and hyphens."),
  title: text(10, "The title").max(90, "The title is too long."),
  description: text(50, "The description").max(200, "The description is too long."),
  category: z.enum(CATEGORY_SLUGS),
  audience: z.enum(["public", "professional", "both"]),
  tags: z.array(z.string().trim().min(1)).max(12),
  author: z.enum(AUTHOR_IDS),
  published: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reviewer: z.object({ name: z.string().min(2), credentials: z.string().min(2), reviewedOn: z.string() }).nullable(),
  image: z.enum(IMAGE_KEYS),
  standfirst: text(40, "The standfirst"),
  answer: text(40, "The short answer"),
  takeaways: z.array(z.string().trim().min(5)).min(2, "Add at least two key points.").max(6),
  body: text(400, "The body"),
  faqs: z.array(z.object({ q: z.string().trim().min(5), a: z.string().trim().min(10) })).max(8),
  sources: z.array(z.object({ label: z.string().trim().min(2), url: z.string().url().startsWith("https://") })).min(1, "Cite at least one source."),
  related: z
    .object({
      guides: z.array(z.string()).optional(),
      glossary: z.array(z.string()).optional(),
      discipline: z.enum(["cosmetic", "clinical", "medical"]).optional(),
    })
    .optional(),
  featured: z.boolean().optional(),
}) satisfies z.ZodType<BlogPost>;

export function describeIssues(error: z.ZodError) {
  return error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message));
}
