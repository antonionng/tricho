import Link from "next/link";
import type { RewardStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Card, Empty, NoAccess, Notice, PageHeader, Section, Stat, Tag, dateOnly, fieldClass } from "@/components/studio/ui";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { getStaff } from "@/lib/staff";
import { formatMoney } from "@/lib/mail/templates/billing";
import { sumByCurrency } from "@/lib/referrals";
import { studioPage } from "../_lib/guard";
import { creditRewardAction, voidRewardAction } from "./actions";

export const dynamic = "force-dynamic";

const FILTERS: { id: "" | RewardStatus; label: string }[] = [
  { id: "", label: "All rewards" },
  { id: "pending", label: "Waiting for a first payment" },
  { id: "banked", label: "Banked" },
  { id: "credited", label: "Credited" },
  { id: "void", label: "Withdrawn" },
];

const STATUS: Record<RewardStatus, { label: string; tone: "default" | "ink" | "positive" | "warn" | "danger" }> = {
  pending: { label: "Waiting for first payment", tone: "default" },
  banked: { label: "Banked", tone: "warn" },
  credited: { label: "Credited", tone: "positive" },
  void: { label: "Withdrawn", tone: "danger" },
};

type Search = { status?: string; notice?: string; tone?: string };

export default async function ReferralsStudioPage({ searchParams }: { searchParams: Promise<Search> }) {
  if (!(await studioPage("/studio/referrals", "referrals.view"))) return <NoAccess what="referrals" />;
  const sp = await searchParams;
  const staff = await getStaff();
  const canManage = !!staff?.perms.has("referrals.manage");
  const status = FILTERS.some((f) => f.id === sp.status) ? (sp.status as RewardStatus | "") : "";

  const [all, rewards, leaders] = await Promise.all([
    prisma.referralReward.findMany({ select: { status: true, amount: true, currency: true } }),
    prisma.referralReward.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        referrer: { select: { id: true, name: true, email: true } },
        referred: { select: { id: true, name: true } },
      },
    }),
    prisma.referralReward.groupBy({
      by: ["referrerId"],
      where: { status: { in: ["banked", "credited"] } },
      _count: { _all: true },
      orderBy: { _count: { referrerId: "desc" } },
      take: 10,
    }),
  ]);

  const leaderUsers = await prisma.user.findMany({
    where: { id: { in: leaders.map((l) => l.referrerId) } },
    select: { id: true, name: true, email: true, referralCode: true },
  });
  const leaderRows = leaders.map((l) => ({ ...l, user: leaderUsers.find((u) => u.id === l.referrerId) }));

  const live = all.filter((r) => r.status !== "void");
  const credited = all.filter((r) => r.status === "credited");
  const banked = all.filter((r) => r.status === "banked");
  const pending = all.filter((r) => r.status === "pending");
  const converted = credited.length + banked.length;
  const conversion = live.length ? Math.round((converted / live.length) * 100) : 0;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Referrals"
        intro="Members invite colleagues with a personal code. The new member pays half price for their first month, and the person who invited them gets a month free as credit on their bill once that first payment clears."
      />

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Credited to bills" value={sumByCurrency(credited)} note={`${credited.length} ${credited.length === 1 ? "reward" : "rewards"} taken off members' bills through Stripe.`} />
        <Stat label="Banked" value={banked.length} note={banked.some((r) => r.amount > 0) ? `Worth about ${sumByCurrency(banked)}, credited automatically when the member starts paying.` : "Credited automatically when the member starts paying."} />
        <Stat label="Waiting for a first payment" value={pending.length} note="New members who joined with a code and have not yet paid." />
        <Stat label="Conversion" value={`${conversion}%`} note={`${converted} of ${live.length} sign-ups with a code became paying members.`} />
      </div>

      <Section title="Top referrers" intro="Members whose invitations brought in the most paying members.">
        {leaderRows.length === 0 ? (
          <Empty>No one has brought in a paying member yet.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-rule bg-card">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-rule">
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Paying members brought in</th>
                </tr>
              </thead>
              <tbody>
                {leaderRows.map((l) => (
                  <tr key={l.referrerId} className="border-b border-rule last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/studio/members/${l.referrerId}`} className="font-medium text-ink hover:underline">
                        {l.user?.name ?? l.user?.email ?? "Unknown member"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{l.user?.referralCode}</td>
                    <td className="px-4 py-3 tabular-nums">{l._count._all}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section
        title="Rewards"
        intro={canManage ? "Withdraw a reward that was misused or refunded, or credit a banked one by hand." : "Only owners can withdraw or credit rewards."}
      >
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.id || "all"}
              href={f.id ? `/studio/referrals?status=${f.id}` : "/studio/referrals"}
              className={`rounded-full px-3 py-1.5 text-sm ${f.id === status ? "bg-ink text-paper" : "bg-paper-2 text-ink-2"}`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {rewards.length === 0 ? (
          <Empty>There are no rewards with this status.</Empty>
        ) : (
          <div className="space-y-3">
            {rewards.map((r) => (
              <Card key={r.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 text-sm">
                    <p className="text-ink">
                      <Link href={`/studio/members/${r.referrer.id}`} className="font-medium hover:underline">
                        {r.referrer.name ?? r.referrer.email}
                      </Link>{" "}
                      invited{" "}
                      {r.referred ? (
                        <Link href={`/studio/members/${r.referred.id}`} className="font-medium hover:underline">
                          {r.referred.name ?? r.referredEmail}
                        </Link>
                      ) : (
                        <span className="font-medium">{r.referredEmail}</span>
                      )}
                      {r.plan ? ` to ${r.plan.charAt(0).toUpperCase()}${r.plan.slice(1)}` : ""}.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Code <span className="font-mono">{r.code}</span>, joined {dateOnly(r.createdAt)}
                      {r.creditedAt ? `, credited ${dateOnly(r.creditedAt)}` : ""}
                      {r.amount > 0 ? `, worth ${formatMoney(r.amount, r.currency)}` : ""}
                      {r.stripeBalanceTxnId ? `, Stripe ${r.stripeBalanceTxnId}` : ""}.
                    </p>
                    {r.note && <p className="text-xs text-ink-2">{r.note}</p>}
                  </div>
                  <Tag tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Tag>
                </div>

                {canManage && r.status !== "void" && (
                  <div className="flex flex-wrap items-end gap-2 border-t border-rule pt-3">
                    {r.status === "banked" && (
                      <form action={creditRewardAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="filter" value={status} />
                        <SubmitButton size="sm" pendingLabel="Crediting…">
                          Credit now
                        </SubmitButton>
                      </form>
                    )}
                    <form action={voidRewardAction} className="flex flex-1 flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="filter" value={status} />
                      <input
                        name="reason"
                        required
                        maxLength={300}
                        placeholder="Reason for withdrawing, e.g. refunded within 14 days"
                        className={`${fieldClass} min-w-56 flex-1 py-1.5`}
                      />
                      <SubmitButton size="sm" variant="outline" pendingLabel="Withdrawing…">
                        {r.status === "credited" ? "Withdraw and reverse credit" : "Withdraw"}
                      </SubmitButton>
                    </form>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
