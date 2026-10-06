import { fail, json, withMember } from "@/lib/mobile/api";
import { REFERRAL_STATUS_LABEL, statusSentence } from "@/lib/client-referrals";
import { shortName } from "@/lib/names";
import { openReferral } from "@/app/members/referrals/_data";

/** One referral, for the sender or the recipient. Opening it as the recipient marks it read. */
export const GET = withMember<{ id: string }>(
  async (_req, ctx, { id }) => {
    const opened = await openReferral(id.slice(0, 64), ctx.session.user.id);
    if (!opened) return fail(404, "We could not find this referral.");
    const { referral, isRecipient, other, canRespond } = opened;
    const otherShort = shortName(other.name, "your colleague");
    return json({
      id: referral.id,
      side: isRecipient ? "received" : "sent",
      status: referral.status,
      statusLabel: REFERRAL_STATUS_LABEL[referral.status],
      statusSentence: statusSentence(referral.status, otherShort, isRecipient ? "received" : "sent"),
      summary: referral.summary,
      reason: referral.reason,
      clientContext: referral.clientContext,
      responseNote: referral.responseNote,
      respondedAt: referral.respondedAt,
      createdAt: referral.createdAt,
      other: { ...other, shortName: otherShort },
      canRespond,
    });
  },
  { members: true }
);
