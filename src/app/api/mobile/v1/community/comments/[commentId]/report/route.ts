import { body, formData, runAction, withMember } from "@/lib/mobile/api";
import { reportComment } from "@/app/members/community/actions";

/** Reports a reply to the team in confidence: { reason, detail? }. */
export const POST = withMember<{ commentId: string }>(async (req, _ctx, { commentId }) => {
  const b = await body<{ reason: string; detail: string }>(req);
  return runAction(() => reportComment(null, formData({ commentId, reason: b.reason, detail: b.detail })));
}, { members: true });
