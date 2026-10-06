import { json, withMember } from "@/lib/mobile/api";
import { postableRooms } from "@/lib/community";
import { canReadRoom } from "@/config/rooms";
import { getRooms } from "@/lib/rooms";
import { prisma } from "@/lib/prisma";

/**
 * The rooms in display order, with whether this member can read and post in each,
 * and their chapter so a new post can also be shared there.
 */
export const GET = withMember(async (_req, ctx) => {
  const [rooms, postable, chapter] = await Promise.all([
    getRooms(),
    postableRooms(ctx),
    ctx.chapterId ? prisma.chapter.findUnique({ where: { id: ctx.chapterId }, select: { slug: true, city: true } }) : null,
  ]);
  const canPost = new Set(postable.map((r) => r.id));
  return json({
    rooms: rooms.map((r) => ({
      id: r.id,
      label: r.label,
      blurb: r.blurb,
      prompt: r.prompt,
      professionalOnly: !!r.professionalOnly,
      canRead: canReadRoom(r.id, ctx.professional, rooms),
      canPost: !ctx.restricted && canPost.has(r.id),
    })),
    chapter,
  });
}, { members: true });
