import { site } from "@/config/site";
import { authorOf, categoryName, lastUpdated, type BlogPost } from "@/content/blog";
import { guides, type Guide } from "@/content/guides";
import { glossary } from "@/content/glossary";
import { courses } from "@/content/courses";
import { DISCIPLINES } from "@/content/disciplines";
import { absoluteUrl } from "@/lib/seo";

/**
 * Plain Markdown versions of the site's public writing, for AI assistants and answer engines.
 * See https://llmstxt.org for the llms.txt convention.
 */

const DISCLAIMER = "This is general information, not medical advice. If you are worried about your hair or scalp, speak to your GP.";

export function postMarkdown(p: BlogPost) {
  const author = authorOf(p);
  return [
    `# ${p.title}`,
    "",
    `> ${p.description}`,
    "",
    `- URL: ${absoluteUrl(`/blog/${p.slug}`)}`,
    `- Topic: ${categoryName(p.category)}`,
    `- Author: ${author.name} (${author.role})`,
    `- Published: ${p.published}`,
    `- Last updated: ${lastUpdated(p)}`,
    `- Clinical review: ${p.reviewer ? `${p.reviewer.name}, ${p.reviewer.credentials}, ${p.reviewer.reviewedOn}` : "in progress"}`,
    "",
    p.standfirst,
    "",
    "## The short answer",
    "",
    p.answer,
    "",
    "## Key points",
    "",
    ...p.takeaways.map((t) => `- ${t}`),
    "",
    p.body.replace(/\]\(\//g, `](${site.url}/`),
    "",
    "## Common questions",
    "",
    ...p.faqs.flatMap((f) => [`### ${f.q}`, "", f.a, ""]),
    "## Sources",
    "",
    ...p.sources.map((s) => `- [${s.label}](${s.url})`),
    "",
    `_${DISCLAIMER}_`,
    "",
  ].join("\n");
}

export function guideMarkdown(g: Guide) {
  return [
    `# ${g.title}`,
    "",
    `> ${g.description}`,
    "",
    `- URL: ${absoluteUrl(`/guides/${g.slug}`)}`,
    `- Topic: ${g.category}`,
    `- Author: ${site.name} editorial team`,
    `- Last updated: ${g.updated ?? g.published}`,
    "",
    g.intro,
    "",
    ...g.sections.flatMap((s) => [`## ${s.heading}`, "", ...s.body.flatMap((b) => [b, ""])]),
    "## Common questions",
    "",
    ...g.faqs.flatMap((f) => [`### ${f.q}`, "", f.a, ""]),
    `_${DISCLAIMER}_`,
    "",
  ].join("\n");
}

const link = (title: string, path: string, note?: string) => `- [${title}](${absoluteUrl(path)})${note ? `: ${note}` : ""}`;

/** The short index: who we are and where the useful pages are. */
export function llmsTxt(blogPosts: BlogPost[]) {
  return [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `${site.name} was founded by ${site.founderFull}, a trichologist with more than twenty years in the hair industry. It serves Ireland and the UK. Content explains hair and scalp care in plain British English and always says when someone should see a GP; it never diagnoses.`,
    "",
    "Every blog post and guide below is also available as plain Markdown by adding `.md` to its URL. The complete text of all of them is at:",
    "",
    link("Full text for language models", "/llms-full.txt"),
    "",
    "## Blog",
    "",
    ...blogPosts.map((p) => link(p.title, `/blog/${p.slug}.md`, p.description)),
    "",
    "## Guides for clients and patients",
    "",
    ...guides.map((g) => link(g.title, `/guides/${g.slug}.md`, g.description)),
    "",
    "## Glossary",
    "",
    ...glossary.map((t) => link(t.term, `/glossary/${t.slug}`, t.short)),
    "",
    "## Find a professional",
    "",
    link("Directory of hair and scalp professionals", "/directory", "Search cosmetic, clinical and medical practitioners across Ireland and the UK."),
    ...DISCIPLINES.map((d) => link(d.plural, `/directory/${d.slug}`, d.role)),
    "",
    "## For professionals",
    "",
    link("Membership and pricing", "/pricing"),
    link("Courses", "/learn", "Short CPD courses with a certificate."),
    ...courses.map((c) => link(c.title, `/courses/${c.slug}`, c.summary)),
    link("Trichozette", "/trichozette", "The monthly members' magazine."),
    link("Events", "/events"),
    "",
    "## Optional",
    "",
    link("About", "/about"),
    link("Contact", "/contact"),
    link("RSS feed", "/blog/feed.xml"),
    "",
  ].join("\n");
}

/** Everything in one file, so an assistant can read the whole library in a single request. */
export function llmsFullTxt(blogPosts: BlogPost[]) {
  return [
    `# ${site.name}: full text`,
    "",
    `> ${site.description}`,
    "",
    `Generated from ${absoluteUrl("/")}. Please cite the URL given at the top of each document.`,
    "",
    "---",
    "",
    ...blogPosts.flatMap((p) => [postMarkdown(p), "---", ""]),
    ...guides.flatMap((g) => [guideMarkdown(g), "---", ""]),
    "# Glossary",
    "",
    ...glossary.flatMap((t) => [`## ${t.term}`, "", `URL: ${absoluteUrl(`/glossary/${t.slug}`)}`, "", ...t.body.flatMap((b) => [b, ""])]),
  ].join("\n");
}

export function markdownResponse(body: string, canonicalPath?: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      // The HTML page is the one to rank; this copy is for machines.
      ...(canonicalPath ? { Link: `<${absoluteUrl(canonicalPath)}>; rel="canonical"`, "X-Robots-Tag": "noindex" } : {}),
    },
  });
}
