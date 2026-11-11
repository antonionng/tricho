/** One thing to read in the hub feed, whatever it came from. */
export type HubFeedItem = {
  kind: "article" | "guide" | "piece";
  title: string;
  summary: string;
  href: string;
  date: string;
};

/**
 * The hub feed: blog posts, guides and library pieces written for the public, newest
 * first. Anything marked for professionals only is left out. Blog posts marked "both"
 * are written for the public too, so they are included.
 */
export function hubFeed(
  src: {
    posts: { slug: string; title: string; description: string; audience: string; published: string }[];
    guides: { slug: string; title: string; description: string; audience: string; published: string; updated?: string }[];
    pieces: { id: string; title: string; summary: string; audience: string; createdAt: Date }[];
  },
  limit = 24
): HubFeedItem[] {
  const items: HubFeedItem[] = [
    ...src.posts
      .filter((p) => p.audience === "public" || p.audience === "both")
      .map((p) => ({ kind: "article" as const, title: p.title, summary: p.description, href: `/blog/${p.slug}`, date: p.published })),
    ...src.guides
      .filter((g) => g.audience === "public")
      .map((g) => ({ kind: "guide" as const, title: g.title, summary: g.description, href: `/guides/${g.slug}`, date: g.updated ?? g.published })),
    ...src.pieces
      .filter((p) => p.audience === "public")
      .map((p) => ({
        kind: "piece" as const,
        title: p.title,
        summary: p.summary,
        href: `/hub/read/${p.id}`,
        date: p.createdAt.toISOString().slice(0, 10),
      })),
  ];
  return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export const FEED_KIND_LABEL: Record<HubFeedItem["kind"], string> = {
  article: "Article",
  guide: "Guide",
  piece: "From our team",
};
