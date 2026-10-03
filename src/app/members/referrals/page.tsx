import Link from "next/link";
import { redirect } from "next/navigation";
import { Pill } from "@/components/site/primitives";
import { Paywall } from "@/components/members/Paywall";
import { Avatar } from "@/components/members/Avatar";
import { EmptyState, MemberPage, PageHeader } from "@/components/members/MemberPage";
import { timeAgo } from "@/components/members/format";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { REFERRAL_STATUS_LABEL } from "@/lib/client-referrals";
import { cn } from "@/lib/utils";

export const metadata = { title: "Referrals" };

export default async function ReferralsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const ctx = await getMemberContext();
  const me = ctx.session?.user?.id;
  if (!me) redirect("/login?next=/members/referrals");
  if (!ctx.allowed) return <Paywall title="Referrals" body="Referring clients to colleagues is part of membership." />;
  const tab = (await searchParams).tab === "sent" ? "sent" : "received";

  const person = { select: { id: true, name: true, image: true } };
  const [rows, receivedCount, sentCount, waiting] = await Promise.all([
    prisma.referral.findMany({
      where: tab === "sent" ? { fromId: me } : { toId: me },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, status: true, reason: true, clientContext: true, createdAt: true, respondedAt: true, from: person, to: person },
    }),
    prisma.referral.count({ where: { toId: me } }),
    prisma.referral.count({ where: { fromId: me } }),
    prisma.referral.count({ where: { toId: me, status: "sent" } }),
  ]);

  const tabs = [
    { id: "received", label: waiting ? `Received (${waiting} new)` : `Received (${receivedCount})` },
    { id: "sent", label: `Sent (${sentCount})` },
  ];

  return (
    <MemberPage size="narrow">
      <PageHeader
        label="Referrals"
        title="Referrals"
        lede="Clients you and your colleagues have referred to each other. Each referral describes the concern without identifying the client, and the introduction happens once it is accepted."
      />

      <div className="mb-5 flex gap-1.5" role="tablist" aria-label="Referrals">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.id === "sent" ? "/members/referrals?tab=sent" : "/members/referrals"}
            role="tab"
            aria-selected={tab === t.id}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-colors",
              tab === t.id ? "border-ink bg-ink text-paper" : "border-rule bg-card text-ink-2 hover:border-ink/40"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={tab === "sent" ? "You have not referred a client yet." : "Nobody has referred a client to you yet."}
          body={
            ctx.professional
              ? "To refer a client, open a colleague's profile and choose Refer a client. They will be notified straight away and can reply to you in Messages."
              : "Professional members can refer clients to each other. Referrals sent to you will appear here, and you can accept or decline each one."
          }
          action={
            <Link href="/members/people" className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-paper">
              Find a colleague
            </Link>
          }
        />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-rule bg-card">
          {rows.map((r) => {
            const other = tab === "sent" ? r.to : r.from;
            const isNew = tab === "received" && r.status === "sent";
            return (
              <li key={r.id} className="border-b border-rule last:border-0">
                <Link href={`/members/referrals/${r.id}`} className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-paper-2">
                  <Avatar name={other.name} src={[other.image]} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={cn("truncate", isNew ? "font-semibold" : "font-medium")}>
                        {tab === "sent" ? `To ${other.name || "a member"}` : `From ${other.name || "a member"}`}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                      {r.reason || r.clientContext || "Open the referral to read the summary."}
                    </span>
                  </span>
                  <Pill tone={r.status === "accepted" ? "positive" : isNew ? "ink" : "default"}>{REFERRAL_STATUS_LABEL[r.status]}</Pill>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </MemberPage>
  );
}
