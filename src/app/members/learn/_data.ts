import "server-only";
import { prisma } from "@/lib/prisma";
import { courseBySlug, courses } from "@/content/courses";
import { progressOf } from "@/lib/courses";

export const AUDIENCE: Record<string, string> = {
  everyone: "Everyone",
  cosmetic: "Cosmetic",
  clinical: "Clinical",
  medical: "Medical",
  brand: "Business",
};

/**
 * Everything on the Learn page: the member's courses and CPD, the course
 * catalogue with their discipline first, and the library sorted for them.
 * Shared by /members/learn and the app.
 */
export async function loadLearn(ctx: { userId: string; allowed: boolean; profession: string | null | undefined }) {
  const enrolments = await prisma.courseEnrolment
    .findMany({
      where: { userId: ctx.userId, status: "active" },
      orderBy: { updatedAt: "desc" },
      include: { lessons: { select: { lessonSlug: true, completedAt: true } }, certificate: true },
    })
    // Before the courses migration has run, show the page without "Your courses".
    .catch(() => []);
  // People who bought a course without joining can still reach their courses.
  const locked = !ctx.allowed && enrolments.length === 0;

  const pieces =
    ctx.allowed && !locked
      ? await prisma.educationPiece.findMany({
          where: { published: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        })
      : [];
  const mine = enrolments
    .map((e) => ({ e, course: courseBySlug(e.courseSlug), progress: progressOf(e.courseSlug, e.lessons, e.lastLessonSlug) }))
    .filter((m): m is typeof m & { course: NonNullable<typeof m.course> } => !!m.course);
  const enrolledSlugs = new Set(mine.map((m) => m.course.slug));
  const earned = mine.filter((m) => m.e.certificate && !m.e.certificate.withdrawnAt);
  const cpdHours = earned.reduce((sum, m) => sum + m.e.certificate!.hours, 0);
  const preferred = ctx.profession || "everyone";
  const rank = (a: string) => (a === preferred ? 0 : a === "everyone" ? 1 : 2);
  const library = [...pieces].sort((a, b) => rank(a.audience) - rank(b.audience) || a.sortOrder - b.sortOrder);
  const catalogue = [...courses].sort((a, b) => Number(b.discipline === ctx.profession) - Number(a.discipline === ctx.profession));

  return { locked, mine, enrolledSlugs, cpdHours, library, catalogue };
}

/** A published library piece, or null. */
export async function publishedPiece(id: string) {
  const piece = await prisma.educationPiece.findUnique({ where: { id } });
  return piece && piece.published ? piece : null;
}
