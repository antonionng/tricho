/** Pure helpers for conversations, shared by the website and the app's API. */

type Person = { id: string; name: string | null; image: string | null };

export type ThreadRow = {
  lastReadAt: Date | null;
  conversation: {
    id: string;
    updatedAt: Date;
    members: { user: Person }[];
    messages: { body: string; createdAt: Date; senderId: string }[];
  };
};

export type ThreadSummary = {
  id: string;
  others: Person[];
  last: { body: string; createdAt: Date; senderId: string } | undefined;
  unread: boolean;
  at: Date;
};

/** A conversation is unread when its last message came from someone else after the member last read it. */
export function summarizeThread({ lastReadAt, conversation: c }: ThreadRow, me: string): ThreadSummary {
  const last = c.messages[0];
  const unread = !!last && last.senderId !== me && (!lastReadAt || last.createdAt > lastReadAt);
  return { id: c.id, others: c.members.map((m) => m.user), last, unread, at: last?.createdAt ?? c.updatedAt };
}

/** "Ana Ruiz, Ben Cole", or "Just you" when nobody else is in the conversation. */
export function threadTitle(others: { name: string | null }[]) {
  return others.map((o) => o.name || "Member").join(", ") || "Just you";
}

/** The inbox preview line: the last message, prefixed "You: " when the member sent it. */
export function threadPreview(last: { body: string; senderId: string } | undefined, me: string) {
  return last ? `${last.senderId === me ? "You: " : ""}${last.body}` : "No messages yet";
}
