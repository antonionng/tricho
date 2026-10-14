import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { courses as staticCourses, type Course } from "@/content/courses";
import { courseContent } from "@/content/course-lessons";
import type { CourseContent } from "@/content/course-types";
import { parseCourseContent } from "@/content/course-schema";
import { images } from "@/content/images";
import type { ImageKey } from "@/content/gazette/types";

/**
 * The one place pages ask for a course. Courses written in code
 * (src/content/courses.ts) and courses built in the course builder (the
 * Course table) come back in the same shape, so the course page, checkout,
 * lessons and certificates don't need to know which kind they have.
 *
 * Builder courses are read from their approved version, never the draft, so
 * an edit only reaches learners once it has been reviewed.
 */

export type CatalogueCourse = Course & {
  source: "static" | "db";
  /** The Course row id, for builder courses. */
  id: string | null;
  /** The approved version learners see now, for builder courses. */
  versionId: string | null;
  educatorId: string | null;
  sharePct: number | null;
};

const FALLBACK_IMAGE: ImageKey = "ed21";

export { courseMetaSchema, type CourseMeta } from "@/content/course-schema";
import { courseMetaSchema } from "@/content/course-schema";

export function imageKeyOrFallback(key: string): ImageKey {
  return key in images ? (key as ImageKey) : FALLBACK_IMAGE;
}

/** Builds the catalogue shape from a builder course's approved version. */
export function courseFromVersion(
  row: { id: string; slug: string; status: string; educatorId: string | null; sharePct: number | null },
  version: { id: string; meta: unknown; content: unknown }
): { course: CatalogueCourse; content: CourseContent } | null {
  const meta = courseMetaSchema.safeParse(version.meta);
  const content = parseCourseContent(version.content);
  if (!meta.success || !content) return null;
  const m = meta.data;
  return {
    content,
    course: {
      slug: row.slug,
      title: m.title,
      summary: m.summary,
      audience: m.audience,
      discipline: m.discipline,
      format: m.format,
      hours: m.hours,
      priceGBP: m.priceGBP,
      memberPriceGBP: Math.min(m.memberPriceGBP, m.priceGBP),
      status: row.status === "published" ? "open" : "closed",
      outcomes: m.outcomes.filter((o) => o.trim()),
      syllabus: content.lessons.map((l) => ({ title: l.title, detail: l.detail })),
      imageKey: imageKeyOrFallback(m.imageKey),
      source: "db",
      id: row.id,
      versionId: version.id,
      educatorId: row.educatorId,
      sharePct: row.sharePct,
    },
  };
}

function fromStatic(c: Course): CatalogueCourse {
  return { ...c, source: "static", id: null, versionId: null, educatorId: null, sharePct: null };
}

/** A builder course with its approved version, or null if it has never been approved. */
const loadDbCourse = cache(async (slug: string) => {
  const row = await prisma.course
    .findUnique({ where: { slug }, select: { id: true, slug: true, status: true, educatorId: true, sharePct: true, publishedVersionId: true } })
    .catch(() => null);
  if (!row?.publishedVersionId || (row.status !== "published" && row.status !== "unlisted")) return null;
  const version = await prisma.courseVersion.findUnique({ where: { id: row.publishedVersionId }, select: { id: true, meta: true, content: true } });
  return version ? courseFromVersion(row, version) : null;
});

/** Any course by its web address, written in code or built on the site. */
export const getCourse = cache(async (slug: string): Promise<CatalogueCourse | null> => {
  const s = staticCourses.find((c) => c.slug === slug);
  if (s) return fromStatic(s);
  return (await loadDbCourse(slug))?.course ?? null;
});

/**
 * A course's lessons and assessment. Pass the learner's versionId to keep them
 * on the version they started; otherwise the current approved version.
 */
export const getContent = cache(async (slug: string, versionId?: string | null): Promise<CourseContent | null> => {
  if (courseContent[slug]) return courseContent[slug];
  const current = await loadDbCourse(slug);
  if (!current) return null;
  if (!versionId || versionId === current.course.versionId) return current.content;
  const version = await prisma.courseVersion.findFirst({
    where: { id: versionId, course: { slug }, status: { in: ["approved", "superseded"] } },
    select: { content: true },
  });
  return (version && parseCourseContent(version.content)) ?? current.content;
});

/**
 * Every course for the catalogue, written-in-code courses first. Pass
 * `includeClosed` for pages that must still recognise unlisted courses.
 */
export const listCourses = cache(async (opts: { includeClosed?: boolean } = {}): Promise<CatalogueCourse[]> => {
  const rows = await prisma.course
    .findMany({
      where: { status: opts.includeClosed ? { in: ["published", "unlisted"] } : "published", publishedVersionId: { not: null } },
      orderBy: { createdAt: "asc" },
      select: { slug: true },
    })
    .catch(() => []);
  const built = (await Promise.all(rows.map((r) => loadDbCourse(r.slug)))).flatMap((r) => (r ? [r.course] : []));
  return [...staticCourses.map(fromStatic), ...built];
});

/** Lesson count and reading minutes, for course cards. */
export async function courseLength(slug: string) {
  const content = await getContent(slug);
  return { lessons: content?.lessons.length ?? 0, minutes: content?.lessons.reduce((s, l) => s + l.minutes, 0) ?? 0 };
}
