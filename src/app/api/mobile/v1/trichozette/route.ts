import { json, withMember } from "@/lib/mobile/api";
import { longDate } from "@/components/members/format";
import { getArchive, getEditions } from "@/content/gazette/loader";
import { byMonth, publishedGazetteArticles } from "@/app/members/trichozette/_data";
import { editionCard } from "./_present";

/** The Trichozette: the library of editions, the look-back archive, and each month's articles. */
export const GET = withMember(
  async () => {
    const [library, archive, articles] = await Promise.all([getEditions(), getArchive(), publishedGazetteArticles()]);
    return json({
      editions: library.map(editionCard),
      archive: archive.map(editionCard),
      months: byMonth(articles).map((m) => ({
        month: m.month,
        items: m.items.map((a) => ({ id: a.id, title: a.title, summary: a.summary, date: longDate(a.publishedAt ?? a.createdAt) })),
      })),
    });
  },
  { members: true }
);
