import "server-only";
import { prisma } from "@/lib/prisma";
import { fileUrl } from "@/lib/storage";
import type { CourseContent, LessonBlock } from "@/content/course-types";

/** Public addresses for the images in a lesson, by file id. */
export async function lessonImageUrls(blocks: LessonBlock[]): Promise<Record<string, string>> {
  const ids = blocks.flatMap((b) => (b.type === "image" ? [b.fileId] : []));
  if (!ids.length) return {};
  const rows = await prisma.storedFile.findMany({
    where: { id: { in: ids }, isPublic: true },
    select: { id: true, driver: true, bucket: true, path: true, isPublic: true },
  });
  return Object.fromEntries(rows.map((r) => [r.id, fileUrl(r)]));
}

/** Every uploaded file a course's content refers to. */
export function referencedFiles(content: CourseContent) {
  return new Set(content.lessons.flatMap((l) => l.blocks.flatMap((b) => (b.type === "image" || b.type === "file" ? [b.fileId] : []))));
}
