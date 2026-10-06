import { fail, json, withMember } from "@/lib/mobile/api";
import { participationRefusal } from "@/lib/community-rules";
import { toggleCommentUseful } from "@/app/members/community/actions";
import { prisma } from "@/lib/prisma";

/** Marks a reply useful, or takes the mark back. Answers the new count and state. */
export const POST = withMember<{ commentId: string }>(async (_req, ctx, { commentId }) => {
  if (ctx.restricted) return fail(403, participationRefusal(ctx.restricted));
  await toggleCommentUseful(commentId);
  const userId = ctx.session.user.id;
  const [useful, mine] = await Promise.all([
    prisma.commentReaction.count({ where: { commentId } }),
    prisma.commentReaction.findUnique({ where: { commentId_userId: { commentId, userId } }, select: { id: true } }),
  ]);
  return json({ ok: true, useful, reacted: !!mine });
}, { members: true });
