import { z } from "zod";
import type { CourseContent } from "@/content/course-types";
import { isValidVideoId } from "@/lib/video-embed";

/**
 * Runtime checks for course content stored in the database (written in the
 * course builder or drafted by AI). It mirrors src/content/course-types.ts; a
 * test parses every course written in code, so the two can't drift apart.
 *
 * `courseContentSchema` checks shape only, so a half-written draft still saves.
 * `publishIssues` lists what must be fixed before a course can go for review.
 */

const text = (max: number) => z.string().max(max);

export const questionSchema = z.object({
  id: text(40).regex(/^[A-Za-z0-9_-]+$/),
  prompt: text(600),
  options: z.array(text(400)).min(2).max(6),
  answer: z.number().int().min(0),
  explain: text(1500),
});

const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("p"), text: text(6000) }),
  z.object({ type: z.literal("h"), text: text(200) }),
  z.object({ type: z.literal("list"), items: z.array(text(1000)).max(40), ordered: z.boolean().optional() }),
  z.object({ type: z.literal("callout"), tone: z.enum(["tip", "caution", "redflag", "scope"]), title: text(200), text: text(2000) }),
  z.object({ type: z.literal("case"), title: text(200), scenario: text(4000), question: text(600), discussion: text(4000) }),
  z.object({ type: z.literal("script"), title: text(200), lines: z.array(text(1000)).max(20) }),
  z.object({ type: z.literal("steps"), title: text(200), steps: z.array(z.object({ title: text(200), detail: text(2000) })).max(30) }),
  z.object({ type: z.literal("table"), caption: text(300), head: z.array(text(200)).max(8), rows: z.array(z.array(text(1000)).max(8)).max(40) }),
  z.object({ type: z.literal("terms"), items: z.array(z.object({ term: text(120), meaning: text(1000) })).max(40) }),
  z.object({ type: z.literal("template"), title: text(200), body: text(12000) }),
  z.object({ type: z.literal("video"), provider: z.enum(["vimeo", "youtube"]), id: text(40), caption: text(300).optional() }),
  z.object({ type: z.literal("image"), fileId: text(40), alt: text(300), caption: text(300).optional() }),
  z.object({ type: z.literal("file"), fileId: text(40), title: text(200), description: text(500).optional() }),
]);

export const lessonSchema = z.object({
  slug: text(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: text(160),
  detail: text(400),
  minutes: z.number().int().min(1).max(240),
  objectives: z.array(text(300)).max(10),
  blocks: z.array(blockSchema).max(200),
  check: z.array(questionSchema).max(10),
  reflection: text(600),
  takeaways: z.array(text(400)).max(6),
});

export const courseContentSchema = z.object({
  lessons: z.array(lessonSchema).max(40),
  assessment: z.array(questionSchema).max(60),
});

/** The course details saved with each version. */
export const courseMetaSchema = z.object({
  title: z.string().min(1).max(160),
  summary: z.string().max(600),
  audience: z.string().max(300),
  discipline: z.enum(["cosmetic", "clinical", "medical", "everyone"]),
  format: z.string().max(300),
  hours: z.number().int().min(1).max(100),
  priceGBP: z.number().int().min(0).max(5000),
  memberPriceGBP: z.number().int().min(0).max(5000),
  imageKey: z.string().max(40),
  outcomes: z.array(z.string().max(300)).max(10),
});
export type CourseMeta = z.infer<typeof courseMetaSchema>;

/** Everything to fix before a draft can go for review, course details included. */
export function readinessIssues(meta: CourseMeta, content: CourseContent) {
  const issues: string[] = [];
  if (meta.title.trim().length < 3) issues.push("The course needs a title.");
  if (meta.summary.trim().length < 40) issues.push("Write a summary of at least a sentence or two for the course page.");
  if (!meta.audience.trim()) issues.push("Say who the course is for.");
  if (meta.outcomes.filter((o) => o.trim()).length < 2) issues.push("Add at least two things learners will be able to do by the end.");
  if (meta.memberPriceGBP > meta.priceGBP) issues.push("The member price can't be higher than the full price.");
  return [...issues, ...publishIssues(content)];
}

/** Parses stored content, or returns null when it can't be trusted. */
export function parseCourseContent(value: unknown): CourseContent | null {
  const result = courseContentSchema.safeParse(value);
  return result.success ? (result.data as CourseContent) : null;
}

export function emptyCourseContent(): CourseContent {
  return { lessons: [], assessment: [] };
}

/** Lesson slugs that would clash with the learner routes. */
export const RESERVED_LESSON_SLUGS = ["assessment", "certificate"];

export const MIN_ASSESSMENT_QUESTIONS = 5;

/**
 * Everything that must be fixed before a course can be submitted for review,
 * in plain sentences for the builder. An empty list means it's ready.
 */
export function publishIssues(content: CourseContent): string[] {
  const issues: string[] = [];
  if (content.lessons.length === 0) issues.push("Add at least one lesson.");

  const slugs = new Set<string>();
  const ids = new Set<string>();
  const checkQuestion = (q: CourseContent["assessment"][number], where: string) => {
    if (ids.has(q.id)) issues.push(`${where}: two questions share the id "${q.id}".`);
    ids.add(q.id);
    if (!q.prompt.trim()) issues.push(`${where}: a question has no wording.`);
    if (q.options.filter((o) => o.trim()).length < q.options.length) issues.push(`${where}: "${short(q.prompt)}" has an empty answer option.`);
    if (q.answer >= q.options.length) issues.push(`${where}: "${short(q.prompt)}" has no correct answer chosen.`);
    if (q.explain.trim().length < 20) issues.push(`${where}: "${short(q.prompt)}" needs an explanation of the right answer.`);
  };

  content.lessons.forEach((lesson, i) => {
    const where = `Lesson ${i + 1}${lesson.title.trim() ? ` (${short(lesson.title)})` : ""}`;
    if (!lesson.title.trim()) issues.push(`${where} needs a title.`);
    if (slugs.has(lesson.slug)) issues.push(`${where} has the same web address as another lesson.`);
    if (RESERVED_LESSON_SLUGS.includes(lesson.slug)) issues.push(`${where} can't use "${lesson.slug}" as its web address.`);
    slugs.add(lesson.slug);
    if (lesson.blocks.length === 0) issues.push(`${where} has no teaching content yet.`);
    if (lesson.objectives.filter((o) => o.trim()).length === 0) issues.push(`${where} needs at least one learning objective.`);
    if (lesson.check.length < 2) issues.push(`${where} needs at least two knowledge check questions.`);
    if (!lesson.reflection.trim()) issues.push(`${where} needs a reflection question.`);
    if (lesson.takeaways.filter((t) => t.trim()).length < 2) issues.push(`${where} needs at least two takeaways.`);
    lesson.blocks.forEach((block) => {
      if (block.type === "video" && !isValidVideoId(block.provider, block.id)) issues.push(`${where} has a video link we can't play.`);
      if (block.type === "image" && !block.alt.trim()) issues.push(`${where} has an image without a description for screen readers.`);
      if ((block.type === "p" || block.type === "h") && !block.text.trim()) issues.push(`${where} has an empty paragraph or heading.`);
    });
    lesson.check.forEach((q) => checkQuestion(q, where));
  });

  if (content.assessment.length < MIN_ASSESSMENT_QUESTIONS) {
    issues.push(`The final assessment needs at least ${MIN_ASSESSMENT_QUESTIONS} questions.`);
  }
  content.assessment.forEach((q) => checkQuestion(q, "Final assessment"));
  return issues;
}

function short(value: string) {
  const v = value.trim();
  return v.length > 40 ? `${v.slice(0, 40)}…` : v;
}
