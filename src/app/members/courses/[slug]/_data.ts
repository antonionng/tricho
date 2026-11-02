import "server-only";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getContent, getCourse } from "@/lib/course-catalogue";
import { progressOf } from "@/lib/courses";

/**
 * Everything a learner page needs. Signed-out visitors go to sign in; anyone
 * without an active place is sent to the course page to enrol. Staff can open
 * any course to check it, without a place.
 */
export async function loadLearner(slug: string, next: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(`/login?next=${encodeURIComponent(next)}`);

  const course = await getCourse(slug);
  if (!course) notFound();

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
  // Learners stay on the version they enrolled on; everyone else sees the current one.
  const content = await getContent(slug, enrolment?.versionId);
  if (!content) notFound();
  const status = enrolment?.status ?? null;
  const active = status === "active" || isStaff;
  const progress = progressOf(content.lessons, enrolment?.lessons ?? [], enrolment?.lastLessonSlug);

  return { userId, name: user?.name ?? null, course, content, enrolment, status, active, isStaff, progress };
}

export type Learner = Awaited<ReturnType<typeof loadLearner>>;

/** For pages that need an active place: sends everyone else to the right page. */
export async function requireLearner(slug: string, next: string) {
  const learner = await loadLearner(slug, next);
  if (!learner.active) redirect(learner.status === "pending" ? `/members/courses/${slug}` : `/courses/${slug}#enrol`);
  return learner;
}
