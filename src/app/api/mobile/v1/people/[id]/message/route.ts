import { formData, runAction, withMember } from "@/lib/mobile/api";
import { startConversation } from "@/app/members/people/actions";

/** Opens the one-to-one conversation with this member, starting it if needed. Answers { ok, redirect: "/members/messages/<id>" }. */
export const POST = withMember<{ id: string }>(
  async (_req, _ctx, { id }) => runAction(() => startConversation(formData({ userId: id }))),
  { members: true }
);
