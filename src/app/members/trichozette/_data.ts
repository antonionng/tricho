import "server-only";
import { prisma } from "@/lib/prisma";
import { monthYear } from "@/components/members/format";

/** Published Trichozette articles, newest first. Shared by /members/trichozette and the app. */
export function publishedGazetteArticles() {
  return prisma.draft.findMany({
    where: { kind: "gazette_article", status: "published" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 120,
    select: { id: true, title: true, summary: true, publishedAt: true, createdAt: true },
  });
}

/** Articles grouped into monthly editions, in the order given. */
export function byMonth<T extends { publishedAt: Date | null; createdAt: Date }>(articles: T[]) {
  const editions: { month: string; items: T[] }[] = [];
  for (const a of articles) {
    const month = monthYear(a.publishedAt ?? a.createdAt);
    const last = editions[editions.length - 1];
    if (last?.month === month) last.items.push(a);
    else editions.push({ month, items: [a] });
  }
  return editions;
}

/** One published article, or null. */
export function gazetteArticle(id: string) {
  return prisma.draft.findFirst({
    where: { id, kind: "gazette_article", status: "published" },
    select: { title: true, summary: true, body: true, publishedAt: true, createdAt: true },
  });
}
