import { prisma } from "@/lib/prisma";
import { isDevOrDemo } from "@/lib/env";
import { tierByPriceId, type PlanId } from "@/config/subscriptions";

/** Small grace window so a member isn't locked out the instant a renewal is processing. */
const GRACE_PERIOD_MS = 1000 * 60 * 60 * 24; // 24h

export interface MembershipStatus {
  isActive: boolean;
  tierId?: PlanId;
  tierName?: string;
  currentPeriodEnd?: Date | null;
  /** Set when Professional comes through a business: the business's name or email. */
  via?: string;
}

/** Team members a Business or Premium Business account can give Professional membership to. */
export const BUSINESS_SEATS = 5;

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
  return isDevOrDemo() && process.env.DEV_MEMBERSHIP_UNLOCK === "true";
}

export function canEnterConsultation(role?: string | null) {
  return role === "trichologist" || role === "business" || role === "admin";
}

/** Professional features: directory profile, Case Room, referrals, Assistant. */
export function isProfessionalPlan(plan?: string | null, role?: string | null) {
  return plan === "professional" || plan === "business" || role === "admin";
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

  const own = user ? resolveMembership(user) : ({ isActive: false } as MembershipStatus);
  if (own.isActive && own.tierId !== "community") return own;
  // Never let the business lookup lock a member out, e.g. before its tables exist.
  const viaBusiness = await businessMembership(email.toLowerCase()).catch((error) => {
    console.error("[BUSINESS_MEMBERSHIP]", error);
    return null;
  });
  return viaBusiness ?? own;
}

/** True when this email holds an active Business plan or manages a Premium partner page. */
export async function isBusinessAccount(email: string) {
  try {
    return await checkBusinessAccount(email);
  } catch (error) {
    console.error("[BUSINESS_ACCOUNT]", error);
    return false;
  }
}

async function checkBusinessAccount(email: string) {
  const [user, premium] = await Promise.all([
    prisma.user.findUnique({
      where: { email },
      select: { plan: true, stripePriceId: true, stripeCurrentPeriodEnd: true },
    }),
    prisma.partner.findFirst({ where: { ownerEmail: email, tier: "premium", hidden: false }, select: { id: true } }),
  ]);
  if (premium) return true;
  return !!user && user.plan === "business" && resolveMembership(user).isActive;
}

/**
 * Professional that comes through a business: the owner of a Premium partner page
 * (invoiced, so there is no Stripe subscription), or a team member on one of the
 * five seats of an active Business or Premium Business account.
 */
async function businessMembership(email: string): Promise<MembershipStatus | null> {
  const professional = (via: string): MembershipStatus => ({
    isActive: true,
    tierId: "professional",
    tierName: "Professional",
    currentPeriodEnd: null,
    via,
  });

  const premium = await prisma.partner.findFirst({
    where: { ownerEmail: email, tier: "premium", hidden: false },
    select: { name: true },
  });
  if (premium) return professional(premium.name);

  const seats = await prisma.businessSeat.findMany({ where: { email }, select: { ownerEmail: true } });
  for (const seat of seats) {
    if (await isBusinessAccount(seat.ownerEmail)) {
      const page = await prisma.partner.findUnique({ where: { ownerEmail: seat.ownerEmail }, select: { name: true } });
      return professional(page?.name ?? seat.ownerEmail);
    }
  }
  return null;
}
