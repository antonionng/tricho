import "server-only";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/directory";
import { deliver } from "@/lib/mail/send";
import { courses as staticCourses } from "@/content/courses";
import type { CourseContent } from "@/content/course-types";
import { courseContentSchema, emptyCourseContent, parseCourseContent, readinessIssues } from "@/content/course-schema";
import { courseMetaSchema, type CourseMeta } from "@/content/course-schema";
import { DECISION_LABEL, reviewNoteError, reviewOutcome, statusAfterSubmit, submitBlocker, type ReviewDecision } from "@/lib/course-review";
import { courseReviewEmail } from "@/lib/mail/templates/courses";

/**
 * Writing, submitting and reviewing courses built on the site. Studio uses it
 * now; the educator portal uses the same functions, so the rules are the same
 * whoever is editing. Callers check who is allowed to do what.
 */

export type BuilderCourse = {
  id: string;
  slug: string;
  status: string;
  meta: CourseMeta;
  content: CourseContent;
  /** Lesson addresses already seen by learners. They can't change, or progress would be lost. */
  lockedSlugs: string[];
  pending: { id: string; number: number; submittedAt: Date } | null;
  lastReview: { status: string; note: string | null; at: Date | null } | null;
  published: { number: number; reviewedAt: Date | null } | null;
};

export const DEFAULT_META: CourseMeta = {
  title: "",
  summary: "",
  audience: "",
  discipline: "everyone",
  format: "",
  hours: 1,
  priceGBP: 0,
  memberPriceGBP: 0,
  imageKey: "ed21",
  outcomes: [],
};

function metaOf(row: { title: string; summary: string; audience: string; discipline: string; format: string; hours: number; priceGBP: number; memberPriceGBP: number; imageKey: string; outcomes: string[] }): CourseMeta {
  const parsed = courseMetaSchema.safeParse({ ...row, discipline: row.discipline });
  return parsed.success ? parsed.data : { ...DEFAULT_META, title: row.title };
}

/** A web address for a new course that clashes with nothing. */
async function uniqueSlug(title: string) {
  const base = slugify(title) || "course";
  const taken = new Set([
    ...staticCourses.map((c) => c.slug),
    ...(await prisma.course.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } })).map((c) => c.slug),
  ]);
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

export async function createCourse(input: { title: string; createdById: string; educatorId?: string | null }) {
  const title = input.title.trim().slice(0, 160);
  if (title.length < 3) return { ok: false as const, error: "Please give the course a title of at least a few words." };
  const course = await prisma.course.create({
    data: {
      slug: await uniqueSlug(title),
      title,
      imageKey: DEFAULT_META.imageKey,
      draft: emptyCourseContent() as unknown as Prisma.InputJsonValue,
      createdById: input.createdById,
      educatorId: input.educatorId ?? null,
    },
    select: { id: true },
  });
  return { ok: true as const, id: course.id };
}

export async function loadBuilderCourse(id: string): Promise<BuilderCourse | null> {
  const row = await prisma.course.findUnique({
    where: { id },
    include: { versions: { orderBy: { number: "desc" }, take: 10, select: { id: true, number: true, status: true, submittedAt: true, reviewNote: true, reviewedAt: true, content: true } } },
  });
  if (!row) return null;
  const published = row.versions.find((v) => v.id === row.publishedVersionId) ?? null;
  const pending = row.versions.find((v) => v.status === "submitted") ?? null;
  const reviewed = row.versions.find((v) => v.status !== "submitted") ?? null;
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    meta: metaOf(row),
    content: parseCourseContent(row.draft) ?? emptyCourseContent(),
    lockedSlugs: (published && parseCourseContent(published.content)?.lessons.map((l) => l.slug)) || [],
    pending: pending && { id: pending.id, number: pending.number, submittedAt: pending.submittedAt },
    lastReview: reviewed && { status: reviewed.status, note: reviewed.reviewNote, at: reviewed.reviewedAt },
    published: published && { number: published.number, reviewedAt: published.reviewedAt },
  };
}

export type SaveResult = { ok: true; savedAt: string } | { ok: false; error: string };

/** Saves the working draft. It only checks the shape, so an unfinished course still saves. */
export async function saveDraft(id: string, payload: { meta: unknown; content: unknown }): Promise<SaveResult> {
  const meta = courseMetaSchema.safeParse(payload.meta);
  if (!meta.success) {
    const field = meta.error.issues[0]?.path[0];
    return { ok: false, error: field === "title" ? "The course needs a title." : `Please check the course details (${String(field ?? "details")}).` };
  }
  const content = courseContentSchema.safeParse(payload.content);
  if (!content.success) return { ok: false, error: "Something in the lessons couldn't be saved. Please check the last change and try again." };

  const course = await prisma.course.findUnique({ where: { id }, select: { publishedVersionId: true } });
  if (!course) return { ok: false, error: "We couldn't find that course." };
  // Lessons learners have already seen keep their addresses.
  const published = course.publishedVersionId
    ? await prisma.courseVersion.findUnique({ where: { id: course.publishedVersionId }, select: { content: true } })
    : null;
  const locked = new Set(published ? (parseCourseContent(published.content)?.lessons.map((l) => l.slug) ?? []) : []);
  const slugs = new Set(content.data.lessons.map((l) => l.slug));
  const removed = [...locked].filter((s) => !slugs.has(s));
  if (removed.length) {
    return { ok: false, error: "A lesson that learners have already started can't be deleted. Hide its content instead, or ask the team." };
  }

  const m = meta.data;
  await prisma.course.update({
    where: { id },
    data: {
      title: m.title.trim(),
      summary: m.summary,
      audience: m.audience,
      discipline: m.discipline,
      format: m.format,
      hours: m.hours,
      priceGBP: m.priceGBP,
      memberPriceGBP: Math.min(m.memberPriceGBP, m.priceGBP),
      imageKey: m.imageKey,
      outcomes: m.outcomes,
      draft: content.data as unknown as Prisma.InputJsonValue,
    },
  });
  return { ok: true, savedAt: new Date().toISOString() };
}

export async function submitForReview(id: string, userId: string) {
  const course = await loadBuilderCourse(id);
  if (!course) return { ok: false as const, error: "We couldn't find that course." };
  const issues = readinessIssues(course.meta, course.content);
  const blocker = submitBlocker({ status: course.status as never }, !!course.pending, issues);
  if (blocker) return { ok: false as const, error: blocker, issues };

  const last = await prisma.courseVersion.findFirst({ where: { courseId: id }, orderBy: { number: "desc" }, select: { number: true } });
  const version = await prisma.$transaction(async (tx) => {
    const v = await tx.courseVersion.create({
      data: {
        courseId: id,
        number: (last?.number ?? 0) + 1,
        meta: course.meta as unknown as Prisma.InputJsonValue,
        content: course.content as unknown as Prisma.InputJsonValue,
        submittedById: userId,
      },
      select: { id: true, number: true },
    });
    await tx.course.update({ where: { id }, data: { status: statusAfterSubmit(course.status as never) } });
    return v;
  });
  return { ok: true as const, versionId: version.id, number: version.number };
}

/** Records a review decision. Only a version still waiting for review can be decided. */
export async function reviewVersion(input: { versionId: string; decision: ReviewDecision; note: string; reviewerId: string }) {
  const noteError = reviewNoteError(input.decision, input.note);
  if (noteError) return { ok: false as const, error: noteError };

  const version = await prisma.courseVersion.findUnique({
    where: { id: input.versionId },
    include: { course: { select: { id: true, slug: true, status: true, title: true, publishedVersionId: true, createdById: true, educatorId: true } } },
  });
  if (!version || version.status !== "submitted") return { ok: false as const, error: "That version has already been reviewed." };
  const course = version.course;
  const outcome = reviewOutcome(input.decision, { status: course.status, hasPublished: !!course.publishedVersionId });

  await prisma.$transaction(async (tx) => {
    const updated = await tx.courseVersion.updateMany({
      where: { id: version.id, status: "submitted" },
      data: { status: outcome.version, reviewNote: input.note.trim() || null, reviewedById: input.reviewerId, reviewedAt: new Date() },
    });
    if (updated.count === 0) throw new Error("already reviewed");
    if (input.decision === "approve" && course.publishedVersionId) {
      await tx.courseVersion.update({ where: { id: course.publishedVersionId }, data: { status: "superseded" } });
    }
    await tx.course.update({
      where: { id: course.id },
      data: { status: outcome.course, ...(input.decision === "approve" ? { publishedVersionId: version.id } : {}) },
    });
  });

  await notifyAuthor(course, version.number, input.decision, input.note);
  refreshCourse(course.slug);
  return { ok: true as const, course, number: version.number, outcome };
}

async function notifyAuthor(
  course: { slug: string; title: string; createdById: string | null; id: string; educatorId: string | null },
  number: number,
  decision: ReviewDecision,
  note: string
) {
  if (!course.createdById) return;
  const author = await prisma.user.findUnique({ where: { id: course.createdById }, select: { id: true, name: true, email: true } });
  if (!author) return;
  await prisma.notification.create({
    data: { userId: author.id, kind: "course", title: `${course.title} was ${DECISION_LABEL[decision]}.`, href: `/courses/${course.slug}` },
  });
  if (author.email) {
    const email = courseReviewEmail({ name: author.name, title: course.title, slug: course.slug, number, decision, note, builderHref: builderHref(course) });
    await deliver(author.email, email.subject, email.content, { tag: "course-review" });
  }
}

/** Takes a live course off sale (its learners keep access), or puts it back. */
export async function setListed(id: string, listed: boolean) {
  const course = await prisma.course.findUnique({ where: { id }, select: { slug: true, status: true, publishedVersionId: true } });
  if (!course?.publishedVersionId) return { ok: false as const, error: "Only an approved course can be listed or unlisted." };
  await prisma.course.update({ where: { id }, data: { status: listed ? "published" : "unlisted" } });
  refreshCourse(course.slug);
  return { ok: true as const };
}

/** Where a course is edited: the educator portal for educators' courses (from phase 2), Studio otherwise. */
export function builderHref(course: { id: string; educatorId: string | null }) {
  return course.educatorId ? `/members/educator/courses/${course.id}` : `/studio/courses/${course.id}`;
}

export function refreshCourse(slug: string) {
  try {
    revalidatePath("/learn");
    revalidatePath("/");
    revalidatePath(`/courses/${slug}`);
    revalidatePath("/members/learn");
    revalidatePath("/sitemap.xml");
  } catch {
    // Outside a request.
  }
}
