import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  canPostInRoom,
  canReadRoom,
  normalizeSpace,
  ROOMS,
  type ProfessionId,
  type RoomId,
} from "@/config/rooms";

/** Older builds stored these space names. They still resolve through normalizeSpace. */
const LEGACY_SPACES = ["everyone", "consultation", "cosmetic", "clinical", "medical"];

/** Every raw `space` value that resolves to one of these rooms. */
export function rawSpacesFor(rooms: RoomId[]) {
  const wanted = new Set<string>(rooms);
  return [...rooms, ...LEGACY_SPACES.filter((s) => wanted.has(normalizeSpace(s)))];
}

/** Rooms this member can read, in display order. */
export function readableRooms(professional: boolean) {
  return ROOMS.filter((r) => canReadRoom(r.id, professional));
}

/** Raw space values a member may NOT read (so unknown spaces still land in the Lounge). */
export function hiddenRawSpaces(professional: boolean) {
  const hidden = ROOMS.filter((r) => !canReadRoom(r.id, professional)).map((r) => r.id);
  return hidden.length ? rawSpacesFor(hidden) : [];
}

/** The spaces a discipline is most likely to care about, for light personalisation. */
export const DISCIPLINE_SPACES: Record<ProfessionId, RoomId[]> = {
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
        isFounding: true,
        profile: { select: { profession: true } },
      },
    },
    chapter: { select: { slug: true, city: true } },
    _count: { select: { comments: true, reactions: true } },
    reactions: userId ? { where: { userId }, select: { id: true } } : false,
  }) satisfies Prisma.CommunityPostInclude;

type RawPost = Prisma.CommunityPostGetPayload<{ include: ReturnType<typeof postInclude> }>;

export type FeedPost = {
  id: string;
  title: string | null;
  content: string;
  space: RoomId;
  pinned: boolean;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    isFounding: boolean;
    profession: ProfessionId | null;
  };
  chapterId: string | null;
  chapter: { slug: string; city: string } | null;
  comments: number;
  useful: number;
  reacted: boolean;
};

function toFeedPost(p: RawPost): FeedPost {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    space: normalizeSpace(p.space),
    pinned: p.pinned,
    createdAt: p.createdAt,
    author: {
      id: p.author.id,
      name: p.author.name,
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
  const where: Prisma.CommunityPostWhereInput = {};
  if (space) {
    if (!canReadRoom(space, professional)) return [];
    where.space = { in: rawSpacesFor([space]) };
  } else {
    const hidden = hiddenRawSpaces(professional);
    if (hidden.length) where.space = { notIn: hidden };
  }
  if (chapterId) where.chapterId = chapterId;
  if (authorId) where.authorId = authorId;

  const posts = await prisma.communityPost.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take,
    include: postInclude(userId),
  });
  return posts.map(toFeedPost);
}

/**
 * The Today feed: pinned first, then recent posts, nudged towards the member's
 * chapter and the spaces their discipline tends to use.
 */
export async function getTodayFeed({
  userId,
  professional,
  chapterId,
  profession,
  take = 20,
}: {
  userId: string;
  professional: boolean;
  chapterId: string | null;
  profession: ProfessionId | null;
  take?: number;
}) {
  const posts = await getPosts({ userId, professional, take: 60 });
  const favoured = new Set<RoomId>(profession ? DISCIPLINE_SPACES[profession] : []);
  const now = Date.now();
  // Lower is better: age in hours, less a head start for local and relevant posts.
  const score = (p: FeedPost) => {
    const hours = (now - p.createdAt.getTime()) / 36e5;
    const local = chapterId && p.chapterId === chapterId ? 30 : 0;
    const relevant = favoured.has(p.space) ? 18 : 0;
    return hours - local - relevant;
  };

  return posts
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => Number(b.p.pinned) - Number(a.p.pinned) || a.s - b.s)
    .slice(0, take)
    .map(({ p }) => p);
}

/** Only members with an active membership, or who have finished onboarding. */
export function memberDirectoryWhere(): Prisma.UserWhereInput {
  return {
    OR: [{ onboardedAt: { not: null } }, { stripeCurrentPeriodEnd: { gt: new Date() } }],
  };
}

export function firstName(name?: string | null) {
  return (name || "").trim().split(/\s+/)[0] || "";
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

/** Rooms a member may post in, shaped for the Composer. */
export function postableRooms(ctx: {
  professional: boolean;
  profession: ProfessionId | null;
  unlocked: boolean;
}) {
  return ROOMS.filter((r) => canReadRoom(r.id, ctx.professional) && canPostInRoom(r.id, ctx)).map((r) => ({
    id: r.id,
    label: r.label,
    prompt: r.prompt,
  }));
}
