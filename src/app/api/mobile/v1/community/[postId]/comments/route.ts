import { body, formData, runAction, withMember } from "@/lib/mobile/api";
import { createComment } from "@/app/members/community/actions";

/** Replies to a thread: { content, parentId? }. A reply to a reply joins the comment it belongs under. */
export const POST = withMember<{ postId: string }>(async (req, _ctx, { postId }) => {
  const b = await body<{ content: string; parentId: string }>(req);
  return runAction(() => createComment(null, formData({ postId, content: b.content, parentId: b.parentId })));
}, { members: true });
