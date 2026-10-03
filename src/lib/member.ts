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
import { canPostInRoom, type Room, type RoomId } from "@/config/rooms";
import type { StaffRoleId } from "@/config/staff";

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
      staffRole: null as StaffRoleId | null,
      restricted: null as Restriction | null,
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
        staffRole: true,
        accessStatus: true,
        accessReason: true,
        accessUntil: true,
        mutedUntil: true,
        lastSeenAt: true,
        profile: { select: { profession: true } },
      },
    }),
  ]);
  // Last seen, at most once an hour, without holding up the page.
  if (user && (!user.lastSeenAt || Date.now() - user.lastSeenAt.getTime() > 60 * 60 * 1000)) {
    prisma.user.update({ where: { id: session.user.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }
  const unlocked = devMembershipUnlock();
  const role = user?.role ?? session.user.role ?? null;
  const staffRole = (user?.staffRole ?? null) as StaffRoleId | null;
  const isAdmin = !!staffRole || role === "admin";
  const plan = (membership.via ? membership.tierId : user?.plan ?? membership.tierId) ?? null;
  const restricted = user ? restrictionOf(user) : null;
  const blocked = !!restricted && restricted.status !== "muted";

  return {
    session,
    membership,
    unlocked,
    allowed: !blocked && (membership.isActive || unlocked || isAdmin),
    role,
    plan,
    isAdmin,
    staffRole,
    restricted,
    professional: !blocked && (isProfessionalPlan(plan, role) || isAdmin || unlocked),
    profession: (user?.profile?.profession as ProfessionId | null) ?? null,
    consultation: !blocked && (canEnterConsultation(role) || isAdmin || (!!membership.via && membership.tierId !== "community") || unlocked),
    chapterId: user?.chapterId ?? null,
    onboarded: !!user?.onboardedAt,
  };
}

export type Restriction = {
  status: "suspended" | "banned" | "muted";
  until: Date | null;
  reason: string | null;
};

/** Suspensions and mutes end on their own once the date passes, so no job has to lift them. */
export function restrictionOf(
  user: { accessStatus: string; accessReason?: string | null; accessUntil?: Date | null; mutedUntil?: Date | null },
  now = new Date()
): Restriction | null {
  if (user.accessStatus === "banned") return { status: "banned", until: null, reason: user.accessReason ?? null };
  if (user.accessStatus === "suspended" && (!user.accessUntil || user.accessUntil > now)) {
    return { status: "suspended", until: user.accessUntil ?? null, reason: user.accessReason ?? null };
  }
  if (user.mutedUntil && user.mutedUntil > now) return { status: "muted", until: user.mutedUntil, reason: null };
  return null;
}

export type MemberContext = Awaited<ReturnType<typeof getMemberContext>>;

/** Pass the rooms from getRooms() so rooms managed in Studio are respected. */
export function memberCanPost(
  roomId: RoomId,
  ctx: Pick<MemberContext, "professional" | "profession" | "unlocked">,
  rooms?: Room[]
) {
  return canPostInRoom(roomId, ctx, rooms);
}

/** For Studio pages and actions: the session of anyone on the team. Prefer requirePermission in src/lib/staff. */
export async function requireAdmin() {
  const { getStaff } = await import("@/lib/staff");
  const staff = await getStaff();
  if (!staff) return null;
  return auth();
}
