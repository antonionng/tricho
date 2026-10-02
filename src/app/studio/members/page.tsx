import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { subscriptionTiers } from "@/config/subscriptions";
import { SYSTEM_USER_EMAIL } from "@/agents/publish";
import { Button } from "@/components/ui/button";
import { Empty, NoAccess, Notice, PageHeader, Section, Stat, Tag, dateOnly, fieldClass } from "@/components/studio/ui";
import { searchMembers, parseMemberFilters, memberFilterQuery, accessState, ACCESS_LABEL } from "@/lib/members-admin";
import type { MemberFilters } from "@/lib/members-filter";
import { cn } from "@/lib/utils";
import { studioPage } from "../_lib/guard";
import { STAFF_ROLE_LABEL, type StaffRoleId } from "@/config/staff";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string; status?: string; cursor?: string; notice?: string; tone?: string }>;
}) {
  const staff = await studioPage("/studio/members", "members.view");
  if (!staff) return <NoAccess what="members" />;
  const sp = await searchParams;
  const { notice } = sp;
  const filters = parseMemberFilters(sp);
  const cursor = typeof sp.cursor === "string" ? sp.cursor.slice(0, 64) : undefined;
  const now = new Date();
  const notSystem: Prisma.UserWhereInput = { NOT: { email: SYSTEM_USER_EMAIL } };

  const [users, recentJoins, listingSources, subscriberSources] = await Promise.all([
    prisma.user.findMany({
      where: notSystem,
      select: { plan: true, isFounding: true, stripeCurrentPeriodEnd: true, signupSource: true },
    }),
    prisma.user.count({ where: { ...notSystem, createdAt: { gte: new Date(now.getTime() - 30 * DAY) } } }),
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

  const results = await searchMembers({ ...filters, cursor });
  const members = results.rows;
  const filtered = !!(filters.q || filters.plan || filters.status);
  return (
    <div className="space-y-10">
      <PageHeader title="Members" intro="Who has joined, which plan they're on, and roughly what that brings in each month." />

      {notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{notice}</Notice>}


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
        intro={
          filtered
            ? `${results.total} ${results.total === 1 ? "member matches" : "members match"} these filters.`
            : `${results.total} accounts, newest first.`
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <form action="/studio/members" className="flex gap-2" role="search">
              {filters.plan && <input type="hidden" name="plan" value={filters.plan} />}
              {filters.status && <input type="hidden" name="status" value={filters.status} />}
              <label htmlFor="member-search" className="sr-only">
                Search members
              </label>
              <input
                id="member-search"
                name="q"
                defaultValue={filters.q}
                placeholder="Name, email or city"
                className={cn(fieldClass, "w-56 py-2")}
              />
              <Button type="submit" size="sm" variant="outline" className="h-auto">
                Search
              </Button>
            </form>
            {staff.perms.has("members.export") && (
              <Button asChild size="sm" variant="outline" className="h-auto">
                <a href={`/studio/members/export${memberFilterQuery(filters)}`}>Download as a spreadsheet</a>
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-2">
          <Chips label="Plan" filters={filters} name="plan" options={PLAN_CHIPS} />
          <Chips label="Status" filters={filters} name="status" options={STATUS_CHIPS} />
        </div>

        {members.length === 0 ? (
          <Empty>No one matches these filters. Try a shorter search or clear a filter.</Empty>
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
                  <th className="px-4 py-3 font-medium">Team</th>
                </tr>
              </thead>
              <tbody>
                {members.map((u) => {
                  const comp = !!u.compPlan && (!u.compUntil || u.compUntil > now);
                  const access = accessState(u, now);
                  return (
                    <tr key={u.id} className="border-b border-rule last:border-0 align-top">
                      <td className="px-4 py-3">
                        <Link href={`/studio/members/${u.id}`} className="font-medium text-ink hover:underline">
                          {u.name ?? "No name yet"}
                        </Link>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="capitalize">{(comp ? u.compPlan : u.plan) ?? "–"}</span>
                          {comp && <Tag tone="ink">Complimentary</Tag>}
                          {u.isFounding && <Tag>Founding</Tag>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {isActive(u) || comp ? <Tag tone="positive">Active</Tag> : <Tag>Not paying</Tag>}
                          {access !== "active" && <Tag tone={access === "muted" ? "warn" : "danger"}>{ACCESS_LABEL[access]}</Tag>}
                          {!u.onboardedAt && <Tag tone="warn">Not set up</Tag>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-2">{u.profile?.location ?? "–"}</td>
                      <td className="px-4 py-3 text-ink-2">{dateOnly(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        {u.staffRole ? <Tag tone="ink">{STAFF_ROLE_LABEL[u.staffRole as StaffRoleId]}</Tag> : <span className="text-muted-foreground">–</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {(cursor || results.nextCursor) && (
          <div className="flex gap-3 text-sm">
            {cursor && (
              <Link href={`/studio/members${memberFilterQuery(filters)}`} className="underline underline-offset-4">
                Back to the newest
              </Link>
            )}
            {results.nextCursor && (
              <Link
                href={`/studio/members${memberFilterQuery(filters, { cursor: results.nextCursor })}`}
                className="underline underline-offset-4"
              >
                Show the next 50
              </Link>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}

const PLAN_CHIPS: { value: string; label: string }[] = [
  { value: "", label: "Any plan" },
  ...subscriptionTiers.map((t) => ({ value: t.id, label: t.name })),
  { value: "none", label: "No plan" },
];

const STATUS_CHIPS: { value: string; label: string }[] = [
  { value: "", label: "Anyone" },
  { value: "active", label: "Active" },
  { value: "lapsed", label: "Lapsed" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
  { value: "staff", label: "Team" },
];

function Chips({
  label,
  name,
  filters,
  options,
}: {
  label: string;
  name: "plan" | "status";
  filters: MemberFilters;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={label}>
      <span className="mr-1 w-14 text-xs text-muted-foreground">{label}</span>
      {options.map((o) => {
        const on = filters[name] === o.value;
        return (
          <Link
            key={o.value || "any"}
            href={`/studio/members${memberFilterQuery({ ...filters, [name]: o.value })}`}
            aria-current={on ? "true" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              on ? "border-ink bg-ink text-paper" : "border-rule bg-card text-ink-2 hover:border-ink"
            )}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
