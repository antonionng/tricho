import "server-only";
import { prisma } from "@/lib/prisma";
import { getMembershipByEmail, isProfessionalPlan } from "@/lib/subscription";
import type { Recipient } from "@/lib/client-referrals";

/** A member who might receive a referral, with what decides whether they can. */
export async function loadRecipient(id: string): Promise<(Recipient & { name: string | null; email: string | null }) | null> {
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      role: true,
      staffRole: true,
      accessStatus: true,
      listings: { where: { status: "listed" }, select: { acceptsReferrals: true } },
    },
  });
  if (!user) return null;
  const membership = await getMembershipByEmail(user.email).catch(() => null);
  const plan = (membership?.via ? membership.tierId : user.plan ?? membership?.tierId) ?? null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    active: user.accessStatus === "active",
    professional: isProfessionalPlan(plan, user.role) || !!user.staffRole,
    listings: user.listings.map((l) => l.acceptsReferrals),
  };
}

/** New referrals waiting for this member, for the badge in the menu. */
export function unreadReferrals(userId: string) {
  return prisma.referral.count({ where: { toId: userId, status: "sent" } }).catch(() => 0);
}
