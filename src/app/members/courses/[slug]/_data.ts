import "server-only";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { courseBySlug } from "@/content/courses";
import { site } from "@/config/site";
import { lessonsOf, progressOf } from "@/lib/courses";

/**
 * Everything a learner screen needs for one person and one course, or null if
 * the course has no lessons. Used by the website's course pages and the app's
 * API (src/app/api/mobile/v1/courses), so both see the same state.
 */
export async function getLearner(userId: string, slug: string) {
  const course = courseBySlug(slug);
  const content = lessonsOf(slug);
  if (!course || !content) return null;

  const [enrolment, user] = await Promise.all([
    prisma.courseEnrolment.findUnique({
      where: { userId_courseSlug: { userId, courseSlug: slug } },
      include: {
        lessons: true,
        attempts: { orderBy: { createdAt: "desc" }, take: 5 },
        certificate: true,
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { staffRole: true, role: true, name: true } }),
  ]);
  const isStaff = !!user?.staffRole || user?.role === "admin";
  const status = enrolment?.status ?? null;
  const active = status === "active" || isStaff;
  const progress = progressOf(slug, enrolment?.lessons ?? [], enrolment?.lastLessonSlug);

  return { userId, name: user?.name ?? null, course, content, enrolment, status, active, isStaff, progress };
}

/**
 * Everything a learner page needs. Signed-out visitors go to sign in; anyone
 * without an active place is sent to the course page to enrol. Staff can open
 * any course to check it, without a place.
 */
export async function loadLearner(slug: string, next: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(`/login?next=${encodeURIComponent(next)}`);
  const learner = await getLearner(userId, slug);
  if (!learner) notFound();
  return learner;
}

export type Learner = NonNullable<Awaited<ReturnType<typeof getLearner>>>;

/** For pages that need an active place: sends everyone else to the right page. */
export async function requireLearner(slug: string, next: string) {
  const learner = await loadLearner(slug, next);
  if (!learner.active) redirect(learner.status === "pending" ? `/members/courses/${slug}` : `/courses/${slug}#enrol`);
  return learner;
}

/** Remembers the lesson a learner last opened, so "Continue" brings them back to it. */
export async function rememberLesson(learner: Learner, lessonSlug: string) {
  const { enrolment } = learner;
  if (enrolment && enrolment.lastLessonSlug !== lessonSlug) {
    await prisma.courseEnrolment.update({ where: { id: enrolment.id }, data: { lastLessonSlug: lessonSlug } }).catch(() => null);
  }
}

/** A member's active places, newest first, with their progress. Empty before the courses migration has run. */
export async function activeEnrolments(userId: string) {
  return prisma.courseEnrolment
    .findMany({
      where: { userId, status: "active" },
      orderBy: { updatedAt: "desc" },
      include: { lessons: { select: { lessonSlug: true, completedAt: true } }, certificate: true },
    })
    .catch(() => []);
}

/** The public link that proves a certificate is genuine, and the "Add to LinkedIn" link. */
export function certificateLinks(certificate: { id: string; courseTitle: string; issuedAt: Date }) {
  const url = `${site.url.replace(/\/$/, "")}/certificates/${certificate.id}`;
  const linkedIn = `https://www.linkedin.com/profile/add?${new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: certificate.courseTitle,
    organizationName: site.name,
    issueYear: String(certificate.issuedAt.getFullYear()),
    issueMonth: String(certificate.issuedAt.getMonth() + 1),
    certUrl: url,
    certId: certificate.id,
  })}`;
  return { url, linkedIn };
}
