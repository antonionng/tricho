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

  const [users, recentJoins, confirmUser] = await Promise.all([
    prisma.user.findMany({
      where: notSystem,
      select: { plan: true, isFounding: true, stripeCurrentPeriodEnd: true },
    }),
    prisma.user.count({ where: { ...notSystem, createdAt: { gte: new Date(now.getTime() - 30 * DAY) } } }),
    confirm ? prisma.user.findUnique({ where: { id: confirm }, select: { id: true, name: true, email: true } }) : null,
  ]);

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
