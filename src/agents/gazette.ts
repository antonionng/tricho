import { prisma } from "@/lib/prisma";
import { site } from "@/config/site";
import { news } from "@/content/news";
import { normalizeSpace, roomById } from "@/config/rooms";
import { generate } from "./ai";
import { SYSTEM_USER_EMAIL } from "./publish";
import type { AgentDefinition } from "./types";
import { DAY, excerpt, formatDate, formatTime, lowerFirst, monthKey, monthLabel, stripQuestion, topKeywords } from "./util";

type PostSignal = {
  id: string;
  title: string | null;
  content: string;
  space: string;
  score: number;
  comments: string[];
};

/** Default "How I…" subjects per space, used without AI. */
const HOW_I: Record<string, string> = {
  "head-spa": "structure a head spa appointment",
  "hair-loss": "run a first hair loss consultation",
  "case-room": "write up a case before referring on",
  devices: "choose a device and explain it to clients",
  business: "set and review my prices",
  wins: "built a referral relationship that works",
  lounge: "keep learning between gatherings",
};

const EVENT_KIND_LABEL: Record<string, string> = {
  gathering: "Gathering",
  masterclass: "Masterclass",
  case_round: "Case round",
  chapter_meetup: "Chapter meet-up",
  welcome: "Welcome session",
};

export async function readMonth(now: Date) {
  const since = new Date(now.getTime() - 31 * DAY);
  const posts = await prisma.communityPost.findMany({
    where: { createdAt: { gte: since }, author: { email: { not: SYSTEM_USER_EMAIL } } },
    select: {
      id: true,
      title: true,
      content: true,
      space: true,
      comments: { select: { content: true }, take: 8 },
      _count: { select: { comments: true, reactions: true } },
    },
    take: 300,
  });
  const ranked: PostSignal[] = posts
    .map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      space: normalizeSpace(p.space),
      score: p._count.comments * 2 + p._count.reactions,
      comments: p.comments.map((c) => c.content),
    }))
    .sort((a, b) => b.score - a.score);

  const bySpace = new Map<string, { score: number; posts: PostSignal[] }>();
  for (const p of ranked) {
    const entry = bySpace.get(p.space) ?? { score: 0, posts: [] };
    entry.score += p.score + 1;
    entry.posts.push(p);
    bySpace.set(p.space, entry);
  }
  // Introductions are hellos, not a theme, so they never lead the edition.
  const spaces = [...bySpace.entries()]
    .filter(([space]) => space !== "introductions")
    .sort((a, b) => b[1].score - a[1].score);
  const keywords = topKeywords(ranked.map((p) => `${p.title ?? ""} ${p.content}`), 8);
  return { ranked, spaces, keywords };
}

export const gazetteAgent: AgentDefinition = {
  id: "gazette",
  name: "Trichozette editor",
  description:
    "Reads the past month in the community and drafts the five pieces of Trichozette: a lead feature on the month's biggest theme, a 'How I…' brief for a member to write, a roundup of questions from the community, what's on, and questions for Karley's column based on the month's real news.",
  schedule: "Monthly on the 1st at 6am",
  cron: "0 6 1 * *",
  risk: "high",
  async run(ctx) {
    const { now } = ctx;
    const edition = monthKey(now);
    const editionLabel = monthLabel(now);
    const { ranked, spaces, keywords } = await readMonth(now);
    let made = 0;

    const add = async (slot: string, title: string, summary: string, body: string) => {
      const created = await ctx.createDraft({
        kind: "gazette_article",
        title,
        summary,
        body,
        payload: { edition, slot },
        ref: `gazette:${edition}:${slot}`,
      });
      if (created) made++;
    };

    const topSpaceId = spaces[0]?.[0] ?? "lounge";
    const topRoom = roomById(topSpaceId);
    const topPosts = spaces[0]?.[1].posts.slice(0, 6) ?? [];
    const themeWords = keywords.slice(0, 4);

    /* 1. Lead feature on the biggest theme. */
    {
      const material = topPosts
        .map((p, i) => `Post ${i + 1}: ${p.title ?? "(untitled)"}\n${excerpt(p.content, 500)}\nReplies: ${p.comments.map((c) => excerpt(c, 200)).join(" | ") || "none"}`)
        .join("\n\n");
      const ai = await generate(
        "Write the lead feature for this month's Trichozette, the members' magazine. 450 to 650 words, a headline-free body with two or three '## ' subheadings. Draw out the theme from the community conversations below, paraphrase ideas without quoting or naming anyone, add practical takeaways, and end with a question for readers. No clinical advice or claims.",
        `Edition: ${editionLabel}\nBusiest space: ${topRoom?.label ?? topSpaceId}\nRecurring words: ${themeWords.join(", ") || "none"}\n\n${material || "The community was quiet this month."}`
      );
      const titles = topPosts.map((p) => p.title).filter((t): t is string => !!t);
      const body =
        ai ??
        [
          `This month the busiest corner of the collective was ${topRoom?.label ?? "the community"}. ${topRoom?.blurb ?? ""}`.trim(),
          themeWords.length >= 2
            ? `Looking across the conversations, a few words kept coming up: ${themeWords.join(", ")}. Together they point to a shared question about how we do this work well, and how we explain it to the people in our chairs.`
            : ranked.length ? "Here is a look at what members were discussing, and what we can take from it." : "It was a quieter month in the community, which makes it a good moment to look at what we want more of.",
          "## What members were talking about",
          titles.length
            ? `Threads this month covered ${titles.slice(0, 4).map((t) => lowerFirst(stripQuestion(t))).join("; ")}. In each case the most useful replies came from people describing what they actually do, not what they'd been told to do.`
            : "There were fewer threads than usual, so this is a good time to start one.",
          "## What we can take from it",
          `${site.founder}: add two or three practical takeaways here, in your own words, based on the threads above.`,
          "## Over to you",
          `What's your experience of this? Add your thoughts in ${topRoom?.label ?? "the community"}, and if you'd like to write about it for next month's Trichozette, reply to this edition.`,
        ].join("\n\n");
      await add(
        "lead",
        `${editionLabel}: ${topRoom?.label ?? "the community"} in focus`,
        ai ? `Lead feature on the month's busiest theme (${topRoom?.label ?? topSpaceId}).` : "Lead feature outline built from the month's busiest threads. Add your takeaways before publishing.",
        body
      );
    }

    /* 2. "How I…" piece, framed as prompts for a member to write. */
    {
      const subject = HOW_I[topSpaceId] ?? "run a thoughtful first consultation";
      const ai = await generate(
        "Write a commissioning brief for a 'How I…' Trichozette piece that a community member will write in their own words. Do NOT write the piece and do not invent anything the member said. Give: a working title starting 'How I', one paragraph on who would be ideal to write it, then '## Prompts to write from' with six to eight open questions as '- ' bullet lines, then '## Practical notes' with length (600 to 900 words), tone and a reminder to anonymise any client details.",
        `Theme of the month: ${topRoom?.label ?? topSpaceId}. Related thread: ${topPosts[0]?.title ?? "none"}. Recurring words: ${themeWords.join(", ")}.`
      );
      const body =
        ai ??
        [
          `Working title: How I ${subject}`,
          `This is a brief for a member to write, not an article. Ideally someone who works in ${topRoom?.label ?? "this area"} day to day and is happy to share how they do things, including what they changed over time.`,
          "## Prompts to write from",
          [
            "- What does this look like in your practice on an ordinary day?",
            "- How did you do it when you started, and what made you change?",
            "- What do you say to clients, in your own words, when you explain it?",
            "- Where do you draw the line and refer someone on, and to whom?",
            "- What's one mistake you made that others could avoid?",
            "- What would you recommend a newer practitioner reads, watches or tries?",
          ].join("\n"),
          "## Practical notes",
          "600 to 900 words, written in the first person. Plain, practical and honest. Please leave out anything that could identify a client, and check any product or device names are accurate. We'll edit lightly and send it back to you before it goes out.",
        ].join("\n\n");
      await add(
        "how-i",
        `How I… (brief for a member to write)`,
        "Prompts to send to a member. Publish only their words, never these prompts as they are.",
        body
      );
    }

    /* 3. Questions from the community, paraphrased and anonymous. */
    {
      const questions = ranked
        .filter((p) => normalizeSpace(p.space) !== "case-room")
        .filter((p) => /\?/.test(`${p.title ?? ""} ${p.content}`))
        .slice(0, 6);
      const ai = await generate(
        "Write a 'Questions from the community' roundup for Trichozette. For each question below, write a '## ' subheading that paraphrases the question (never copy it word for word), then one short paragraph summarising the kinds of answers members shared, or noting that it is still open. Never name or describe anyone in a way that could identify them. No clinical advice.",
        questions
          .map((q) => `Space: ${roomById(q.space)?.label ?? q.space}\nQuestion: ${q.title ?? ""} ${excerpt(q.content, 400)}\nReplies: ${q.comments.map((c) => excerpt(c, 200)).join(" | ") || "none yet"}`)
          .join("\n\n") || "No questions this month."
      );
      const body =
        ai ??
        (questions.length
          ? [
              "A few of the questions members asked each other this month, gathered here so nobody misses them. Names are left out; the threads are in the community if you'd like to join in.",
              ...questions.flatMap((q) => [
                `## ${roomById(q.space)?.label ?? "Community"}: ${stripQuestion(q.title ?? excerpt(q.content, 70))}`,
                q.comments.length
                  ? `A member asked about ${lowerFirst(stripQuestion(q.title ?? "this"))}. ${q.comments.length} ${q.comments.length === 1 ? "person has" : "people have"} replied so far. ${site.founder}: summarise the replies here in a sentence or two.`
                  : `A member asked about ${lowerFirst(stripQuestion(q.title ?? "this"))}. It's still waiting for an answer, so if you have experience here, please add it.`,
              ]),
            ].join("\n\n")
          : "It was a quiet month for questions. If something has been on your mind, ask it in the community and it may feature here next month.");
      await add("questions", `Questions from the community, ${editionLabel}`, "Roundup of the month's questions, paraphrased without names.", body);
    }

    /* 4. What's on. */
    {
      const events = await prisma.event.findMany({
        where: { published: true, startsAt: { gte: now, lte: new Date(now.getTime() + 62 * DAY) } },
        orderBy: { startsAt: "asc" },
        take: 8,
      });
      const lines = events.map((e) =>
        [
          `## ${e.title}`,
          `${EVENT_KIND_LABEL[e.kind] ?? "Event"}, ${formatDate(e.startsAt)} at ${formatTime(e.startsAt)}, ${e.online ? "online" : [e.venue, e.city].filter(Boolean).join(", ") || "venue to be confirmed"}. ${e.summary}`,
          [
            e.memberPriceGBP === 0 ? "Free for members." : `£${e.memberPriceGBP} for members${e.priceGBP ? `, £${e.priceGBP} for guests` : ""}.`,
            e.ticketUrl ? `Tickets: ${e.ticketUrl}` : null,
          ]
            .filter(Boolean)
            .join(" "),
        ].join("\n\n")
      );
      const body = events.length
        ? [
            `Here's what's coming up over the next two months. You can book from the Events page in the app, or through the ticket links below.`,
            ...lines,
          ].join("\n\n")
        : `Nothing is on the calendar yet for the next two months. ${site.founder}: add an event in Studio before publishing this, or leave this piece out of the edition.`;
      await add("whats-on", `What's on: ${editionLabel}`, events.length ? `${events.length} upcoming event${events.length === 1 ? "" : "s"}.` : "No upcoming events yet.", body);
    }

    /* 5. Karley's column: interview questions for her to answer in her own words. */
    {
      const recentNews = news.slice(0, 5);
      const ai = await generate(
        `Write interview questions for ${site.founderFull}'s monthly column in Trichozette. ${site.founderBio} Do NOT answer them and do not invent her views. Give a one-line note to her, then '## Questions' with five or six open questions as '- ' bullets that invite her professional opinion on this month's real news and the community's biggest theme. Then '## How to publish' saying: replace the questions with her answers (rough notes are fine, the editor will tidy them), keep it in her voice, then approve.`,
        `Community theme: ${topRoom?.label ?? topSpaceId}. Recurring words: ${themeWords.join(", ") || "none"}.\nThis month's news:\n${recentNews.map((n) => `- ${n.headline} (${n.source}, ${n.date}): ${n.summary}`).join("\n") || "none"}`
      );
      const body =
        ai ??
        [
          `${site.founder}, these are prompts for your column. Answer in your own words; rough notes are fine and the editor will tidy them. Nothing here is published until you approve it.`,
          "## Questions",
          [
            ...recentNews.slice(0, 3).map((n) => `- ${n.headline}. What's your view, and what should practitioners in each discipline take from it?`),
            `- ${topRoom?.label ?? "The community"} was the busiest space this month. What stood out to you in those conversations?`,
            "- What's one thing you'd like every member to try in their practice this month?",
            "- What are you most looking forward to at the next conference?",
          ].join("\n"),
          "## How to publish",
          "Replace the questions above with your answers, keep it in your voice, then approve.",
        ].join("\n\n");
      await add(
        "karley-column",
        `${site.founder}'s column: ${editionLabel}`,
        `Questions for ${site.founder} to answer in her own words. Replace the questions with her answers before approving.`,
        body
      );
    }

    return {
      summary:
        made === 0
          ? `Nothing new: the ${editionLabel} Trichozette pieces have already been drafted. Use Regenerate on a piece in the inbox for a fresh version.`
          : `Drafted ${made} of 5 Trichozette pieces for ${editionLabel}${made < 5 ? " (the others were already drafted)" : ""}, from ${ranked.length} posts this month.`,
    };
  },
};
