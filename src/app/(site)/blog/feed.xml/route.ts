import { site } from "@/config/site";
import { authorOf, categoryName, lastUpdated } from "@/content/blog";
import { getAllPosts } from "@/lib/blog";
import { images, img } from "@/content/images";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 300;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const blogPosts = await getAllPosts();
  const items = blogPosts
    .map((p) => {
      const url = absoluteUrl(`/blog/${p.slug}`);
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(p.standfirst)}</description>
      <category>${esc(categoryName(p.category))}</category>
      <dc:creator>${esc(authorOf(p).name)}</dc:creator>
      <pubDate>${new Date(p.published).toUTCString()}</pubDate>
      <enclosure url="${esc(img(images[p.image], 1200))}" type="image/jpeg" length="0" />
    </item>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${esc(site.name)} blog</title>
    <link>${absoluteUrl("/blog")}</link>
    <atom:link href="${absoluteUrl("/blog/feed.xml")}" rel="self" type="application/rss+xml" />
    <description>Sourced, practical writing on hair loss, scalp health, consultations, head spa and trichology careers.</description>
    <language>en-gb</language>
    <lastBuildDate>${new Date(lastUpdated(blogPosts[0])).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
