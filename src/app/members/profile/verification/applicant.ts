import "server-only";
import { prisma } from "@/lib/prisma";
import type { MemberContext } from "@/lib/member";
import { canApply, MAX_PENDING_REQUESTS } from "@/lib/verification";

/** Whether the signed-in member can apply for the verified badge, and what we know about them. */
export async function loadApplicant(ctx: MemberContext) {
  const userId = ctx.session?.user?.id;
  if (!userId) return null;
  const email = ctx.session?.user?.email?.toLowerCase() ?? null;

  const [user, listing] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, profile: { select: { isVerified: true } } },
    }),
    prisma.directoryListing.findFirst({
      where: {
        status: { in: ["listed", "pending"] },
        OR: [{ userId }, ...(email ? [{ email, userId: null }] : [])],
      },
      select: { id: true, isVerified: true },
    }),
  ]);
  if (!user) return null;

  const blocked = !!ctx.restricted && ctx.restricted.status !== "muted";
  return {
    userId,
    name: user.name,
    email: user.email ?? email,
    isVerified: !!user.profile?.isVerified,
    hasListing: !!listing,
    eligible: canApply({ professional: ctx.professional, hasListing: !!listing, blocked }),
  };
}

/** Messages for the ?error= codes the verification actions redirect with. */
export const VERIFICATION_ERRORS: Record<string, string> = {
  kind: "Please choose what kind of document you are sending.",
  title: "Please describe the document, for example the qualification and the year you were awarded it.",
  file: "Please choose a file to upload.",
  size: "That file is larger than 9MB. Please choose a smaller one, or a photo of the document.",
  type: "Please upload a PDF, or a photo of the document as a JPEG, PNG or WebP.",
  save: "The file could not be saved just now. Please try again in a moment.",
  limit: `You already have ${MAX_PENDING_REQUESTS} documents waiting for review. Please wait for the team to review them, or withdraw one first.`,
};

/** The member's verification requests, newest first. */
export function loadVerificationRequests(userId: string) {
  return prisma.verificationRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, kind: true, title: true, fileId: true, note: true, status: true, reviewNote: true, reviewedAt: true, createdAt: true },
  });
}
