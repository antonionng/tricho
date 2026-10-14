import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStaff } from "@/lib/staff";
import { signedUrl } from "@/lib/storage";
import { getContent } from "@/lib/course-catalogue";
import { referencedFiles } from "@/lib/course-files";
import { parseCourseContent } from "@/content/course-schema";

export const dynamic = "force-dynamic";

/**
 * A lesson handout. Served only to someone with an active place on the course
 * (or the team), and only if the file belongs to that course, so a file id
 * can't be used to read anything else.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; fileId: string }> }) {
  const { slug, fileId } = await params;
  const notFound = () => new Response("Not found", { status: 404 });
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return notFound();

  const [enrolment, staff] = await Promise.all([
    prisma.courseEnrolment.findUnique({ where: { userId_courseSlug: { userId, courseSlug: slug } }, select: { status: true, versionId: true } }),
    getStaff(),
  ]);
  const isStaff = !!staff?.perms.has("courses.view");
  if (enrolment?.status !== "active" && !isStaff) return notFound();

  // Learners: the version they're studying. The team: the draft too, for the builder's preview.
  const content = await getContent(slug, enrolment?.versionId);
  const allowed = content ? referencedFiles(content) : new Set<string>();
  if (isStaff && !allowed.has(fileId)) {
    const draft = await prisma.course.findUnique({ where: { slug }, select: { draft: true } });
    const parsed = draft && parseCourseContent(draft.draft);
    if (parsed) referencedFiles(parsed).forEach((id) => allowed.add(id));
  }
  if (!allowed.has(fileId)) return notFound();

  const file = await prisma.storedFile.findUnique({ where: { id: fileId } });
  if (!file) return notFound();
  if (file.driver === "supabase") {
    const url = file.isPublic
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/storage/v1/object/public/${file.bucket}/${file.path}`
      : await signedUrl(file);
    return url ? Response.redirect(url, 302) : notFound();
  }
  if (!file.data) return notFound();
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `inline; filename="${(file.name ?? "handout.pdf").replace(/[^\w.\- ]/g, "")}"`,
    },
  });
}
