import { json, withMember } from "@/lib/mobile/api";
import { subscriptionTiers } from "@/config/subscriptions";
import { loadBilling, managedIn } from "@/app/members/billing/_data";

/**
 * Membership for the app: the member's plan and where it is managed, and each
 * plan's name, summary and features for the paywall. Prices come from the store,
 * so none are sent here.
 */
export const GET = withMember(async (_req, ctx) => {
  const { user, active, tier, end, upgrade } = await loadBilling(ctx, ctx.session.user.id);
  const cancelling = user?.storeSource && !user.stripeSubscriptionId ? !!user.storeCancelAtPeriodEnd : !!user?.cancelAtPeriodEnd;
  return json({
    membership: {
      isActive: active,
      tierId: tier?.id ?? null,
      tierName: active ? (tier?.name ?? "Membership") : null,
      summary: active ? (tier?.summary ?? null) : null,
      currentPeriodEnd: end ?? null,
      cancelAtPeriodEnd: !ctx.membership.via && cancelling,
      via: ctx.membership.via ?? null,
      complimentary: !!ctx.membership.complimentary,
      isFounding: !!user?.isFounding,
      managedIn: managedIn(user, ctx.membership),
    },
    upgrade: upgrade ? { id: upgrade.id, name: upgrade.name, summary: upgrade.summary, features: upgrade.features.slice(1, 5) } : null,
    plans: subscriptionTiers.map((t) => ({
      id: t.id,
      name: t.name,
      audience: t.audience,
      summary: t.summary,
      features: t.features,
      featured: !!t.featured,
    })),
  });
});
