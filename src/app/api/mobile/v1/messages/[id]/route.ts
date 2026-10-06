import { body, fail, formData, json, page, runAction, withMember } from "@/lib/mobile/api";
import { getConversation, markConversationRead, messagePage } from "@/lib/messages";
import { sendMessage } from "@/app/members/messages/actions";

/**
 * A conversation and a page of its messages, newest first. Pass ?cursor=<oldest
 * message id> for earlier messages. Loading the first page marks it read, as
 * opening the thread does on the website.
 */
export const GET = withMember<{ id: string }>(
  async (req, ctx, { id }) => {
    const me = ctx.session.user.id;
    const convo = await getConversation(id, me);
    if (!convo) return fail(404, "That conversation could not be found.");
    const { cursor, limit } = page(req, 30);
    const { messages, nextCursor } = await messagePage(id, { cursor, limit });
    if (!cursor) await markConversationRead(id, me);
    return json({
      conversation: { id: convo.id, others: convo.others },
      messages: messages.map((m) => ({ ...m, mine: m.senderId === me })),
      nextCursor,
    });
  },
  { members: true }
);

/** Sends { body } to the conversation. */
export const POST = withMember<{ id: string }>(
  async (req, _ctx, { id }) => {
    const { body: text } = await body<{ body: string }>(req);
    return runAction(() => sendMessage(null, formData({ conversationId: id, body: text })));
  },
  { members: true }
);
