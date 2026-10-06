import { body, formData, runAction, withMember } from "@/lib/mobile/api";
import { reportPost } from "@/app/members/community/actions";

/** Reports a post to the team in confidence: { reason, detail? }. */
export const POST = withMember<{ postId: string }>(async (req, _ctx, { postId }) => {
  const b = await body<{ reason: string; detail: string }>(req);
  return runAction(() => reportPost(null, formData({ postId, reason: b.reason, detail: b.detail })));
}, { members: true });
