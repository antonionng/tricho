import { redirect } from "next/navigation";
import { Mail, MessageCircle } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Card, EmptyState, MemberPage, PageHeader, SectionLabel } from "@/components/members/MemberPage";
import { CopyLink } from "@/components/members/CopyLink";
import { shortDate } from "@/components/members/format";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { firstNameOf } from "@/lib/mail/templates/directory";
import {
  REWARD_STATUS_LABEL,
  SHARE_SUBJECT,
  ensureReferralCode,
  referralLink,
  shareMessage,
  sumByCurrency,
} from "@/lib/referrals";

export const metadata = { title: "Invite colleagues" };
export const dynamic = "force-dynamic";

export default async function ReferPage() {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/refer");
  const userId = ctx.session.user.id;

  const [code, rewards] = await Promise.all([
    ensureReferralCode(userId),
    prisma.referralReward.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, status: true, amount: true, currency: true, createdAt: true, creditedAt: true, referred: { select: { name: true } } },
    }),
  ]);

  const link = referralLink(code);
  const message = shareMessage(code);
  const mailto = `mailto:?${new URLSearchParams({ subject: SHARE_SUBJECT, body: message }).toString().replace(/\+/g, "%20")}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const live = rewards.filter((r) => r.status !== "void");
  const joined = live.filter((r) => r.status === "banked" || r.status === "credited");
  const credited = live.filter((r) => r.status === "credited");
  const banked = live.filter((r) => r.status === "banked");
  const paying = ctx.membership.isActive && !ctx.membership.via;

  const stats = [
    { label: "Signed up", value: String(live.length) },
    { label: "Now paying", value: String(joined.length) },
    { label: "Credited", value: sumByCurrency(credited) },
    {
      label: "Banked",
      value: `${banked.length} ${banked.length === 1 ? "month" : "months"}`,
    },
  ];

  return (
    <MemberPage size="narrow">
      <PageHeader
        label="Invite colleagues"
        title="Invite colleagues, and get a month free for each one who joins."
        lede="When a colleague joins Trichollective with your link, they pay half price for their first month and you get a month of your own membership free."
      />

      <Card className="p-5 sm:p-7">
        <SectionLabel>Your invitation link</SectionLabel>
        <p className="break-all font-mono text-[15px] text-ink">{link}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your code is <span className="font-mono text-ink">{code}</span>, which colleagues can also type in if they find it easier.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <CopyLink value={link} />
          <a
            href={mailto}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-rule px-4 text-sm font-medium text-ink hover:border-ink/40"
          >
            <Mail className="h-4 w-4" /> Share by email
          </a>
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-rule px-4 text-sm font-medium text-ink hover:border-ink/40"
          >
            <MessageCircle className="h-4 w-4" /> Share on WhatsApp
          </a>
        </div>
      </Card>

      <section className="mt-10">
        <SectionLabel>How it works</SectionLabel>
        <ol className="space-y-3 text-[15px] leading-relaxed text-ink-2">
          <li>1. Share your link with a hair or scalp professional who would value the community, the Case Room and recorded CPD.</li>
          <li>2. When they join with your link, half of one month&apos;s price comes off their first payment.</li>
          <li>
            3. Once their first payment clears, one month of your own membership is credited to your bill
            {paying ? ", and it comes off your next payment automatically." : ", and we keep it for you until you become a paying member."}
          </li>
        </ol>
        <p className="mt-3 text-sm text-muted-foreground">
          Rewards are bill credit rather than cash, and the full conditions are in the{" "}
          <a href="/terms#referral-rewards" className="text-ink underline underline-offset-4">
            terms of membership
          </a>
          .
        </p>
      </section>

      <section className="mt-10">
        <SectionLabel>Your invitations</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="display mt-2 text-2xl tabular-nums">{s.value}</p>
            </Card>
          ))}
        </div>

        <div className="mt-6">
          {rewards.length === 0 ? (
            <EmptyState
              title="Nobody has joined with your link yet."
              body="Colleagues who join with your link will appear here, with the progress of each reward."
            />
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-rule bg-card">
              {rewards.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 border-b border-rule px-4 py-3 last:border-0">
                  <span className="flex-1 text-[15px] text-ink">{firstNameOf(r.referred?.name, "A colleague")}</span>
                  <Pill tone={r.status === "credited" ? "positive" : r.status === "banked" ? "ink" : "default"}>
                    {REWARD_STATUS_LABEL[r.status]}
                  </Pill>
                  <span className="w-28 text-right text-sm text-muted-foreground">{shortDate(r.creditedAt ?? r.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </MemberPage>
  );
}
