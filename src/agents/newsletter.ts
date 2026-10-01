import { prisma } from "@/lib/prisma";
import { site } from "@/config/site";
import { guides } from "@/content/guides";
import { generate } from "./ai";
import type { AgentDefinition } from "./types";
import { DAY, appUrl, excerpt, formatDate, monthKey, monthLabel } from "./util";

export const newsletterAgent: AgentDefinition = {
  id: "newsletter",
  name: "Newsletter writer",
  description:
    "Puts together the monthly newsletter from this month's Trichozette, upcoming events and new guides. When you approve it, it goes to every subscriber and active member.",
  schedule: "Monthly on the 25th at 9am",
  cron: "0 9 25 * *",
  risk: "high",
  async run(ctx) {
    const { now } = ctx;
    const since = new Date(now.getTime() - 31 * DAY);
    const month = monthLabel(now);

    const [articles, events] = await Promise.all([
      prisma.draft.findMany({
        where: { kind: "gazette_article", status: "published", publishedAt: { gte: since } },
        orderBy: { publishedAt: "desc" },
        take: 6,
      }),
      prisma.event.findMany({
        where: { published: true, startsAt: { gte: now, lte: new Date(now.getTime() + 45 * DAY) } },
        orderBy: { startsAt: "asc" },
        take: 6,
      }),
    ]);
    const newGuides = guides
      .filter((g) => g.audience === "public" && new Date(g.published).getTime() >= since.getTime())
      .slice(0, 4);

    const facts = [
      `Month: ${month}`,
      `Trichozette pieces:\n${articles.map((a) => `- ${a.title}: ${excerpt(a.body, 220)}`).join("\n") || "- none"}`,
      `Events:\n${events.map((e) => `- ${e.title}, ${formatDate(e.startsAt)}, ${e.online ? "online" : e.city ?? "venue to be confirmed"}: ${e.summary}${e.ticketUrl ? ` Tickets: ${e.ticketUrl}` : ""}`).join("\n") || "- none"}`,
      `New guides:\n${newGuides.map((g) => `- ${g.title} (${appUrl(`/guides/${g.slug}`)}): ${g.description}`).join("\n") || "- none"}`,
      `Events page: ${appUrl("/events")}`,
      `Join page: ${appUrl("/pricing")}`,
    ].join("\n\n");

    const ai = await generate(
      `Write the monthly Trichollective newsletter, which goes to members and to public subscribers (some are not members). 300 to 450 words. Open with a short, warm note from ${site.founder}, then '## ' sections for what's been in Trichozette (members-only, so tease rather than reproduce), what's on, and new guides, including the links exactly as given. End with a short sign-off from ${site.founder}. Only use the facts given.`,
      facts
    );

    const sections: string[] = [
      "Hello,",
      `Here's your Trichollective update for ${month}: what members have been reading and talking about, what's coming up, and a few new guides you can share with clients.`,
    ];
    if (articles.length) {
      sections.push(
        "## In Trichozette",
        `This month's members' edition included ${articles.length} piece${articles.length === 1 ? "" : "s"}:`,
        articles.map((a) => `- ${a.title}`).join("\n"),
        "Members can read every piece in the app."
      );
    }
    if (events.length) {
      sections.push(
        "## What's on",
        events
          .map(
            (e) =>
              `- ${e.title}: ${formatDate(e.startsAt)}, ${e.online ? "online" : e.city ?? "venue to be confirmed"}${e.ticketUrl ? `. Tickets: ${e.ticketUrl}` : ""}`
          )
          .join("\n"),
        `Details and booking: ${appUrl("/events")}`
      );
    }
    if (newGuides.length) {
      sections.push(
        "## New guides",
        newGuides.map((g) => `- ${g.title}: ${appUrl(`/guides/${g.slug}`)}`).join("\n"),
        "They're written for the public, so feel free to share them with your clients."
      );
    }
    if (!articles.length && !events.length && !newGuides.length) {
      sections.push(`${site.founder}: there's nothing new to share yet this month. Add a personal note here, or publish this month's Trichozette first and run the newsletter again.`);
    }
    sections.push("Thank you for being part of the collective.", `${site.founder}, Trichollective`);

    const subject = `Trichollective: ${month}`;
    const created = await ctx.createDraft({
      kind: "newsletter",
      title: subject,
      summary: `Monthly newsletter built from ${articles.length} Trichozette piece${articles.length === 1 ? "" : "s"}, ${events.length} event${events.length === 1 ? "" : "s"} and ${newGuides.length} guide${newGuides.length === 1 ? "" : "s"}.`,
      body: ai ?? sections.join("\n\n"),
      payload: { subject, month: monthKey(now) },
      ref: `newsletter:${monthKey(now)}`,
    });

    return {
      summary: created
        ? `Drafted the ${month} newsletter. It will only be sent when you approve it.`
        : `The ${month} newsletter is already in the inbox.`,
    };
  },
};
