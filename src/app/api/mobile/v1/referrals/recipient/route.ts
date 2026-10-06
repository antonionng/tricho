import { fail, json, withMember } from "@/lib/mobile/api";
import { referralBlocker, CONTEXT_MAX, NOTE_MAX, REASON_MAX, SUMMARY_MAX, SUMMARY_MIN } from "@/lib/client-referrals";
import { shortName } from "@/lib/names";
import { prisma } from "@/lib/prisma";
import { loadRecipient } from "@/app/members/referrals/_data";

/** Who a new referral would go to (?to=<userId>), and whether it can be sent, before the form is shown. */
export const GET = withMember(
  async (req, ctx) => {
    const to = (new URL(req.url).searchParams.get("to") ?? "").slice(0, 64);
    if (!to) return fail(400, "Choose a colleague to refer a client to.");
    const recipient = await loadRecipient(to);
    const blocker = referralBlocker({ id: ctx.session.user.id, professional: ctx.professional }, recipient);
    const image = recipient
      ? await prisma.user.findUnique({ where: { id: recipient.id }, select: { image: true } }).then((u) => u?.image ?? null)
      : null;
    return json({
      recipient: recipient ? { id: recipient.id, name: recipient.name, shortName: shortName(recipient.name, "your colleague"), image } : null,
      professional: ctx.professional,
      blocker: blocker ?? (recipient ? null : "We could not find this member."),
      limits: { summaryMin: SUMMARY_MIN, summaryMax: SUMMARY_MAX, reasonMax: REASON_MAX, contextMax: CONTEXT_MAX, noteMax: NOTE_MAX },
    });
  },
  { members: true }
);
