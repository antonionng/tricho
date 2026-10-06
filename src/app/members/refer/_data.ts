import "server-only";
import { prisma } from "@/lib/prisma";
import type { MemberContext } from "@/lib/member";
import { ensureReferralCode, referralLink, shareMessage, sumByCurrency, SHARE_SUBJECT } from "@/lib/referrals";

/** The member's invitation code and link, and how each invitation is going. */
export async function loadReferrals(ctx: MemberContext, userId: string) {
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

  return { code, link, message, subject: SHARE_SUBJECT, rewards, stats, paying };
}
