import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ROOMS, normalizeSpace, roomById, type RoomId } from "@/config/rooms";
import { generate, generateStructured, aiAvailable } from "./ai";
import { SYSTEM_USER_EMAIL } from "./publish";
import type { AgentDefinition } from "./types";
import { DAY, excerpt, firstName, isoWeekKey, professionPhrase } from "./util";

/* ------------------------------------------------------------------ */
/* Weekly discussion prompts. Several per space, rotated by week.       */
/* ------------------------------------------------------------------ */

const PROMPT_BANK: Record<RoomId, { title: string; body: string }[]> = {
  lounge: [
    { title: "What's one small change that made your week easier?", body: "It might be a new booking habit, a better way of writing notes, or simply a morning routine that stuck. Share one small change that made a difference this week, and what prompted it." },
    { title: "What are you reading, watching or listening to?", body: "Books, podcasts, courses or a good thread elsewhere. What's been worth your time lately, and who would you recommend it to?" },
    { title: "What would you tell yourself in your first year of practice?", body: "Looking back, what's the one piece of advice you wish someone had given you when you started out?" },
  ],
  introductions: [
    { title: "New this week? Say hello", body: "If you've joined recently, tell us who you are, where you practise and what you'd love to learn from the collective this year. If you've been here a while, say hello to someone new." },
    { title: "Tell us about your practice", body: "Whether you're in a salon, a clinic, a head spa or a GP surgery, we'd love to hear what a typical week looks like for you." },
  ],
  "head-spa": [
    { title: "How do you structure a first head spa appointment?", body: "From the first conversation to the aftercare advice, how do you structure a first visit? What do you always ask before you begin, and what do you always explain at the end?" },
    { title: "What's in your treatment room that you couldn't do without?", body: "Tools, products or small comforts. What have you added to your room that clients notice, and what did you stop using?" },
    { title: "When do you refer a head spa client on?", body: "What do you notice that makes you suggest a client sees a trichologist or their GP, and how do you raise it with them?" },
  ],
  "hair-loss": [
    { title: "How do you explain shedding timelines to worried clients?", body: "Many clients want to know why shedding started months after the thing that may have caused it. How do you explain timelines clearly without overpromising?" },
    { title: "What's in your consultation form?", body: "Which questions have earned their place on your intake form, and which did you drop? Share what works for you." },
    { title: "Working alongside GPs", body: "How do you write to a client's GP when you'd like bloods or a review? What makes a referral letter useful for the person reading it?" },
  ],
  "case-room": [
    { title: "A case that changed how you practise", body: "Share an anonymised case that taught you something. Leave out names, ages, places, photographs of faces and anything else that could identify the person." },
    { title: "When the obvious answer wasn't the right one", body: "Have you had a case where your first thought turned out to be wrong? What changed your mind? Please keep every detail anonymised." },
  ],
  devices: [
    { title: "How do you talk about devices without overclaiming?", body: "Clients often ask about LED caps, scopes and home devices. How do you describe what a device does, and what it doesn't, in plain words?" },
    { title: "Which device earns its keep in your practice?", body: "Which piece of kit do you use most, and what do you use it for? What would you want to know before buying one?" },
  ],
  business: [
    { title: "How do you handle late cancellations?", body: "What's your cancellation policy, how do you communicate it, and has it changed how often people cancel late?" },
    { title: "Where do your best clients come from?", body: "Referrals, the directory, social media or word of mouth. Where do your most loyal clients find you, and what have you stopped spending time on?" },
    { title: "How did you set your prices?", body: "What did you consider when you last reviewed your prices, and how did you tell your existing clients?" },
  ],
  wins: [
    { title: "Share a win from this week", body: "A thank-you note, a referral that worked, a course finished or a full diary. Big or small, tell us something that went well." },
    { title: "Who helped you this month?", body: "Is there someone in the collective, or outside it, who helped you recently? Give them a thank-you here." },
  ],
};

/* ------------------------------------------------------------------ */
/* Identifying-information heuristics for the Case Room.                */
/* ------------------------------------------------------------------ */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(?:\+?(?:44|353)\s?\(?0?\)?|\b0)(?:[\s-]?\d){8,11}\b/;
const NAME_AGE_RE =
  /\b([A-Z][a-z]{2,})\s*(?:,\s*|\(\s*|\s+is\s+|\s+was\s+)(?:aged\s+)?(\d{1,2})\s*(?:\)|,|\.|\s*(?:yo|y\/o|years?\s*old|yrs?))/;
const TITLE_NAME_RE = /\b(?:Mr|Mrs|Ms|Miss|Mx)\.?\s+[A-Z][a-z]{2,}/;
const CALLED_RE = /\b(?:called|named|name is)\s+[A-Z][a-z]{2,}/;
const NOT_NAMES = new Set(["She", "He", "They", "Client", "Patient", "Female", "Male", "Woman", "Man", "Aged", "Age", "Her", "His", "The", "This", "Case", "Anonymised"]);

export function identifyingHeuristic(text: string): string | null {
  if (EMAIL_RE.test(text)) return "It seems to include an email address.";
  if (PHONE_RE.test(text)) return "It seems to include a phone number.";
  const nameAge = text.match(NAME_AGE_RE);
  if (nameAge && !NOT_NAMES.has(nameAge[1])) return `It seems to include a name with an age ("${nameAge[1]}, ${nameAge[2]}").`;
  if (TITLE_NAME_RE.test(text)) return "It seems to include a client's title and surname.";
  if (CALLED_RE.test(text)) return "It seems to name the client.";
  return null;
}

const idSchema = z.object({
  identifying: z.boolean(),
  reason: z.string(),
});

/* ------------------------------------------------------------------ */

export const communityAgent: AgentDefinition = {
  id: "community",
  name: "Community host",
  description:
    "Welcomes new members, spots posts nobody has answered, suggests a weekly conversation starter for each space, and flags Case Room posts that might identify a client.",
  schedule: "Daily at 7am",
  cron: "0 7 * * *",
  risk: "low",
  async run(ctx) {
    const { now } = ctx;
    let welcomes = 0;
    let nudges = 0;
    let prompts = 0;
    let flags = 0;

    /* 1. Welcome posts for members who finished onboarding in the last day. */
    const newcomers = await prisma.user.findMany({
      where: {
        onboardedAt: { gte: new Date(now.getTime() - DAY) },
        email: { not: SYSTEM_USER_EMAIL },
        role: { not: "admin" },
      },
      select: {
        id: true,
        name: true,
        profile: { select: { profession: true, location: true, specialization: true } },
        chapter: { select: { city: true } },
      },
    });
    for (const m of newcomers) {
      const first = firstName(m.name, "our newest member");
      const city = m.profile?.location || m.chapter?.city || null;
      const facts = [
        `First name: ${first}`,
        `Discipline: ${m.profile?.profession ?? "not given"}`,
        city ? `Based in: ${city}` : null,
        m.profile?.specialization ? `Specialism: ${m.profile.specialization}` : null,
      ]
        .filter(Boolean)
        .join("\n");
      const ai = await generate(
        "Write a short welcome post (two short paragraphs, under 90 words) from the Trichollective team for the Introductions space, welcoming a new member by first name. Invite them to introduce themselves. Only use the facts given.",
        facts
      );
      const body =
        ai ??
        [
          `Please join us in welcoming ${first}, ${professionPhrase(m.profile?.profession)}${city ? ` in ${city}` : ""}${
            m.profile?.specialization ? `, with a particular interest in ${m.profile.specialization.toLowerCase()}` : ""
          }.`,
          `${first}, we're really glad you're here. When you have a moment, tell us a little about your practice and what you'd most like to learn or talk about this year. Everyone else, do say hello.`,
        ].join("\n\n");
      const created = await ctx.createDraft({
        kind: "community_post",
        title: `Welcome, ${first}`,
        summary: `Welcome post for a member who joined in the last day.`,
        body,
        payload: { space: "introductions", title: `Welcome, ${first}`, userId: m.id },
        risk: "low",
        ref: `welcome:${m.id}`,
      });
      if (created) welcomes++;
    }

    /* 2. Posts older than 48 hours that nobody has answered (looking back two weeks). */
    const quiet = await prisma.communityPost.findMany({
      where: {
        createdAt: { lt: new Date(now.getTime() - 2 * DAY), gte: new Date(now.getTime() - 14 * DAY) },
        comments: { none: {} },
        author: { email: { not: SYSTEM_USER_EMAIL } },
      },
      select: { id: true, title: true, content: true, space: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
    for (const post of quiet) {
      const room = roomById(normalizeSpace(post.space));
      const topic = post.title || excerpt(post.content, 80);
      const ai = await generate(
        "Write a gentle, two-sentence comment the Trichollective team could add under a community post that nobody has answered yet, inviting members with relevant experience to share. Do not answer the question yourself and do not give clinical advice.",
        `Space: ${room?.label ?? post.space}\nPost title: ${post.title ?? "(none)"}\nPost: ${excerpt(post.content, 600)}`
      );
      const body =
        ai ??
        `This one has been quiet for a couple of days. Has anyone in ${room?.label ?? "the community"} dealt with something similar? Even a short reply about what you'd try first, or who you'd ask, would help.`;
      const created = await ctx.createDraft({
        kind: "community_nudge",
        title: `No replies yet: ${excerpt(topic, 70)}`,
        summary: `Posted in ${room?.label ?? post.space} ${Math.floor((now.getTime() - post.createdAt.getTime()) / DAY)} days ago with no replies. Suggested comment below; add it yourself or tag someone who can help.`,
        body,
        payload: { postId: post.id, space: post.space, postTitle: post.title, href: `/members/community/${post.id}` },
        risk: "high",
        ref: `nudge:${post.id}`,
      });
      if (created) nudges++;
    }

    /* 3. One discussion prompt per space, once a week. */
    const { key: weekKey, week } = isoWeekKey(now);
    for (const room of ROOMS) {
      const bank = PROMPT_BANK[room.id];
      if (!bank?.length) continue;
      const pick = bank[week % bank.length];
      let title = pick.title;
      let body = pick.body;
      if (aiAvailable()) {
        const recent = await prisma.communityPost.findMany({
          where: { space: room.id, createdAt: { gte: new Date(now.getTime() - 21 * DAY) } },
          select: { title: true },
          take: 10,
          orderBy: { createdAt: "desc" },
        });
        const out = await generateStructured(
          z.object({ title: z.string(), body: z.string() }),
          "Suggest one open discussion prompt for a community space: a question as the title (under 80 characters) and two or three sentences of body inviting members to share their own practice. Avoid repeating recent topics. No clinical advice.",
          `Space: ${room.label}\nAbout the space: ${room.blurb}\nRecent topics:\n${recent.map((r) => `- ${r.title ?? "(untitled)"}`).join("\n") || "- none"}\nExample of the tone we like: ${pick.title} ${pick.body}`
        );
        if (out?.title && out.body) {
          title = out.title.replace(/!/g, ".");
          body = out.body.replace(/!/g, ".");
        }
      }
      if (room.id === "case-room" && !/anonymi/i.test(body)) {
        body += " Please keep every detail anonymised.";
      }
      const created = await ctx.createDraft({
        kind: "community_post",
        title,
        summary: `This week's conversation starter for ${room.label}.`,
        body,
        payload: { space: room.id, title },
        risk: "high",
        ref: `prompt:${room.id}:${weekKey}`,
      });
      if (created) prompts++;
    }

    /* 4. Case Room posts that might identify a client. */
    const caseSpaces = ["case-room", "consultation", "medical"];
    const casePosts = await prisma.communityPost.findMany({
      where: {
        space: { in: caseSpaces },
        createdAt: { gte: new Date(now.getTime() - 14 * DAY) },
        reports: { none: { source: "community" } },
      },
      select: { id: true, title: true, content: true, comments: { select: { content: true } } },
      take: 50,
    });
    for (const post of casePosts) {
      const text = [post.title ?? "", post.content, ...post.comments.map((c) => c.content)].join("\n\n");
      let reason = identifyingHeuristic(text);
      if (!reason && aiAvailable()) {
        const out = await generateStructured(
          idSchema,
          "You check anonymised clinical case posts shared between hair and scalp professionals. Decide whether the text contains information that could identify the client: a name, a name with an age, contact details, an exact address, workplace, or a rare combination of specifics. Broad details such as 'a woman in her 30s' are fine. Explain briefly in one sentence.",
          text.slice(0, 4000)
        );
        if (out?.identifying) reason = out.reason;
      }
      if (reason) {
        await prisma.report.create({
          data: {
            postId: post.id,
            source: "community",
            reason: `Case Room privacy check: ${reason} Please check it and ask the author to edit if needed.`,
          },
        });
        flags++;
      }
    }

    return {
      summary: `Drafted ${welcomes} welcome post${welcomes === 1 ? "" : "s"}, ${nudges} nudge${nudges === 1 ? "" : "s"} for quiet posts and ${prompts} weekly prompt${prompts === 1 ? "" : "s"}. Flagged ${flags} Case Room post${flags === 1 ? "" : "s"} for a privacy check.`,
    };
  },
};
