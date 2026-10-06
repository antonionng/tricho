import "server-only";
import { prisma } from "@/lib/prisma";
import { resolveMembership } from "@/lib/subscription";
import { subscriptionTiers, type PlanId } from "@/config/subscriptions";

/**
 * Memberships bought in the app. RevenueCat holds the App Store and Google Play
 * receipts; the app signs in to RevenueCat with our user id, so the subscriber
 * id is always a User.id. We never trust a webhook body for access: we ask
 * RevenueCat for the subscriber and store what it says.
 */

const PLAN_ORDER: PlanId[] = ["business", "professional", "community"];

/** Product ids name their plan, e.g. "tc_professional_annual" or "tc.community.monthly". */
export function planFromProduct(productId: string): PlanId | null {
  const id = productId.toLowerCase();
  return PLAN_ORDER.find((plan) => id.includes(plan)) ?? null;
}

type RcSubscription = {
  expires_date: string | null;
  store: string;
  unsubscribe_detected_at: string | null;
  billing_issues_detected_at: string | null;
};

export type StoreState = {
  plan: PlanId | null;
  productId: string | null;
  source: string | null;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  billingIssue: boolean;
};

/** The best current subscription from RevenueCat's subscriber record. */
export function storeStateFrom(subscriptions: Record<string, RcSubscription>, now = Date.now()): StoreState {
  let best: StoreState = { plan: null, productId: null, source: null, periodEnd: null, cancelAtPeriodEnd: false, billingIssue: false };
  let latestEnd: Date | null = null;
  for (const [productId, sub] of Object.entries(subscriptions ?? {})) {
    const plan = planFromProduct(productId);
    const end = sub.expires_date ? new Date(sub.expires_date) : null;
    if (!plan || !end) continue;
    if (!latestEnd || end > latestEnd) latestEnd = end;
    if (end.getTime() <= now) continue;
    const better = !best.plan || PLAN_ORDER.indexOf(plan) < PLAN_ORDER.indexOf(best.plan);
    if (better) {
      best = {
        plan,
        productId,
        source: sub.store === "play_store" ? "play_store" : sub.store === "app_store" ? "app_store" : sub.store,
        periodEnd: end,
        cancelAtPeriodEnd: !!sub.unsubscribe_detected_at,
        billingIssue: !!sub.billing_issues_detected_at,
      };
    }
  }
  // Nothing current: keep the last end date so the member's history still reads correctly.
  return best.plan ? best : { ...best, periodEnd: latestEnd };
}

async function fetchSubscriber(userId: string) {
  const key = process.env.REVENUECAT_SECRET_KEY;
  if (!key) throw new Error("REVENUECAT_SECRET_KEY is not set");
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { authorization: `Bearer ${key}`, accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`RevenueCat responded ${res.status}`);
  const json = (await res.json()) as { subscriber?: { subscriptions?: Record<string, RcSubscription> } };
  return json.subscriber?.subscriptions ?? {};
}

/**
 * Brings a member's app subscription up to date from RevenueCat, and gives or
 * takes away the plan and role the same way the Stripe webhook does. A Stripe
 * subscription that is still running always keeps its own plan.
 */
export async function syncStoreSubscription(userId: string): Promise<StoreState | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, plan: true, stripePriceId: true, stripeCurrentPeriodEnd: true },
  });
  if (!user) return null;

  const state = storeStateFrom(await fetchSubscriber(userId));
  const stripeActive = resolveMembership(user).isActive;
  const tier = subscriptionTiers.find((t) => t.id === state.plan);

  await prisma.user.update({
    where: { id: userId },
    data: {
      storePlan: state.plan,
      storeProductId: state.productId,
      storeSource: state.source,
      storeCurrentPeriodEnd: state.periodEnd,
      storeCancelAtPeriodEnd: state.cancelAtPeriodEnd,
      ...(state.billingIssue ? { lastPaymentFailedAt: new Date() } : {}),
      ...(!stripeActive ? { plan: state.plan } : {}),
      ...(!stripeActive && user.role !== "admin" ? { role: tier ? tier.grantsRole : "individual" } : {}),
    },
  });
  return state;
}
