export type Person = { id: string; name: string | null; image: string | null };

export type Thread = {
  id: string;
  others: Person[];
  last: { body: string; createdAt: string; senderId: string; mine: boolean } | null;
  unread: boolean;
  at: string;
};

export type Message = { id: string; body: string; createdAt: string; senderId: string; mine: boolean };

export type ThreadPage = {
  conversation: { id: string; others: Person[] };
  messages: Message[];
  nextCursor: string | null;
};

/** What the server answers when it opens a conversation: the website path to follow. */
export type OpenConversation = { ok: boolean; redirect?: string; error?: string };
