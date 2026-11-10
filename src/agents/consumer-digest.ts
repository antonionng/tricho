import { prisma } from "@/lib/prisma";
import { getAllPosts } from "@/lib/blog";
import { guides } from "@/content/guides";
import { hubFeed } from "@/lib/hub-feed";
import { HUB_LABEL } from "@/config/consumer";
import { consumerDigestBody } from "@/lib/mail/templates/consumers";
import type { AgentDefinition } from "./types";
import { DAY, monthKey, monthLabel } from "./util";

/**
 * The hub's monthly email to members of the public. It is built only from reading already
 * published for the public, with no AI writing, because it goes to people who may be worried
 * about their health. Like the newsletter, nothing is sent until someone approves it.
 */
export const consumerDigestAgent: AgentDefinition = {
  id: "consumer-digest",
  name: "Hair hub digest",
  description: `Puts together the monthly email for ${HUB_LABEL.toLowerCase()} from the public articles, guides and library pieces published in the last month. When you approve it, it goes only to consumers who opted in to news.`,
  schedule: "Monthly on the 1st at 10am",
  cron: "0 10 1 * *",
  risk: "high",
  async run(ctx) {
    const { now } = ctx;
    const since = new Date(now.getTime() - 31 * DAY).toISOString().slice(0, 10);
    const month = monthLabel(now);

    const [posts, pieces] = await Promise.all([
      getAllPosts(),
      prisma.educationPiece.findMany({ where: { published: true, audience: "public" }, orderBy: { createdAt: "desc" }, take: 20 }).catch(() => []),
    ]);
    const items = hubFeed({ posts, guides, pieces }, 50)
      .filter((i) => i.date >= since)
      .slice(0, 8);

    const subject = `New in ${HUB_LABEL.toLowerCase()}: ${month}`;
    const created = await ctx.createDraft({
      kind: "consumer_digest",
      title: subject,
      summary: `Monthly email for consumers who opted in to news, with ${items.length} new ${items.length === 1 ? "piece" : "pieces"} to read.`,
      body: consumerDigestBody(items, month),
      payload: { subject, month: monthKey(now) },
      ref: `consumer-digest:${monthKey(now)}`,
    });

    return {
      summary: created
        ? `Drafted the ${month} hub digest. It will only be sent when you approve it.`
        : `The ${month} hub digest is already in the inbox.`,
    };
  },
};
