import { auth } from "@/auth";
import {
  canEnterConsultation,
  devMembershipUnlock,
  getMembershipByEmail,
  isProfessionalPlan,
  type MembershipStatus,
} from "@/lib/subscription";
import { prisma } from "@/lib/prisma";
import type { ProfessionId } from "@/config/rooms";
import { canPostInRoom, type RoomId } from "@/config/rooms";

export async function getMemberContext() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      allowed: false,
      unlocked: false,
      role: null as string | null,
      plan: null as string | null,
      isAdmin: false,
      professional: false,
      profession: null as ProfessionId | null,
      membership: { isActive: false } as MembershipStatus,
      consultation: false,
      chapterId: null as string | null,
      onboarded: false,
    };
  }

  const [membership, user] = await Promise.all([
    getMembershipByEmail(session.user.email),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        chapterId: true,
        onboardedAt: true,
        role: true,
        profile: { select: { profession: true } },
      },
    }),
  ]);
  const unlocked = devMembershipUnlock();
  const role = user?.role ?? session.user.role ?? null;
  const isAdmin = role === "admin";
  const plan = user?.plan ?? membership.tierId ?? null;

  return {
    session,
    membership,
    unlocked,
    allowed: membership.isActive || unlocked || isAdmin,
    role,
    plan,
    isAdmin,
    professional: isProfessionalPlan(plan, role) || unlocked,
    profession: (user?.profile?.profession as ProfessionId | null) ?? null,
    consultation: canEnterConsultation(role) || unlocked,
    chapterId: user?.chapterId ?? null,
    onboarded: !!user?.onboardedAt,
  };
}

export type MemberContext = Awaited<ReturnType<typeof getMemberContext>>;

export function memberCanPost(
  roomId: RoomId,
  ctx: Pick<MemberContext, "professional" | "profession" | "unlocked">
) {
  return canPostInRoom(roomId, ctx);
}

/** For Studio pages and actions. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role === "admin") return session;
  // Local development: let the dev login reach Studio.
  if (devMembershipUnlock()) return session;
  return null;
}
