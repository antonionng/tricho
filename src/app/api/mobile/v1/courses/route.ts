import { json, withMember } from "@/lib/mobile/api";
import { courses } from "@/content/courses";
import { progressOf } from "@/lib/courses";
import { activeEnrolments } from "@/app/members/courses/[slug]/_data";
import { courseCard } from "./_shared";

/**
 * Every course, with this member's place and progress on each. Mirrors the
 * courses on the Learn page: their own discipline first, and anyone with a
 * place can reach it whether or not they are a member.
 */
export const GET = withMember(async (_req, ctx) => {
  const enrolments = await activeEnrolments(ctx.session.user.id);
  const bySlug = new Map(enrolments.map((e) => [e.courseSlug, e]));
  const sorted = [...courses].sort((a, b) => Number(b.discipline === ctx.profession) - Number(a.discipline === ctx.profession));

  let cpdHours = 0;
  const list = sorted.map((course) => {
    const e = bySlug.get(course.slug);
    const certificate = e?.certificate && !e.certificate.withdrawnAt ? e.certificate : null;
    if (certificate) cpdHours += certificate.hours;
    const progress = e ? progressOf(course.slug, e.lessons, e.lastLessonSlug) : null;
    return {
      ...courseCard(course, ctx.membership.isActive),
      enrolment: e
        ? {
            done: progress!.done,
            total: progress!.total,
            percent: progress!.percent,
            next: progress!.next,
            updatedAt: e.updatedAt,
            certificate: certificate ? { id: certificate.id, hours: certificate.hours, issuedAt: certificate.issuedAt } : null,
          }
        : null,
    };
  });

  // Their own courses first, most recently worked on at the top.
  const mine = list
    .filter((c) => c.enrolment)
    .sort((a, b) => new Date(b.enrolment!.updatedAt).getTime() - new Date(a.enrolment!.updatedAt).getTime())
    .map((c) => c.slug);

  return json({ courses: list, mine, cpdHours, member: ctx.membership.isActive });
});
