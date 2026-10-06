import { fail, json, withMember } from "@/lib/mobile/api";
import { getConversation, markConversationRead } from "@/lib/messages";

/** Marks the conversation read up to now. */
export const POST = withMember<{ id: string }>(
  async (_req, ctx, { id }) => {
    const me = ctx.session.user.id;
    if (!(await getConversation(id, me))) return fail(404, "That conversation could not be found.");
    await markConversationRead(id, me);
    return json({ ok: true });
  },
  { members: true }
);
