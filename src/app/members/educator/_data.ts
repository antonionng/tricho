import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** The signed-in educator, or a redirect: to sign in, or to the Educators page if they haven't joined. */
export async function requireEducator(next = "/members/educator") {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(`/login?next=${encodeURIComponent(next)}`);
  const profile = await prisma.educatorProfile.findUnique({ where: { userId } }).catch(() => null);
  return { userId, profile };
}

/** A course the signed-in educator owns, or null. */
export async function ownedCourse(courseId: string, educatorId: string) {
  return prisma.course.findFirst({ where: { id: courseId, educatorId }, select: { id: true, slug: true, title: true } });
}
