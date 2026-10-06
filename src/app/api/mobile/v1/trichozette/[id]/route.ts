import { fail, json, withMember } from "@/lib/mobile/api";
import { longDate, monthYear } from "@/components/members/format";
import { plainTextBlocks } from "@/lib/plain-text";
import { getEditionBySlug } from "@/content/gazette/loader";
import { gazetteArticle } from "@/app/members/trichozette/_data";
import { editionForReader } from "../_present";

/**
 * An edition (by its slug) or a monthly article (by its id). Editions come as
 * structured pages and blocks; articles as headings and paragraphs.
 */
export const GET = withMember<{ id: string }>(
  async (_req, _ctx, { id }) => {
    const edition = await getEditionBySlug(id);
    if (edition) return json({ type: "edition" as const, edition: editionForReader(edition) });

    const article = await gazetteArticle(id);
    if (!article) return fail(404, "This piece is no longer in the Trichozette.");
    const date = article.publishedAt ?? article.createdAt;
    return json({
      type: "article" as const,
      article: {
        id,
        title: article.title,
        summary: article.summary,
        label: `Trichozette, ${monthYear(date)}`,
        date: longDate(date),
        blocks: plainTextBlocks(article.body),
      },
    });
  },
  { members: true }
);
