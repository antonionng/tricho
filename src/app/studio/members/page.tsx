import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { subscriptionTiers } from "@/config/subscriptions";
import { SYSTEM_USER_EMAIL } from "@/agents/publish";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Empty, Notice, PageHeader, Section, Stat, Tag, dateOnly, fieldClass } from "@/components/studio/ui";
import { cn } from "@/lib/utils";
import { studioPage } from "../_lib/guard";
import { makeAdminAction } from "../actions";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; confirm?: string; notice?: string }>;
}) {
  if (!(await studioPage("/studio/members"))) return null;
  const { q = "", confirm, notice } = await searchParams;
  const now = new Date();
  const notSystem: Prisma.UserWhereInput = { NOT: { email: SYSTEM_USER_EMAIL } };

  const [users, recentJoins, confirmUser, listingSources, subscriberSources] = await Promise.all([
    prisma.user.findMany({
      where: notSystem,
      select: { plan: true, isFounding: true, stripeCurrentPeriodEnd: true, signupSource: true },
    }),
    prisma.user.count({ where: { ...notSystem, createdAt: { gte: new Date(now.getTime() - 30 * DAY) } } }),
    confirm ? prisma.user.findUnique({ where: { id: confirm }, select: { id: true, name: true, email: true } }) : null,
    prisma.directoryListing.groupBy({ by: ["source"], where: { isSample: false }, _count: { _all: true } }),
    prisma.subscriber.groupBy({ by: ["utmSource"], _count: { _all: true } }),
  ]);

  // Where people came from: paid members, free listings and email sign-ups, side by side.
  const sourceRows = (() => {
    const map = new Map<string, { members: number; listings: number; emails: number }>();
    const row = (k: string | null) => {
      const key = k || "direct";
      if (!map.has(key)) map.set(key, { members: 0, listings: 0, emails: 0 });
      return map.get(key)!;
    };
    for (const u of users) if (u.plan) row(u.signupSource).members++;
    for (const l of listingSources) row(l.source).listings += l._count._all;
    for (const s of subscriberSources) row(s.utmSource).emails += s._count._all;
    return [...map.entries()].sort((a, b) => b[1].members + b[1].listings + b[1].emails - (a[1].members + a[1].listings + a[1].emails));
  })();

  const isActive = (u: { stripeCurrentPeriodEnd: Date | null }) => !!u.stripeCurrentPeriodEnd && u.stripeCurrentPeriodEnd > now;
  const active = users.filter(isActive);
  const founding = users.filter((u) => u.isFounding).length;

  const byPlan = subscriptionTiers.map((tier) => {
    const all = users.filter((u) => u.plan === tier.id);
    const act = all.filter(isActive);
    const foundingActive = act.filter((u) => u.isFounding).length;
    const mrr = (act.length - foundingActive) * tier.price + foundingActive * (tier.foundingPrice ?? tier.price);
    return { tier, total: all.length, active: act.length, mrr };
  });
  const noPlan = users.filter((u) => !u.plan).length;
  const mrr = byPlan.reduce((sum, p) => sum + p.mrr, 0);

  const query = q.trim();
  const members = await prisma.user.findMany({
    where: {
      ...notSystem,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { profile: { location: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      plan: true,
      isFounding: true,
      stripeCurrentPeriodEnd: true,
      onboardedAt: true,
      createdAt: true,
      profile: { select: { location: true, profession: true } },
    },
  });

  return (
    <div className="space-y-10">
      <PageHeader title="Members" intro="Who has joined, which plan they're on, and roughly what that brings in each month." />

      {notice && <Notice>{notice}</Notice>}

      {confirmUser && (
        <div className="space-y-3 rounded-2xl border-2 border-ink bg-card p-5">
          <p className="font-medium text-ink">
            Give {confirmUser.name ?? confirmUser.email} full Studio access?
          </p>
          <p className="text-sm text-ink-2">
            They&apos;ll be able to approve and publish everything here, send the newsletter, and make other people admins too.
          </p>
          <div className="flex gap-2">
            <form action={makeAdminAction}>
              <input type="hidden" name="id" value={confirmUser.id} />
              <input type="hidden" name="confirm" value="yes" />
              <input type="hidden" name="q" value={query} />
              <SubmitButton>Yes, make them an admin</SubmitButton>
            </form>
            <Button asChild variant="outline">
              <Link href={query ? `/studio/members?q=${encodeURIComponent(query)}` : "/studio/members"}>Cancel</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active members" value={active.length} note={`${users.length} accounts in total`} />
        <Stat label="Founding" value={founding} />
        <Stat label="Joined, last 30 days" value={recentJoins} />
        <Stat
          label="Monthly income"
          value={`£${mrr.toLocaleString("en-GB")}`}
          note="An estimate: plan prices × active members, using founding prices for founding members. Annual plans and discounts aren't counted. Stripe has the real figure."
        />
      </div>

      <Section title="Where people came from">
        <div className="overflow-x-auto rounded-2xl border border-rule bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-rule text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Paying members</th>
                <th className="px-4 py-3 font-medium">Free listings</th>
                <th className="px-4 py-3 font-medium">Email sign-ups</th>
              </tr>
            </thead>
            <tbody>
              {sourceRows.map(([source, n]) => (
                <tr key={source} className="border-b border-rule last:border-0">
                  <td className="px-4 py-3 font-medium capitalize">{source}</td>
                  <td className="px-4 py-3 tabular-nums">{n.members}</td>
                  <td className="px-4 py-3 tabular-nums">{n.listings}</td>
                  <td className="px-4 py-3 tabular-nums">{n.emails}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          The Dublin QR codes count as &ldquo;dublin&rdquo;, the Instagram link as &ldquo;instagram&rdquo; and links with ?utm_source=facebook as &ldquo;facebook&rdquo;.
        </p>
      </Section>

      <Section title="By plan">
        <div className="overflow-x-auto rounded-2xl border border-rule bg-card">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-rule">
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Everyone on it</th>
                <th className="px-4 py-3 font-medium">Estimated monthly</th>
              </tr>
            </thead>
            <tbody>
              {byPlan.map((p) => (
                <tr key={p.tier.id} className="border-b border-rule last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">
                    {p.tier.name} <span className="font-normal text-muted-foreground">£{p.tier.price}/month</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{p.active}</td>
                  <td className="px-4 py-3 tabular-nums">{p.total}</td>
                  <td className="px-4 py-3 tabular-nums">£{p.mrr.toLocaleString("en-GB")}</td>
                </tr>
              ))}
              <tr>
                <td className="px-4 py-3 text-muted-foreground">No plan yet</td>
                <td className="px-4 py-3">–</td>
                <td className="px-4 py-3 tabular-nums">{noPlan}</td>
                <td className="px-4 py-3">–</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Everyone"
        intro={query ? `${members.length} matching "${query}".` : "Newest first."}
        actions={
          <form action="/studio/members" className="flex gap-2" role="search">
            <label htmlFor="member-search" className="sr-only">
              Search members
            </label>
            <input id="member-search" name="q" defaultValue={query} placeholder="Name, email or city" className={cn(fieldClass, "w-56 py-2")} />
            <Button type="submit" size="sm" variant="outline" className="h-auto">
              Search
            </Button>
          </form>
        }
      >
        {members.length === 0 ? (
          <Empty>No one matches that search.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-rule bg-card">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-rule">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">City</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Access</th>
                </tr>
              </thead>
              <tbody>
                {members.map((u) => (
                  <tr key={u.id} className="border-b border-rule last:border-0 align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{u.name ?? "No name yet"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize">{u.plan ?? "–"}</span>
                      {u.isFounding && <Tag className="ml-2">Founding</Tag>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {isActive(u) ? <Tag tone="positive">Active</Tag> : <Tag>Not paying</Tag>}
                        {!u.onboardedAt && <Tag tone="warn">Not set up</Tag>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-2">{u.profile?.location ?? "–"}</td>
                    <td className="px-4 py-3 text-ink-2">{dateOnly(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      {u.role === "admin" ? (
                        <Tag tone="ink">Admin</Tag>
                      ) : (
                        <form action={makeAdminAction}>
                          <input type="hidden" name="id" value={u.id} />
                          <input type="hidden" name="q" value={query} />
                          <Button type="submit" size="xs" variant="outline">
                            Make admin…
                          </Button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
