import { fail, json, withMember } from "@/lib/mobile/api";
import { publicQuestions } from "@/lib/courses";
import { getLearner, rememberLesson } from "@/app/members/courses/[slug]/_data";
import { notEnrolled } from "../../../_shared";

type Params = { slug: string; lesson: string };

/**
 * One lesson: the teaching, the knowledge check (without its answers) and the
 * learner's own notes. Opening it marks it as where to continue, as on the web.
 */
export const GET = withMember<Params>(async (_req, ctx, { slug, lesson: lessonSlug }) => {
  const learner = await getLearner(ctx.session.user.id, slug);
  if (!learner) return fail(404, "We couldn't find that course.");
  if (!learner.active) return notEnrolled();

  const { content, enrolment, progress, course } = learner;
  const index = content.lessons.findIndex((l) => l.slug === lessonSlug);
  if (index < 0) return fail(404, "We couldn't find that lesson.");
  const lesson = content.lessons[index];
  const prev = content.lessons[index - 1];
  const next = content.lessons[index + 1];
  const row = enrolment?.lessons.find((l) => l.lessonSlug === lessonSlug);

  await rememberLesson(learner, lessonSlug);

  return json({
    course: { slug: course.slug, title: course.title },
    index,
    count: content.lessons.length,
    percent: progress.percent,
    lesson: {
      slug: lesson.slug,
      title: lesson.title,
      detail: lesson.detail,
      minutes: lesson.minutes,
      objectives: lesson.objectives,
      blocks: lesson.blocks,
      takeaways: lesson.takeaways,
      reflection: lesson.reflection,
      check: publicQuestions(lesson.check),
    },
    done: !!row?.completedAt,
    notes: row?.notes ?? "",
    reflection: row?.reflection ?? "",
    canSave: !!enrolment && enrolment.status === "active",
    prev: prev ? { slug: prev.slug, title: prev.title } : null,
    next: next ? { slug: next.slug, title: next.title } : null,
    outline: content.lessons.map((l) => ({ slug: l.slug, title: l.title, done: progress.complete.has(l.slug) })),
  });
});
