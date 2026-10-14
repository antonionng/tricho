import "server-only";
import { prisma } from "@/lib/prisma";
import { fileUrl } from "@/lib/storage";
import { images, img } from "@/content/images";
import type { CourseContent } from "@/content/course-types";

/** Editorial images a course can use as its cover. */
export function coverImages() {
  return Object.entries(images).map(([key, image]) => ({ key, src: img(image, 320), alt: image.alt }));
}

/** Public addresses for every image already in a course, so the builder can preview them. */
export async function draftImageUrls(content: CourseContent): Promise<Record<string, string>> {
  const ids = content.lessons.flatMap((l) => l.blocks.flatMap((b) => (b.type === "image" && b.fileId ? [b.fileId] : [])));
  if (!ids.length) return {};
  const rows = await prisma.storedFile.findMany({ where: { id: { in: ids }, isPublic: true }, select: { id: true, driver: true, bucket: true, path: true, isPublic: true } });
  return Object.fromEntries(rows.map((r) => [r.id, fileUrl(r)]));
}
