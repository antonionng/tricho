import { auth } from "@/auth";
import {
  canEnterConsultation,
  devMembershipUnlock,
  getMembershipByEmail,
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
      profession: null as ProfessionId | null,
      membership: { isActive: false } as MembershipStatus,
      consultation: false,
    };
  }

  const membership = await getMembershipByEmail(session.user.email);
  const unlocked = devMembershipUnlock();
  const profile = await prisma.trichologistProfile.findUnique({
    where: { userId: session.user.id },
    select: { profession: true },
  });

  const profession = (profile?.profession as ProfessionId | null) ?? null;

  return {
    session,
    membership,
    unlocked,
    allowed: membership.isActive || unlocked,
    role: session.user.role ?? null,
    profession,
    consultation: canEnterConsultation(session.user.role) || unlocked,
  };
}

export function memberCanPost(roomId: RoomId, profession: ProfessionId | null, unlocked: boolean) {
  return canPostInRoom(roomId, profession, unlocked);
}
