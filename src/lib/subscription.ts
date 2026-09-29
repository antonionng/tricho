import { prisma } from "@/lib/prisma";
import { tierByPriceId } from "@/config/subscriptions";

/** Small grace window so a member isn't locked out the instant a renewal is processing. */
const GRACE_PERIOD_MS = 1000 * 60 * 60 * 24; // 24h

export interface MembershipStatus {
  isActive: boolean;
  tierId?: string;
  tierName?: string;
  currentPeriodEnd?: Date | null;
}

/**
 * A user is an active member when they hold a subscription whose current
 * period (plus a short grace window) has not yet elapsed.
 */
export function resolveMembership(user: {
  stripePriceId?: string | null;
  stripeCurrentPeriodEnd?: Date | null;
}): MembershipStatus {
  const end = user.stripeCurrentPeriodEnd ?? null;
  const isActive = !!end && end.getTime() + GRACE_PERIOD_MS > Date.now();
  const tier = tierByPriceId(user.stripePriceId);

  return {
    isActive,
    tierId: tier?.id,
    tierName: tier?.name,
    currentPeriodEnd: end,
  };
}

/**
 * Local development can treat any signed-in user as a member so the product
 * is usable before Stripe price IDs are connected. Never active in production.
 */
export function devMembershipUnlock() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_MEMBERSHIP_UNLOCK === "true"
  );
}

export function canEnterConsultation(role?: string | null) {
  return role === "trichologist" || role === "business" || role === "admin";
}

/** Server-side lookup of the current user's membership status by email. */
export async function getMembershipByEmail(
  email: string | null | undefined
): Promise<MembershipStatus> {
  if (!email) return { isActive: false };

  const user = await prisma.user.findUnique({
    where: { email },
    select: { stripePriceId: true, stripeCurrentPeriodEnd: true },
  });

  if (!user) return { isActive: false };
  return resolveMembership(user);
}
