import { body, json, page, runAction, formData, withMember } from "@/lib/mobile/api";
import { getPosts, postableRooms } from "@/lib/community";
import { cursorPage, participationRefusal, postingNotice } from "@/lib/community-rules";
import { canReadRoom, roomById } from "@/config/rooms";
import { getRooms } from "@/lib/rooms";
import { createPost } from "@/app/members/community/actions";

/**
 * The community feed, newest first with pinned posts on top. ?space=<room> narrows
 * it to one room; ?cursor=<last post id> fetches the next page.
 */
export const GET = withMember(async (req, ctx) => {
  const { cursor, limit, url } = page(req);
  const requested = url.searchParams.get("space");
  const rooms = await getRooms();
  const space = requested && rooms.some((r) => r.id === requested) ? requested : undefined;
  const room = space ? roomById(space, rooms) : undefined;
  const locked = space ? !canReadRoom(space, ctx.professional, rooms) : false;

  const [rows, postable] = await Promise.all([
    locked ? Promise.resolve([]) : getPosts({ userId: ctx.session.user.id, professional: ctx.professional, space, take: limit + 1, cursor }),
    postableRooms(ctx),
  ]);
  const { items, nextCursor } = cursorPage(rows, limit);

  const canPost = !ctx.restricted && (space ? postable.some((r) => r.id === space) : postable.length > 0);
  const notice = ctx.restricted
    ? participationRefusal(ctx.restricted)
    : canPost
      ? null
      : space
        ? postingNotice(room, ctx.profession)
        : "Posting here is for Professional members. You are welcome to read along.";

  return json({
    room: room ? { id: room.id, label: room.label, blurb: room.blurb, prompt: room.prompt } : null,
    locked: locked
      ? {
          title: `${room?.id === "case-room" ? "The Case Room" : (room?.label ?? "This space")} is for Professional members.`,
          body:
            room?.id === "case-room"
              ? "Qualified practitioners bring anonymised cases here and hear how colleagues from other disciplines would approach them. It is kept small and careful on purpose."
              : "Professional membership opens this space so you can learn alongside qualified colleagues from every discipline.",
        }
      : null,
    posting: { canPost, notice },
    posts: items,
    nextCursor,
  });
}, { members: true });

/** Starts a conversation: { space, title?, content, chapter? }. Answers { ok, id }. */
export const POST = withMember(async (req) => {
  const b = await body<{ space: string; title: string; content: string; chapter: boolean }>(req);
  return runAction(() =>
    createPost(null, formData({ space: b.space, title: b.title, content: b.content, chapter: b.chapter ? "on" : undefined }))
  );
}, { members: true });
