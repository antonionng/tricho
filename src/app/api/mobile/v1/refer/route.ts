import { json, withMember } from "@/lib/mobile/api";
import { REWARD_STATUS_LABEL } from "@/lib/referrals";
import { firstNameOf } from "@/lib/mail/templates/directory";
import { loadReferrals } from "@/app/members/refer/_data";

/** The member's invitation link and code, the message to share, and how each invitation is going. */
export const GET = withMember(async (_req, ctx) => {
  const { code, link, message, subject, rewards, stats, paying } = await loadReferrals(ctx, ctx.session.user.id);
  return json({
    code,
    link,
    message,
    subject,
    paying,
    stats,
    rewards: rewards.map((r) => ({
      id: r.id,
      name: firstNameOf(r.referred?.name, "A colleague"),
      status: r.status,
      statusLabel: REWARD_STATUS_LABEL[r.status],
      date: r.creditedAt ?? r.createdAt,
    })),
  });
});
