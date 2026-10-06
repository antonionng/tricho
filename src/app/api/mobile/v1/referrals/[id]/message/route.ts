import { fail, formData, json, withMember } from "@/lib/mobile/api";
import { captureRedirect } from "@/lib/mobile/form-action";
import { idAfter } from "@/lib/mobile/redirect-outcome";
import { prisma } from "@/lib/prisma";
import { startConversation } from "@/app/members/people/actions";

/** Opens (or starts) the conversation with the other member on a referral, and answers its id. */
export const POST = withMember<{ id: string }>(
  async (_req, ctx, { id }) => {
    const me = ctx.session.user.id;
    const referral = await prisma.referral.findUnique({ where: { id: id.slice(0, 64) }, select: { fromId: true, toId: true } });
    if (!referral || (referral.fromId !== me && referral.toId !== me)) return fail(404, "We could not find this referral.");
    const otherId = referral.fromId === me ? referral.toId : referral.fromId;
    const { redirect } = await captureRedirect(() => startConversation(formData({ userId: otherId })));
    const conversationId = idAfter(redirect, "/members/messages/");
    if (!conversationId) return fail(400, "We could not open the conversation. Please try again.");
    return json({ ok: true, conversationId, redirect });
  },
  { members: true }
);
