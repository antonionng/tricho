import { prisma } from "@/lib/prisma";
import { parseRecordingUrl } from "@/lib/video-embed";

export { RECORDING_KIND_LABEL, liveSessionWhen, recordingDate, recordingImage } from "@/lib/recordings-format";

export type Recording = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  summary: string;
  startsAt: Date;
  presenters: string | null;
};

/**
 * Past, published events that have a recording we can play, newest first. The
 * recording link itself is deliberately left out: only the members' event page
 * ever renders it.
 */
export async function listRecordings(limit = 12): Promise<Recording[]> {
  try {
    const rows = await prisma.event.findMany({
      where: { published: true, recordingUrl: { not: null }, startsAt: { lt: new Date() } },
      orderBy: { startsAt: "desc" },
      take: limit * 2,
      select: { id: true, slug: true, title: true, kind: true, summary: true, startsAt: true, presenters: true, recordingUrl: true },
    });
    return rows
      .filter((r) => r.recordingUrl && parseRecordingUrl(r.recordingUrl))
      .slice(0, limit)
      .map((r) => ({ id: r.id, slug: r.slug, title: r.title, kind: r.kind, summary: r.summary, startsAt: r.startsAt, presenters: r.presenters }));
  } catch {
    return [];
  }
}

export type LiveSession = { slug: string; title: string; kind: string; summary: string; startsAt: Date; presenters: string | null };

/** The next online masterclass or case round that members can join, if one is scheduled. */
export async function nextLiveSession(): Promise<LiveSession | null> {
  try {
    return await prisma.event.findFirst({
      where: { published: true, startsAt: { gte: new Date() }, kind: { in: ["masterclass", "case_round"] } },
      orderBy: { startsAt: "asc" },
      select: { slug: true, title: true, kind: true, summary: true, startsAt: true, presenters: true },
    });
  } catch {
    return null;
  }
}
