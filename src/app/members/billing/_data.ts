import "server-only";
import { prisma } from "@/lib/prisma";
import type { MemberContext } from "@/lib/member";
import { tierById } from "@/config/subscriptions";

/** The member's plan, when it renews and whether they can upgrade. Shared by the billing page and the app. */
export async function loadBilling(ctx: MemberContext, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isFounding: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      cancelAtPeriodEnd: true,
      storeSource: true,
      storeCancelAtPeriodEnd: true,
    },
  });
  const active = ctx.membership.isActive;
  const tier = tierById(ctx.membership.tierId ?? ctx.plan);
  const end = ctx.membership.currentPeriodEnd;
  const upgrade = active && tier?.id === "community" ? tierById("professional") : undefined;
  return { user, active, tier, end, upgrade };
}

/**
 * Where a membership is managed: the store it was bought in, the website for
 * Stripe, or "team" when a business or the Trichollective team provides it.
 */
export function managedIn(
  user: { storeSource: string | null; stripeSubscriptionId: string | null } | null,
  membership: { via?: string | null }
) {
  if (user?.storeSource && !user.stripeSubscriptionId) return user.storeSource;
  if (membership.via) return "team";
  if (user?.stripeSubscriptionId) return "web";
  return null;
}
