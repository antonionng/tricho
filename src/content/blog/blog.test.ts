import { describe, expect, it } from "vitest";
import { BLOG_CATEGORIES, filePosts as blogPosts, headingsOf, relatedPosts } from "./index";
import { scorePost } from "./quality";
import { BlogPostSchema } from "./schema";
import { guides } from "../guides";
import { glossary } from "../glossary";
import { images } from "../images";
import { postMarkdown } from "@/lib/llms";

const BANNED = /\b(unlock|elevate|seamless|empower(ing)?|game-?changer|revolutioni[sz]e|delve|cutting-edge|world-class)\b/i;

describe("blog posts", () => {
  it("have unique, URL-safe slugs", () => {
    expect(new Set(blogPosts.map((p) => p.slug)).size).toBe(blogPosts.length);
    for (const p of blogPosts) expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("have titles and descriptions that fit in search results", () => {
    for (const p of blogPosts) {
      expect(p.title.length, p.slug).toBeLessThanOrEqual(60);
      expect(p.description.length, p.slug).toBeGreaterThanOrEqual(120);
      expect(p.description.length, p.slug).toBeLessThanOrEqual(160);
    }
  });

  it("open with a short answer an assistant can quote whole", () => {
    for (const p of blogPosts) {
      const words = p.answer.split(/\s+/).length;
      expect(words, p.slug).toBeGreaterThanOrEqual(40);
      expect(words, p.slug).toBeLessThanOrEqual(75);
      expect(p.takeaways.length, p.slug).toBeGreaterThanOrEqual(3);
      expect(p.takeaways.length, p.slug).toBeLessThanOrEqual(5);
    }
  });

  it("have at least four sections, unique headings and no top-level heading in the body", () => {
    for (const p of blogPosts) {
      const h = headingsOf(p.body);
      expect(h.length, p.slug).toBeGreaterThanOrEqual(4);
      expect(new Set(h.map((x) => x.id)).size, p.slug).toBe(h.length);
      expect(p.body, p.slug).not.toMatch(/^# /m);
    }
  });

  it("cite https sources and have three to five FAQs", () => {
    for (const p of blogPosts) {
      expect(p.sources.length, p.slug).toBeGreaterThanOrEqual(2);
      for (const s of p.sources) expect(s.url).toMatch(/^https:\/\//);
      expect(p.faqs.length, p.slug).toBeGreaterThanOrEqual(3);
      expect(p.faqs.length, p.slug).toBeLessThanOrEqual(5);
    }
  });

  it("only link to things that exist", () => {
    const categories = BLOG_CATEGORIES.map((c) => c.slug as string);
    for (const p of blogPosts) {
      expect(categories).toContain(p.category);
      expect(images).toHaveProperty(p.image);
      for (const g of p.related?.guides ?? []) expect(guides.map((x) => x.slug), p.slug).toContain(g);
      for (const t of p.related?.glossary ?? []) expect(glossary.map((x) => x.slug), p.slug).toContain(t);
      for (const [, href] of p.body.matchAll(/\]\((\/[^)#]*)/g)) {
        const [, section, slug] = href.split("/");
        if (section === "blog" && slug) expect(blogPosts.map((x) => x.slug), `${p.slug} → ${href}`).toContain(slug);
        if (section === "guides" && slug) expect(guides.map((x) => x.slug), `${p.slug} → ${href}`).toContain(slug);
      }
    }
  });

  it("avoid the words we never use", () => {
    for (const p of blogPosts) {
      const text = [p.title, p.description, p.standfirst, p.answer, ...p.takeaways, p.body].join(" ");
      expect(text, p.slug).not.toMatch(BANNED);
    }
  });

  it("are dated as real ISO dates", () => {
    for (const p of blogPosts) {
      expect(p.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(new Date(p.published).getTime())).toBe(false);
    }
  });

  it("suggest related posts other than themselves", () => {
    for (const p of blogPosts) expect(relatedPosts(blogPosts, p).map((r) => r.slug)).not.toContain(p.slug);
  });

  it("pass the publishing schema", () => {
    for (const p of blogPosts) expect(BlogPostSchema.safeParse(p).success, p.slug).toBe(true);
  });

  it("score at least 90 for search and answer engines", () => {
    for (const p of blogPosts) {
      const { score, checks } = scorePost(p);
      const failing = checks.filter((c) => !c.ok && c.id !== "reviewer").map((c) => `${c.label}: ${c.hint}`);
      expect(score, `${p.slug}\n${failing.join("\n")}`).toBeGreaterThanOrEqual(90);
    }
  });

  it("export to Markdown with absolute links", () => {
    for (const p of blogPosts) {
      const md = postMarkdown(p);
      expect(md.startsWith(`# ${p.title}`)).toBe(true);
      expect(md).not.toMatch(/\]\(\//);
    }
  });
});
