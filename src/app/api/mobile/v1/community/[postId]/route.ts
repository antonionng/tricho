import { fail, json, withMember } from "@/lib/mobile/api";
import { getThread } from "@/lib/community";
import { participationRefusal, replyNotice } from "@/lib/community-rules";
import { author } from "../_shape";

/** A thread: the post, its replies (one level deep) and whether this member can reply. */
export const GET = withMember<{ postId: string }>(async (_req, ctx, { postId }) => {
  const me = ctx.session.user.id;
  const result = await getThread(postId, { userId: me, professional: ctx.professional, profession: ctx.profession, unlocked: ctx.unlocked });
  if (result.status === "missing") return fail(404, "This thread could not be found. It may have been removed.");
  if (result.status === "locked") {
    return fail(
      403,
      result.space === "case-room"
        ? "Anonymised case discussion in the Case Room is part of Professional membership."
        : `${result.room?.label ?? "This space"} is part of Professional membership.`,
      { locked: true }
    );
  }

  const { post, room, canReply, thread } = result;
  const comment = (c: (typeof post.comments)[number]) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    parentId: c.parentId,
    author: author(c.author),
    useful: c._count.reactions,
    reacted: c.reactions.length > 0,
    mine: c.author.id === me,
  });

  return json({
    post: {
      id: post.id,
      title: post.title,
      content: post.content,
      pinned: post.pinned,
      createdAt: post.createdAt,
      author: author(post.author),
      chapter: post.chapter,
      useful: post._count.reactions,
      reacted: post.reactions.length > 0,
      mine: post.author.id === me,
      comments: post.comments.length,
    },
    room: room ? { id: room.id, label: room.label } : null,
    thread: thread.map(({ comment: c, replies }) => ({ ...comment(c), replies: replies.map(comment) })),
    canReply: canReply && !ctx.restricted,
    replyNotice: ctx.restricted ? participationRefusal(ctx.restricted) : canReply ? null : replyNotice(room),
  });
}, { members: true });
