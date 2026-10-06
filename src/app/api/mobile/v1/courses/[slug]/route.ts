import { fail, json, withMember } from "@/lib/mobile/api";
import { courseBySlug } from "@/content/courses";
import { PASS_MARK } from "@/lib/courses";
import { getLearner } from "@/app/members/courses/[slug]/_data";
import { courseCard } from "../_shared";

/**
 * One course. Everyone gets the outline; a learner with a place (or a member of
 * the team, previewing) also gets the lessons, their progress and their record.
 * Mirrors /members/courses/[slug] and the outline on /courses/[slug].
 */
export const GET = withMember<{ slug: string }>(async (_req, ctx, { slug }) => {
  const course = courseBySlug(slug);
  if (!course) return fail(404, "We couldn't find that course.");
  const learner = await getLearner(ctx.session.user.id, slug).catch(() => null);

  const outline = {
    ...courseCard(course, ctx.membership.isActive),
    outcomes: course.outcomes,
    syllabus: course.syllabus,
  };
  const access = learner?.active ? "active" : learner?.status === "pending" ? "pending" : "none";
  if (!learner || access !== "active") return json({ course: outline, access, member: ctx.membership.isActive });

  const { content, enrolment, progress } = learner;
  const byLesson = new Map((enrolment?.lessons ?? []).map((l) => [l.lessonSlug, l]));
  const certificate = enrolment?.certificate && !enrolment.certificate.withdrawnAt ? enrolment.certificate : null;
  const best = enrolment?.attempts.reduce<number | null>((m, a) => Math.max(m ?? 0, a.score), null) ?? null;
  const allDone = progress.total > 0 && progress.done === progress.total;

  return json({
    course: outline,
    access,
    member: ctx.membership.isActive,
    /** A member of the team reading the course without a place: nothing is saved. */
    preview: learner.isStaff && !enrolment,
    activatedAt: enrolment?.activatedAt ?? null,
    progress: { done: progress.done, total: progress.total, percent: progress.percent, next: progress.next },
    reflections: (enrolment?.lessons ?? []).filter((l) => l.reflection?.trim()).length,
    lessons: content.lessons.map((l) => {
      const row = byLesson.get(l.slug);
      return {
        slug: l.slug,
        title: l.title,
        detail: l.detail,
        minutes: l.minutes,
        done: !!row?.completedAt,
        checkScore: row?.checkScore ?? null,
        checkTotal: row?.checkTotal ?? null,
        reflected: !!row?.reflection?.trim(),
      };
    }),
    assessment: {
      questions: content.assessment.length,
      passMark: PASS_MARK,
      best,
      open: allDone || learner.isStaff,
      passed: !!certificate,
    },
    certificate: certificate ? { id: certificate.id, hours: certificate.hours, issuedAt: certificate.issuedAt } : null,
  });
});
