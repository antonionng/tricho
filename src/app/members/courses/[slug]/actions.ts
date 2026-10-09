"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { grade, lessonsOf, maybeIssueCertificate, progressOf } from "@/lib/courses";

/**
 * Learner actions. Each one checks the signed-in person has an active place
 * on the course, so a lesson id or course slug sent from the browser can
 * never touch someone else's record.
 */

async function activeEnrolment(slug: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const enrolment = await prisma.courseEnrolment.findUnique({ where: { userId_courseSlug: { userId, courseSlug: slug } } });
  return enrolment?.status === "active" ? enrolment : null;
}

const PREVIEW = "This is a preview, so your answers aren't saved. Enrol to keep your progress.";

export type CheckResult =
  | { ok: true; score: number; total: number; results: { id: string; chosen: number | null; correct: boolean; answer: number; explain: string }[]; saved: boolean; note?: string }
  | { ok: false; error: string };

/** Marks a lesson's knowledge check. Answering it completes the lesson, whatever the score. */
export async function submitCheck(slug: string, lessonSlug: string, answers: Record<string, number>): Promise<CheckResult> {
  const lesson = lessonsOf(slug)?.lessons.find((l) => l.slug === lessonSlug);
  if (!lesson) return { ok: false, error: "We couldn't find that lesson." };
  const graded = grade(lesson.check, answers);
  if (graded.results.some((r) => r.chosen == null)) return { ok: false, error: "Please answer every question first." };

  const enrolment = await activeEnrolment(slug);
  if (!enrolment) return { ok: true, score: graded.score, total: graded.total, results: graded.results, saved: false, note: PREVIEW };

  const existing = await prisma.lessonProgress.findUnique({ where: { enrolmentId_lessonSlug: { enrolmentId: enrolment.id, lessonSlug } } });
  await prisma.lessonProgress.upsert({
    where: { enrolmentId_lessonSlug: { enrolmentId: enrolment.id, lessonSlug } },
    create: { enrolmentId: enrolment.id, lessonSlug, completedAt: new Date(), checkScore: graded.score, checkTotal: graded.total },
    // Keep their best score, and the date they first finished.
    update: {
      completedAt: existing?.completedAt ?? new Date(),
      checkScore: Math.max(existing?.checkScore ?? 0, graded.score),
      checkTotal: graded.total,
    },
  });
  revalidatePath(`/members/courses/${slug}`, "layout");
  return { ok: true, score: graded.score, total: graded.total, results: graded.results, saved: true };
}

/** Saves a learner's private notes and reflection for one lesson. */
export async function saveNotes(slug: string, lessonSlug: string, fields: { notes?: string; reflection?: string }) {
  if (!lessonsOf(slug)?.lessons.some((l) => l.slug === lessonSlug)) return { ok: false as const };
  const enrolment = await activeEnrolment(slug);
  if (!enrolment) return { ok: false as const };
  const clean = (v: string | undefined) => (typeof v === "string" ? v.slice(0, 20_000) : undefined);
  const data = { notes: clean(fields.notes), reflection: clean(fields.reflection) };
  await prisma.lessonProgress.upsert({
    where: { enrolmentId_lessonSlug: { enrolmentId: enrolment.id, lessonSlug } },
    create: { enrolmentId: enrolment.id, lessonSlug, ...data },
    update: data,
  });
  return { ok: true as const, at: new Date().toISOString() };
}

export type AssessmentResult =
  | { ok: true; passed: boolean; score: number; total: number; needed: number; wrong: string[]; explanations: Record<string, { answer: number; explain: string }> | null; certificate: string | null }
  | { ok: false; error: string };

/**
 * Marks the final assessment. On a pass every explanation is shown and the
 * certificate is issued; on a fail only which questions to revisit, so a
 * retake still tests understanding rather than memory of the answer key.
 */
export async function submitAssessment(slug: string, answers: Record<string, number>): Promise<AssessmentResult> {
  const content = lessonsOf(slug);
  if (!content) return { ok: false, error: "We couldn't find that course." };
  const enrolment = await activeEnrolment(slug);
  if (!enrolment) return { ok: false, error: "You need a place on this course to take the assessment." };

  const lessons = await prisma.lessonProgress.findMany({ where: { enrolmentId: enrolment.id }, select: { lessonSlug: true, completedAt: true } });
  const progress = progressOf(slug, lessons);
  if (progress.done < progress.total) return { ok: false, error: "Finish every lesson first, then come back to the assessment." };

  const graded = grade(content.assessment, answers);
  if (graded.results.some((r) => r.chosen == null)) return { ok: false, error: "Please answer every question before you submit." };

  await prisma.assessmentAttempt.create({
    data: {
      enrolmentId: enrolment.id,
      score: graded.score,
      total: graded.total,
      passed: graded.passed,
      answers: Object.fromEntries(graded.results.map((r) => [r.id, r.chosen])),
    },
  });
  const certificate = graded.passed ? await maybeIssueCertificate(enrolment.id) : null;
  revalidatePath(`/members/courses/${slug}`, "layout");
  revalidatePath("/members/learn");
  return {
    ok: true,
    passed: graded.passed,
    score: graded.score,
    total: graded.total,
    needed: graded.needed,
    wrong: graded.results.filter((r) => !r.correct).map((r) => r.id),
    explanations: graded.passed ? Object.fromEntries(graded.results.map((r) => [r.id, { answer: r.answer, explain: r.explain }])) : null,
    certificate: certificate?.id ?? null,
  };
}

/** Shows or hides a certificate's badge on the member's profile and listing. */
export async function setCertificateOnProfile(form: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  const id = String(form.get("id") ?? "");
  const show = form.get("show") === "1";
  if (!userId || !id) return;
  const certificate = await prisma.certificate.findFirst({ where: { id, userId }, select: { courseSlug: true } });
  if (!certificate) return;
  await prisma.certificate.update({ where: { id }, data: { showOnProfile: show } });
  revalidatePath(`/members/courses/${certificate.courseSlug}/certificate`);
  revalidatePath("/members/profile");
  revalidatePath("/members/learn");
  revalidatePath(`/members/people/${userId}`);
  revalidatePath("/directory", "layout");
}
