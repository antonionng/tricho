import { body, formData, json, runAction, withMember } from "@/lib/mobile/api";
import { getInbox } from "@/lib/messages";
import { startConversation } from "@/app/members/people/actions";

/** The member's conversations, most recent first, as on /members/messages. */
export const GET = withMember(
  async (_req, ctx) => {
    const me = ctx.session.user.id;
    const threads = await getInbox(me);
    return json({
      threads: threads.map((t) => ({
        id: t.id,
        others: t.others,
        last: t.last ? { ...t.last, mine: t.last.senderId === me } : null,
        unread: t.unread,
        at: t.at,
      })),
    });
  },
  { members: true }
);

/** Opens the one-to-one conversation with { userId }, starting it if needed. Answers { ok, redirect: "/members/messages/<id>" }. */
export const POST = withMember(
  async (req) => {
    const { userId } = await body<{ userId: string }>(req);
    return runAction(() => startConversation(formData({ userId })));
  },
  { members: true }
);
