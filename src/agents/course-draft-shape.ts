import { z } from "zod";
import type { Lesson, LessonBlock, Question } from "@/content/course-types";
import { blockSchema, RESERVED_LESSON_SLUGS } from "@/content/course-schema";

/**
 * The shapes the AI drafts in, and how its output becomes valid course content.
 * The model-facing schemas are deliberately loose (no length limits), because
 * structured output rejects some JSON Schema keywords; everything is then
 * checked against the real course schema, block by block, and anything that
 * doesn't fit is dropped rather than trusted.
 */

const str = z.string();

export const draftPlanSchema = z.object({
  summary: str.describe("One or two sentences for the course page, leading with what the learner will be able to do."),
  audience: str.describe("Who the course is for."),
  outcomes: z.array(str).describe("Three to five things learners will be able to do, each starting with a verb."),
  lessons: z
    .array(
      z.object({
        title: str,
        detail: str.describe("One line for the syllabus."),
        minutes: z.number().describe("Realistic reading time, 15 to 45."),
        objectives: z.array(str),
        focus: str.describe("What this lesson must cover, drawn from the author's material, in two or three sentences."),
      })
    )
    .describe("Between three and eight lessons, in teaching order."),
});
export type DraftPlan = z.infer<typeof draftPlanSchema>;

const draftQuestion = z.object({
  prompt: str,
  options: z.array(str).describe("Four options."),
  answer: z.number().describe("Index of the correct option, from 0."),
  explain: str.describe("Why the right answer is right, teaching the point."),
});

/** Text-only blocks: the AI never invents videos, images or files. */
const draftBlock = z.object({
  type: z.enum(["p", "h", "list", "callout", "case", "script", "steps", "table", "terms", "template"]),
  text: str.optional(),
  items: z.array(str).optional(),
  ordered: z.boolean().optional(),
  tone: z.enum(["tip", "caution", "redflag", "scope"]).optional(),
  title: str.optional(),
  scenario: str.optional(),
  question: str.optional(),
  discussion: str.optional(),
  lines: z.array(str).optional(),
  steps: z.array(z.object({ title: str, detail: str })).optional(),
  caption: str.optional(),
  head: z.array(str).optional(),
  rows: z.array(z.array(str)).optional(),
  terms: z.array(z.object({ term: str, meaning: str })).optional(),
  body: str.optional(),
});

export const draftLessonSchema = z.object({
  blocks: z.array(draftBlock),
  check: z.array(draftQuestion).describe("Three questions."),
  reflection: str,
  takeaways: z.array(str).describe("Three."),
});
export type DraftLesson = z.infer<typeof draftLessonSchema>;

export const draftAssessmentSchema = z.object({ questions: z.array(draftQuestion).describe("Between eight and fifteen scenario questions.") });

/** One drafted block in the course's own shape, or null if it doesn't fit. */
export function toBlock(raw: z.infer<typeof draftBlock>): LessonBlock | null {
  const candidate: Record<string, unknown> = { type: raw.type };
  switch (raw.type) {
    case "p":
    case "h":
      candidate.text = raw.text;
      break;
    case "list":
      Object.assign(candidate, { items: raw.items, ordered: raw.ordered });
      break;
    case "callout":
      Object.assign(candidate, { tone: raw.tone ?? "tip", title: raw.title ?? "", text: raw.text });
      break;
    case "case":
      Object.assign(candidate, { title: raw.title, scenario: raw.scenario, question: raw.question, discussion: raw.discussion });
      break;
    case "script":
      Object.assign(candidate, { title: raw.title ?? "What to say", lines: raw.lines });
      break;
    case "steps":
      Object.assign(candidate, { title: raw.title ?? "", steps: raw.steps });
      break;
    case "table":
      Object.assign(candidate, { caption: raw.caption ?? "", head: raw.head, rows: raw.rows });
      break;
    case "terms":
      candidate.items = raw.terms;
      break;
    case "template":
      Object.assign(candidate, { title: raw.title, body: raw.body });
      break;
  }
  const parsed = blockSchema.safeParse(candidate);
  if (!parsed.success) return null;
  const block = parsed.data as LessonBlock;
  // An empty paragraph, list or case teaches nothing.
  if ((block.type === "p" || block.type === "h") && !block.text.trim()) return null;
  if (block.type === "list" && !block.items.some((i) => i.trim())) return null;
  return block;
}

function toQuestion(raw: z.infer<typeof draftQuestion>, id: string): Question | null {
  const options = raw.options.map((o) => o.trim()).filter(Boolean).slice(0, 6);
  const answer = Math.round(raw.answer);
  if (!raw.prompt.trim() || options.length < 2 || answer < 0 || answer >= options.length || raw.options[answer]?.trim() !== options[answer]) return null;
  return { id, prompt: raw.prompt.trim().slice(0, 600), options: options.map((o) => o.slice(0, 400)), answer, explain: raw.explain.trim().slice(0, 1500) };
}

export function slugForLesson(title: string, taken: Set<string>) {
  const base =
    title
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "lesson";
  let slug = RESERVED_LESSON_SLUGS.includes(base) ? `${base}-lesson` : base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

/** A planned lesson and its drafted content, as a lesson the builder can edit. */
export function toLesson(plan: DraftPlan["lessons"][number], raw: DraftLesson, index: number, taken: Set<string>): Lesson {
  const blocks = raw.blocks.map(toBlock).filter((b): b is LessonBlock => !!b).slice(0, 200);
  const check = raw.check.map((q, i) => toQuestion(q, `l${index + 1}-q${i + 1}`)).filter((q): q is Question => !!q).slice(0, 10);
  return {
    slug: slugForLesson(plan.title, taken),
    title: plan.title.trim().slice(0, 160) || `Lesson ${index + 1}`,
    detail: plan.detail.trim().slice(0, 400),
    minutes: Math.min(240, Math.max(5, Math.round(plan.minutes) || 20)),
    objectives: plan.objectives.map((o) => o.trim().slice(0, 300)).filter(Boolean).slice(0, 10),
    blocks,
    check,
    reflection: raw.reflection.trim().slice(0, 600),
    takeaways: raw.takeaways.map((t) => t.trim().slice(0, 400)).filter(Boolean).slice(0, 6),
  };
}

export function toAssessment(raw: z.infer<typeof draftAssessmentSchema>): Question[] {
  return raw.questions.map((q, i) => toQuestion(q, `a${i + 1}`)).filter((q): q is Question => !!q).slice(0, 60);
}
