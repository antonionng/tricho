import { fail, json, withMember } from "@/lib/mobile/api";
import { participationRefusal } from "@/lib/community-rules";
import { toggleUseful } from "@/app/members/community/actions";
import { prisma } from "@/lib/prisma";

/** Marks a post useful, or takes the mark back. Answers the new count and state. */
export const POST = withMember<{ postId: string }>(async (_req, ctx, { postId }) => {
  if (ctx.restricted) return fail(403, participationRefusal(ctx.restricted));
  await toggleUseful(postId);
  const userId = ctx.session.user.id;
  const [useful, mine] = await Promise.all([
    prisma.reaction.count({ where: { postId } }),
    prisma.reaction.findUnique({ where: { postId_userId: { postId, userId } }, select: { id: true } }),
  ]);
  return json({ ok: true, useful, reacted: !!mine });
}, { members: true });
