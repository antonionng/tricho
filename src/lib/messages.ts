import "server-only";
import { prisma } from "@/lib/prisma";
import { summarizeThread, type ThreadRow } from "@/lib/messages-format";

export { summarizeThread, type ThreadSummary } from "@/lib/messages-format";

/** The member's conversations, most recent first, with the last message and whether it is unread. */
export async function getInbox(me: string, take = 50) {
  const memberships: ThreadRow[] = await prisma.conversationMember.findMany({
    where: { userId: me },
    orderBy: { conversation: { updatedAt: "desc" } },
    take,
    select: {
      lastReadAt: true,
      conversation: {
        select: {
          id: true,
          updatedAt: true,
          members: { where: { userId: { not: me } }, select: { user: { select: { id: true, name: true, image: true } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true, senderId: true } },
        },
      },
    },
  });
  return memberships.map((row) => summarizeThread(row, me));
}

/** A conversation this member belongs to, with everyone in it, or null. */
export async function getConversation(id: string, me: string) {
  const convo = await prisma.conversation.findFirst({
    where: { id, members: { some: { userId: me } } },
    select: { id: true, members: { select: { userId: true, user: { select: { id: true, name: true, image: true } } } } },
  });
  if (!convo) return null;
  return { id: convo.id, members: convo.members, others: convo.members.filter((m) => m.userId !== me).map((m) => m.user) };
}

const messageSelect = { id: true, body: true, createdAt: true, senderId: true } as const;

/** The first messages of a conversation, oldest first, as the website shows them. */
export function conversationMessages(conversationId: string, take = 200) {
  return prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" }, take, select: messageSelect });
}

/**
 * A page of messages, newest first, for a chat list that loads older messages as
 * the member scrolls up. `cursor` is the id of the oldest message already shown.
 */
export async function messagePage(conversationId: string, { cursor, limit }: { cursor?: string; limit: number }) {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: messageSelect,
  });
  const more = rows.length > limit;
  const messages = more ? rows.slice(0, limit) : rows;
  return { messages, nextCursor: more ? messages[messages.length - 1].id : null };
}

/** Marks the conversation read up to now for this member. */
export function markConversationRead(conversationId: string, me: string) {
  return prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId: me } },
    data: { lastReadAt: new Date() },
  });
}
