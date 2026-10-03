import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";
import { guides } from "@/content/guides";
import { getAllEditions } from "@/content/gazette/loader";
import { glossary } from "@/content/glossary";
import { courses } from "@/content/courses";
import { CHAPTERS } from "@/content/chapters";
import { DISCIPLINES } from "@/content/disciplines";
import { cityKey, listingCityPairs } from "@/lib/directory";
import { publicListingWhere } from "@/lib/stats";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPaths = [
    "/", "/pricing", "/founding", "/community", "/about", "/for-business", "/partners", "/jobs",
    "/trichozette", "/news", "/learn", "/certification", "/events", "/chapters", "/journal", "/podcast", "/directory",
    "/directory/list", "/find", "/guides", "/glossary", "/contact", "/privacy", "/terms",
  ];

  const [listings, pairs, events] = await Promise.all([
    prisma.directoryListing.findMany({
      where: { AND: [publicListingWhere(), { slug: { not: null } }] },
      select: { slug: true, updatedAt: true },
    }),
    listingCityPairs(),
    prisma.event.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);
  const episodes = await prisma.podcastEpisode.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } });
  const allEditions = await getAllEditions();

  return [
    ...staticPaths.map((p) => ({ url: absoluteUrl(p), lastModified: now, changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.7 })),
    ...guides.map((g) => ({ url: absoluteUrl(`/guides/${g.slug}`), lastModified: new Date(g.updated ?? g.published), priority: 0.8 })),
    ...allEditions.map((e) => ({ url: absoluteUrl(`/trichozette/${e.slug}`), lastModified: new Date(e.published), priority: 0.7 })),
    ...glossary.map((t) => ({ url: absoluteUrl(`/glossary/${t.slug}`), priority: 0.5 })),
    ...courses.map((c) => ({ url: absoluteUrl(`/courses/${c.slug}`), priority: 0.7 })),
    ...CHAPTERS.map((c) => ({ url: absoluteUrl(`/chapters/${c.slug}`), priority: 0.6 })),
    ...DISCIPLINES.map((d) => ({ url: absoluteUrl(`/directory/${d.slug}`), priority: 0.8 })),
    ...pairs.map((p) => ({ url: absoluteUrl(`/directory/${p.discipline}/${cityKey(p.city)}`), priority: 0.7 })),
    ...listings.map((l) => ({ url: absoluteUrl(`/directory/p/${l.slug}`), lastModified: l.updatedAt, priority: 0.6 })),
    ...events.map((e) => ({ url: absoluteUrl(`/events/${e.slug}`), lastModified: e.updatedAt, priority: 0.6 })),
    ...episodes.map((e) => ({ url: absoluteUrl(`/podcast/${e.slug}`), lastModified: e.updatedAt, priority: 0.6 })),
  ];
}
