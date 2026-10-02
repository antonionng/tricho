import { prisma } from "@/lib/prisma";
import { subscriptionTiers } from "@/config/subscriptions";
import { SYSTEM_USER_EMAIL } from "@/agents/publish";

const DAY = 24 * 60 * 60 * 1000;

type BillingRow = { plan: string | null; isFounding: boolean; stripeCurrentPeriodEnd: Date | null; createdAt: Date };

/** Membership figures from billing rows. Pure, so it can be tested without a database. */
export function membershipFigures(users: BillingRow[], now = new Date()) {
  const isActive = (u: BillingRow) => !!u.stripeCurrentPeriodEnd && u.stripeCurrentPeriodEnd > now;
  const monthAgo = new Date(now.getTime() - 30 * DAY);
  const active = users.filter(isActive);
  const lapsed = users.filter(
    (u) => !!u.plan && !!u.stripeCurrentPeriodEnd && u.stripeCurrentPeriodEnd <= now && u.stripeCurrentPeriodEnd > monthAgo
  );
  const mrr = subscriptionTiers.reduce((sum, tier) => {
    const act = active.filter((u) => u.plan === tier.id);
    const founding = act.filter((u) => u.isFounding).length;
    return sum + (act.length - founding) * tier.price + founding * (tier.foundingPrice ?? tier.price);
  }, 0);
  return {
    accounts: users.length,
    active: active.length,
    joined30: users.filter((u) => u.createdAt > monthAgo).length,
    lapsed30: lapsed.length,
    mrr,
  };
}

/** Everything the Overview shows. Each figure is one small query. */
export async function getOverview() {
  {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * DAY);
    const [users, drafts, openReports, events, subscribers, subscribers30, posts30, comments30, editions, episodes, recent] =
      await Promise.all([
        prisma.user.findMany({
          where: { NOT: { email: SYSTEM_USER_EMAIL } },
          select: { plan: true, isFounding: true, stripeCurrentPeriodEnd: true, createdAt: true },
        }),
        prisma.draft.groupBy({ by: ["kind"], where: { status: "draft", kind: { not: "event_prefill" } }, _count: { _all: true } }),
        prisma.report.count({ where: { resolvedAt: null } }),
        prisma.event.findMany({
          where: { startsAt: { gte: now } },
          orderBy: { startsAt: "asc" },
          take: 4,
          select: { id: true, title: true, startsAt: true, published: true, capacity: true, _count: { select: { rsvps: true } } },
        }),
        prisma.subscriber.count({ where: { unsubscribedAt: null } }),
        prisma.subscriber.count({ where: { createdAt: { gte: monthAgo } } }),
        prisma.communityPost.count({ where: { createdAt: { gte: monthAgo } } }),
        prisma.comment.count({ where: { createdAt: { gte: monthAgo } } }),
        prisma.gazetteEdition.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.podcastEpisode.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
      ]);
    return {
      members: membershipFigures(users, now),
      drafts: drafts.map((d) => ({ kind: d.kind, count: d._count._all })),
      openReports,
      events,
      subscribers,
      subscribers30,
      posts30,
      comments30,
      editions: Object.fromEntries(editions.map((e) => [e.status, e._count._all])) as Record<string, number>,
      episodes: Object.fromEntries(episodes.map((e) => [e.status, e._count._all])) as Record<string, number>,
      recent,
    };
  }
}
