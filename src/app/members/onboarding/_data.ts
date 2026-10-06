import "server-only";
import { prisma } from "@/lib/prisma";

/** Messages for the ?error= codes the onboarding actions redirect with. */
export const ONBOARDING_ERRORS: Record<string, string> = {
  discipline: "Please choose the option closest to your work.",
  chapter: "Please choose a chapter, or none for now.",
  photo: "We couldn't use that photo. Please upload a JPEG, PNG or WebP image under 8MB.",
};

/** What onboarding needs to know about the member to fill in each step. */
export function onboardingUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, image: true, chapterId: true, chapter: { select: { slug: true, city: true } }, profile: true },
  });
}

/** Every chapter, for the chapter step. */
export function onboardingChapters() {
  return prisma.chapter.findMany({ orderBy: [{ country: "asc" }, { city: "asc" }] });
}
