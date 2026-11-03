import { describe, expect, it } from "vitest";
import { hubFeed } from "./hub-feed";

describe("hubFeed", () => {
  const src = {
    posts: [
      { slug: "pub", title: "Public post", description: "d", audience: "public", published: "2026-10-01" },
      { slug: "both", title: "Both post", description: "d", audience: "both", published: "2026-10-03" },
      { slug: "pro", title: "Pro post", description: "d", audience: "professional", published: "2026-10-05" },
    ],
    guides: [
      { slug: "g-pub", title: "Public guide", description: "d", audience: "public", published: "2026-09-01", updated: "2026-10-04" },
      { slug: "g-pro", title: "Pro guide", description: "d", audience: "professional", published: "2026-10-06" },
    ],
    pieces: [
      { id: "p1", title: "Public piece", summary: "s", audience: "public", createdAt: new Date("2026-10-02") },
      { id: "p2", title: "Clinical piece", summary: "s", audience: "clinical", createdAt: new Date("2026-10-07") },
    ],
  };

  it("never includes anything for professionals only", () => {
    const titles = hubFeed(src).map((i) => i.title);
    expect(titles).not.toContain("Pro post");
    expect(titles).not.toContain("Pro guide");
    expect(titles).not.toContain("Clinical piece");
  });

  it("is newest first, with links that stay out of the member area", () => {
    const feed = hubFeed(src);
    expect(feed.map((i) => i.title)).toEqual(["Public guide", "Both post", "Public piece", "Public post"]);
    expect(feed.map((i) => i.href)).toEqual(["/guides/g-pub", "/blog/both", "/hub/read/p1", "/blog/pub"]);
    for (const i of feed) expect(i.href.startsWith("/members")).toBe(false);
  });

  it("respects the limit", () => {
    expect(hubFeed(src, 2)).toHaveLength(2);
  });
});
