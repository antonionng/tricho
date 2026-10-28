import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { roomById } from "@/config/rooms";
import { BLOG_CATEGORIES, filePosts } from "@/content/blog";
import { glossary } from "@/content/glossary";
import { guides } from "@/content/guides";
import { news } from "@/content/news";
import { generateStructured } from "./ai";
import { readMonth } from "./gazette";
import type { AgentDefinition } from "./types";
import { excerpt, isoWeekKey } from "./util";

const IdeasOut = z.object({
  ideas: z.array(
    z.object({
      question: z.string().describe("The exact question a person would type into Google or ask an AI assistant."),
      title: z.string().describe("A working title, 40 to 60 characters."),
      angle: z.string().describe("Two or three sentences: what the post should cover and what would make it the best answer available."),
      audience: z.string().describe("public, professional or both"),
      category: z.string(),
      why: z.string().describe("One or two sentences on the evidence for demand: which community conversations or news point to it."),
    })
  ),
});

export type BlogIdea = z.infer<typeof IdeasOut>["ideas"][number];

const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

/** Built-in ideas, used without AI: glossary terms we explain but haven't written a post about. */
function templateIdeas(covered: string): BlogIdea[] {
  return glossary
    .filter((t) => !covered.includes(t.term.toLowerCase()))
    .slice(0, 3)
    .map((t) => ({
      question: `What is ${t.term.toLowerCase()}?`,
      title: `${t.term}: what it is and when to see a GP`,
      angle: `${t.short} Explain it in plain English, cover what clients notice, what a professional looks for and when a GP should be involved.`,
      audience: "both",
      category: "hair-loss",
      why: "We have a glossary entry for this term but no full post, so there is room to rank for the longer questions people ask about it.",
    }));
}

export const blogAgent: AgentDefinition = {
  id: "blog",
  name: "Blog editor",
  description:
    "Reads the last month of community questions, the news and what the blog and guides already cover, then suggests three blog posts people are searching for that we haven't written yet. Approve an idea and the AI writer researches, writes and fact-checks it for you to edit in Blog studio.",
  schedule: "Weekly on Monday at 6am",
  cron: "0 6 * * 1",
  risk: "high",
  async run(ctx) {
    const week = isoWeekKey(ctx.now).key;
    const { ranked, keywords, rooms } = await readMonth(ctx.now);

    // Paraphrased themes only: no names, and nothing from private or professional-only rooms.
    const questions = ranked
      .filter((p) => p.space !== "case-room" && !roomById(p.space, rooms)?.professionalOnly)
      .filter((p) => /\?/.test(`${p.title ?? ""} ${p.content}`))
      .slice(0, 15)
      .map((p) => `- (${roomById(p.space, rooms)?.label ?? p.space}, ${p.comments.length} replies) ${excerpt(`${p.title ?? ""} ${p.content}`, 220)}`);

    const studio = await prisma.blogArticle.findMany({ where: { status: { not: "archived" } }, select: { title: true, targetQuery: true } }).catch(() => []);
    const pending = await prisma.draft.findMany({ where: { kind: "blog_idea", status: "draft" }, select: { title: true } });
    const coverage = [
      ...filePosts.map((p) => p.title),
      ...studio.map((s) => s.title || s.targetQuery),
      ...guides.map((g) => g.title),
      ...pending.map((p) => p.title),
    ];

    const ai = await generateStructured(
      IdeasOut,
      `You plan the ${"Trichollective"} blog, whose aim is to be the most cited source on hair and scalp care in the UK and Ireland, in Google and in AI assistants. Suggest exactly three posts. Each must answer a specific question real people ask, must not repeat anything already covered, and must be answerable from trusted public sources such as the NHS, HSE, DermNet or the British Association of Dermatologists. Mix the audiences: at least one for professionals (consultations, referrals, scope of practice, running a practice) and at least one for the public. Prefer questions with clear search demand over clever angles. Never base an idea on one identifiable person's case.`,
      [
        `Categories: ${BLOG_CATEGORIES.map((c) => `${c.slug} (${c.description})`).join("; ")}`,
        `Already covered or waiting (do not repeat):\n${coverage.map((c) => `- ${c}`).join("\n")}`,
        `Questions from the community this month, paraphrase rather than copy:\n${questions.join("\n") || "none"}`,
        `Words that kept coming up: ${keywords.join(", ") || "none"}`,
        `Recent news:\n${news.slice(0, 8).map((n) => `- ${n.headline} (${n.source}): ${n.summary}`).join("\n")}`,
      ].join("\n\n")
    );

    const ideas = (ai?.ideas ?? templateIdeas(coverage.join(" ").toLowerCase())).slice(0, 3);
    let made = 0;
    for (const idea of ideas) {
      const category = BLOG_CATEGORIES.some((c) => c.slug === idea.category) ? idea.category : "consultations";
      const audience = ["public", "professional", "both"].includes(idea.audience) ? idea.audience : "both";
      const created = await ctx.createDraft({
        kind: "blog_idea",
        title: idea.title,
        summary: idea.question,
        body: [`Question: ${idea.question}`, `Who it is for: ${audience === "both" ? "professionals and the public" : audience === "public" ? "the public" : "professionals"}`, `## The angle`, idea.angle, `## Why now`, idea.why, `Approve this and the AI writer will plan, research, write and fact-check the post. It will be waiting in Blog studio for you to edit before anything goes live.`].join("\n\n"),
        payload: { question: idea.question, angle: idea.angle, audience, category, why: idea.why, week },
        ref: `blog-idea:${key(idea.question)}`,
      });
      if (created) made++;
    }

    return {
      summary: made ? `Suggested ${made} blog ${made === 1 ? "post" : "posts"} from ${questions.length} community questions${ai ? "" : " (template ideas, as AI isn't set up)"}.` : "No new ideas this week: everything suggested was already in the inbox or written.",
    };
  },
};
