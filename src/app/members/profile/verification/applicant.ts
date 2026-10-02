import "server-only";
import { prisma } from "@/lib/prisma";
import type { MemberContext } from "@/lib/member";
import { canApply } from "@/lib/verification";

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
