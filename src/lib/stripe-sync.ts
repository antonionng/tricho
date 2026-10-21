import type Stripe from "stripe";
import { unstable_cache } from "next/cache";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { isPremiumSubscription, tierById, tierByPriceId } from "@/config/subscriptions";

/**
 * A safety net for the Stripe webhook. When someone has paid but the webhook never wrote the
 * subscription to their account (a failed delivery, or a checkout under a second Stripe customer),
 * this finds their subscription in Stripe by email and records it, so a paying member is never
 * left looking at a paywall.
 */

/** Statuses that still mean the member has paid for the current period. */
const LIVE: Stripe.Subscription.Status[] = ["active", "trialing", "past_due"];

export type StripeMembership = {
  customerId: string;
  subscriptionId: string;
  priceId: string | null;
  periodEnd: Date | null;
  planId: "community" | "professional" | "business" | null;
  founding: boolean;
};

function periodEndOf(subscription: Stripe.Subscription): Date | null {
  const item = subscription.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined;
  const ts = item?.current_period_end ?? (subscription as unknown as { current_period_end?: number }).current_period_end;
  return ts ? new Date(ts * 1000) : null;
}

/** The live membership subscription Stripe holds for this email, across every customer with it. */
export async function findStripeMembership(email: string): Promise<StripeMembership | null> {
  if (!process.env.STRIPE_SECRET_KEY || !email) return null;
  const customers = await stripe.customers.list({ email: email.toLowerCase(), limit: 10 });
  let best: StripeMembership | null = null;
  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 10 });
    for (const s of subs.data) {
      if (!LIVE.includes(s.status)) continue;
      const priceId = s.items.data[0]?.price.id ?? null;
      const tier = isPremiumSubscription(priceId, s.metadata) ? tierById("business") : tierByPriceId(priceId);
      // Only membership subscriptions; partner offers and anything else are left to their own code.
      if (!tier) continue;
      const found: StripeMembership = {
        customerId: customer.id,
        subscriptionId: s.id,
        priceId,
        periodEnd: periodEndOf(s),
        planId: tier.id,
        founding: s.metadata?.founding === "1",
      };
      if (!best || (found.periodEnd?.getTime() ?? 0) > (best.periodEnd?.getTime() ?? 0)) best = found;
    }
  }
  return best;
}

/** The same lookup, remembered for ten minutes, so free accounts don't call Stripe on every page. */
const findCached = (email: string) =>
  unstable_cache(
    async () => {
      const m = await findStripeMembership(email);
      // The cache stores JSON, so dates travel as strings.
      return m ? { ...m, periodEnd: m.periodEnd?.toISOString() ?? null } : null;
    },
    ["stripe-membership", email],
    { revalidate: 600 }
  )();

/**
 * Looks the email up in Stripe and, when it has a live membership the account does not show,
 * writes it to the account. Returns true when the account was updated. Never throws.
 */
export async function syncMembershipFromStripe(email: string | null | undefined, opts: { fresh?: boolean } = {}) {
  if (!email || !process.env.STRIPE_SECRET_KEY) return false;
  const key = email.toLowerCase();
  try {
    const found = opts.fresh
      ? await findStripeMembership(key)
      : await findCached(key).then((m) => (m ? { ...m, periodEnd: m.periodEnd ? new Date(m.periodEnd) : null } : null));
    if (!found) return false;

    const user = await prisma.user.findUnique({
      where: { email: key },
      select: { id: true, role: true, stripeSubscriptionId: true, stripeCurrentPeriodEnd: true },
    });
    if (!user) return false;
    const current = user.stripeSubscriptionId === found.subscriptionId && user.stripeCurrentPeriodEnd?.getTime() === found.periodEnd?.getTime();
    if (current) return false;

    // The customer and subscription ids are unique, so release them from any other row first
    // (for example an account the webhook created under a differently written email).
    await prisma.user.updateMany({
      where: {
        id: { not: user.id },
        OR: [{ stripeCustomerId: found.customerId }, { stripeSubscriptionId: found.subscriptionId }],
      },
      data: { stripeCustomerId: null, stripeSubscriptionId: null },
    });
    const tier = found.planId ? tierById(found.planId) : undefined;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeCustomerId: found.customerId,
        stripeSubscriptionId: found.subscriptionId,
        stripePriceId: found.priceId,
        stripeCurrentPeriodEnd: found.periodEnd,
        ...(found.planId ? { plan: found.planId } : {}),
        ...(found.founding ? { isFounding: true } : {}),
        // Billing sets the role, but never demotes an admin.
        ...(tier && user.role !== "admin" ? { role: tier.grantsRole } : {}),
      },
    });
    console.info("[STRIPE_SYNC] recorded a membership the webhook missed", { userId: user.id, plan: found.planId });
    return true;
  } catch (error) {
    console.error("[STRIPE_SYNC]", error);
    return false;
  }
}
