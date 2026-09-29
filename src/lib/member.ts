import { auth } from "@/auth";
import {
  canEnterConsultation,
  devMembershipUnlock,
  getMembershipByEmail,
  type MembershipStatus,
} from "@/lib/subscription";

export async function getMemberContext() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      allowed: false,
      unlocked: false,
      role: null as string | null,
      membership: { isActive: false } as MembershipStatus,
    };
  }

  const membership = await getMembershipByEmail(session.user.email);
  const unlocked = devMembershipUnlock();

  return {
    session,
    membership,
    unlocked,
    allowed: membership.isActive || unlocked,
    role: session.user.role ?? null,
    consultation: canEnterConsultation(session.user.role) || unlocked,
  };
}
