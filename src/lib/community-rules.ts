import type { Restriction } from "@/lib/member";
import type { ProfessionId, Room } from "@/config/rooms";

/**
 * Pure community rules shared by the website and the mobile API. Nothing here
 * touches the database, so it can be unit tested.
 */

/** Suspended, closed and muted accounts can read but not take part, and they are told why. */
export function participationRefusal(restricted: Pick<Restriction, "status" | "until">) {
  const date = (d: Date) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "Europe/Dublin" }).format(d);
  if (restricted.status === "banned") return "This account has been closed, so you can no longer post, reply or react.";
  if (restricted.status === "suspended") {
    return restricted.until
      ? `Your account is paused until ${date(restricted.until)}, so you can't post, reply or react until then.`
      : "Your account is paused, so you can't post, reply or react until the team lifts the pause.";
  }
  return restricted.until
    ? `You can read the community, but posting, replying and reacting are paused for your account until ${date(restricted.until)}.`
    : "You can read the community, but posting, replying and reacting are paused for your account.";
}

/** Why a member who can read a room may not post in it. */
export function postingNotice(room: Pick<Room, "archived"> | undefined, profession: ProfessionId | null) {
  if (room?.archived) return "This space is archived. Its conversations stay here to read, and new posts belong in another space.";
  if (profession === "brand") return "This space is kept for practitioner discussion, so business accounts can read along but not post here.";
  return "You can read this space, but posting here is for Professional members.";
}

/** Why a member may read a thread but not reply to it. */
export function replyNotice(room: Pick<Room, "archived" | "label"> | undefined) {
  return room?.archived
    ? `You can read this thread. ${room.label} has been archived, so it no longer takes new replies.`
    : `You can read this thread. Replies in ${room?.label ?? "this space"} are open to Professional members.`;
}

/**
 * Replies hang under the comment they answer, one level deep. A reply whose
 * parent was hidden shows at the top level. Order is kept.
 */
export function nestComments<T extends { id: string; parentId: string | null }>(comments: T[]) {
  const visible = new Set(comments.map((c) => c.id));
  return comments
    .filter((c) => !c.parentId || !visible.has(c.parentId))
    .map((comment) => ({ comment, replies: comments.filter((c) => c.parentId === comment.id) }));
}

/** Splits a page fetched with one extra row into the items and the cursor for the next page. */
export function cursorPage<T extends { id: string }>(rows: T[], limit: number) {
  const items = rows.slice(0, limit);
  return { items, nextCursor: rows.length > limit ? (items[items.length - 1]?.id ?? null) : null };
}
