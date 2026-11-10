import "server-only";
import type { Prisma, TvKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const tvCardSelect = {
  id: true,
  slug: true,
  kind: true,
  title: true,
  presenters: true,
  provider: true,
  videoId: true,
  durationMin: true,
  recordedAt: true,
  professionalOnly: true,
  podcastEpisodeId: true,
} satisfies Prisma.TvVideoSelect;

export type TvCardVideo = Prisma.TvVideoGetPayload<{ select: typeof tvCardSelect }>;

/** Published videos, newest first. Empty if the table isn't there yet, so member pages still render. */
export async function publishedTv(opts: { kind?: TvKind; take?: number; exceptId?: string } = {}): Promise<TvCardVideo[]> {
  return prisma.tvVideo
    .findMany({
      where: { published: true, ...(opts.kind ? { kind: opts.kind } : {}), ...(opts.exceptId ? { id: { not: opts.exceptId } } : {}) },
      orderBy: { recordedAt: "desc" },
      take: opts.take ?? 200,
      select: tvCardSelect,
    })
    .catch((error) => {
      console.error("[tv] couldn't load videos", error);
      return [];
    });
}

/** The TV video each community post shares, keyed by post, for live videos only. */
export async function tvForPosts(postIds: string[]): Promise<Map<string, TvCardVideo>> {
  const byPost = new Map<string, TvCardVideo>();
  if (postIds.length === 0) return byPost;
  const rows = await prisma.tvVideo
    .findMany({ where: { postId: { in: postIds }, published: true }, select: { ...tvCardSelect, postId: true } })
    .catch(() => []);
  for (const { postId, ...v } of rows) if (postId) byPost.set(postId, v);
  return byPost;
}

/** The published recording of each event, keyed by event, for the events pages. */
export async function recordingsForEvents(eventIds: string[]): Promise<Map<string, string>> {
  const byEvent = new Map<string, string>();
  if (eventIds.length === 0) return byEvent;
  const rows = await prisma.tvVideo
    .findMany({ where: { eventId: { in: eventIds }, published: true }, select: { eventId: true, slug: true } })
    .catch(() => []);
  for (const r of rows) if (r.eventId) byEvent.set(r.eventId, r.slug);
  return byEvent;
}
