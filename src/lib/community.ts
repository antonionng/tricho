import { shortName } from "@/lib/names";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  canPostInRoom,
  canReadRoom,
  LEGACY_SPACES,
  normalizeSpace,
  roomById,
  type ProfessionId,
  type Room,
  type RoomId,
  type KnownRoomId,
} from "@/config/rooms";
import { getAllRooms, getRooms } from "@/lib/rooms";

/** Every raw `space` value that resolves to one of these rooms. */
export function rawSpacesFor(roomIds: RoomId[]) {
  const wanted = new Set<string>(roomIds);
  return [...roomIds, ...Object.keys(LEGACY_SPACES).filter((s) => wanted.has(LEGACY_SPACES[s]))];
}

/** Rooms this member can read, in display order. */
export function readableRooms(professional: boolean, rooms: Room[]) {
  return rooms.filter((r) => canReadRoom(r.id, professional, rooms));
}

/**
 * Raw space values a member may NOT read (so unknown spaces still land in the Lounge).
 * Pass every room, archived ones included, so retired professional rooms stay private.
 */
export function hiddenRawSpaces(professional: boolean, allRooms: Room[]) {
  const hidden = allRooms.filter((r) => !canReadRoom(r.id, professional, allRooms)).map((r) => r.id);
  return hidden.length ? rawSpacesFor(hidden) : [];
}

/** Content the team has hidden stays out of every member-facing list. */
export const visiblePost = { hiddenAt: null } satisfies Prisma.CommunityPostWhereInput;
export const visibleComment = { hiddenAt: null } satisfies Prisma.CommentWhereInput;

/** The spaces a discipline is most likely to care about, for light personalisation. */
export const DISCIPLINE_SPACES: Record<ProfessionId, KnownRoomId[]> = {
  cosmetic: ["head-spa", "devices", "business"],
  clinical: ["hair-loss", "case-room"],
  medical: ["case-room", "hair-loss"],
  brand: ["business", "devices"],
};

const postInclude = (userId?: string) =>
  ({
    author: {
      select: {
        id: true,
        name: true,
        image: true,
        isFounding: true,
        profile: { select: { profession: true } },
      },
    },
    chapter: { select: { slug: true, city: true } },
    _count: { select: { comments: { where: { hiddenAt: null } }, reactions: true } },
    reactions: userId ? { where: { userId }, select: { id: true } } : false,
  }) satisfies Prisma.CommunityPostInclude;

type RawPost = Prisma.CommunityPostGetPayload<{ include: ReturnType<typeof postInclude> }>;

export type FeedPost = {
  id: string;
  title: string | null;
  content: string;
  space: RoomId;
  /** The room's name, resolved on the server so cards need no room list. */
  spaceLabel: string | null;
  pinned: boolean;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    isFounding: boolean;
    profession: ProfessionId | null;
  };
  chapterId: string | null;
  chapter: { slug: string; city: string } | null;
  comments: number;
  useful: number;
  reacted: boolean;
};

function toFeedPost(p: RawPost, allRooms: Room[]): FeedPost {
  const space = normalizeSpace(p.space, allRooms);
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    space,
    spaceLabel: roomById(space, allRooms)?.label ?? null,
    pinned: p.pinned,
    createdAt: p.createdAt,
    author: {
      id: p.author.id,
      name: p.author.name,
      image: p.author.image,
      isFounding: p.author.isFounding,
      profession: (p.author.profile?.profession as ProfessionId | null) ?? null,
    },
    chapterId: p.chapterId,
    chapter: p.chapter,
    comments: p._count.comments,
    useful: p._count.reactions,
    reacted: Array.isArray(p.reactions) ? p.reactions.length > 0 : false,
  };
}

export async function getPosts({
  userId,
  professional,
  space,
  chapterId,
  authorId,
  take = 30,
}: {
  userId?: string;
  professional: boolean;
  space?: RoomId;
  chapterId?: string;
  authorId?: string;
  take?: number;
}) {
  const allRooms = await getAllRooms();
  const where: Prisma.CommunityPostWhereInput = { ...visiblePost };
  if (space) {
    if (!canReadRoom(space, professional, allRooms)) return [];
    where.space = { in: rawSpacesFor([space]) };
  } else {
    const hidden = hiddenRawSpaces(professional, allRooms);
    if (hidden.length) where.space = { notIn: hidden };
  }
  if (chapterId) where.chapterId = chapterId;
  if (authorId) where.authorId = authorId;

  const posts = await prisma.communityPost.findMany({
    where,
    // Newest first. Pinned posts lead only inside their own space, so the main feeds always open on the latest.
    orderBy: space ? [{ pinned: "desc" }, { createdAt: "desc" }] : [{ createdAt: "desc" }],
    take,
    include: postInclude(userId),
  });
  return posts.map((p) => toFeedPost(p, allRooms));
}

/** The Today feed: every space the member can read, newest first. */
export async function getTodayFeed({
  userId,
  professional,
  take = 20,
}: {
  userId: string;
  professional: boolean;
  take?: number;
}) {
  return getPosts({ userId, professional, take });
}

/** Only members with an active membership, or who have finished onboarding. */
export function memberDirectoryWhere(): Prisma.UserWhereInput {
  return {
    OR: [{ onboardedAt: { not: null } }, { stripeCurrentPeriodEnd: { gt: new Date() } }],
  };
}

export function firstName(name?: string | null) {
  return shortName(name);
}

/** Creates a notification. Never throws: a failed notification must not break the action. */
export async function notify(data: {
  userId: string;
  kind: string;
  title: string;
  href?: string;
}) {
  try {
    await prisma.notification.create({ data });
  } catch (err) {
    console.error("[notify] failed", err);
  }
}

/**
 * Tells an author that someone found their post or comment useful. Unread notifications about the same
 * item are folded into one ("Sam and 2 others found…") so a popular post doesn't flood the bell.
 */
export async function notifyUseful(data: {
  userId: string;
  reactorName: string;
  /** All reactions on the item, including the new one. */
  count: number;
  what: "post" | "comment";
  about: string;
  href: string;
}) {
  const others = data.count - 1;
  const who = others > 0 ? `${data.reactorName} and ${others} ${others === 1 ? "other" : "others"}` : data.reactorName;
  const title = `${who} found your ${data.what} “${data.about}” useful`;
  try {
    const existing = await prisma.notification.findFirst({
      where: { userId: data.userId, kind: "useful", href: data.href, readAt: null },
      select: { id: true },
    });
    if (existing) {
      await prisma.notification.update({ where: { id: existing.id }, data: { title, createdAt: new Date() } });
    } else {
      await prisma.notification.create({ data: { userId: data.userId, kind: "useful", title, href: data.href } });
    }
  } catch (err) {
    console.error("[notifyUseful] failed", err);
  }
}

/** A short quote of a post or comment for notification titles. */
export function excerpt(text: string, max = 60) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? flat.slice(0, max).trimEnd() + "…" : flat;
}

/** Rooms a member may post in, shaped for the Composer. */
export async function postableRooms(ctx: {
  professional: boolean;
  profession: ProfessionId | null;
  unlocked: boolean;
}) {
  const rooms = await getRooms();
  return rooms.filter((r) => canReadRoom(r.id, ctx.professional, rooms) && canPostInRoom(r.id, ctx, rooms)).map((r) => ({
    id: r.id,
    label: r.label,
    prompt: r.prompt,
    blurb: r.blurb,
  }));
}
