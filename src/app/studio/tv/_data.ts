import { prisma } from "@/lib/prisma";
import type { EpisodeChoice, EventChoice } from "./TvVideoForm";

/** Past masterclasses and case rounds come first, since they are the recordings most often added. */
export async function formChoices(): Promise<{ events: EventChoice[]; episodes: EpisodeChoice[] }> {
  const [events, episodes] = await Promise.all([
    prisma.event.findMany({
      where: { startsAt: { lt: new Date() } },
      orderBy: { startsAt: "desc" },
      take: 60,
      select: { id: true, title: true, kind: true, startsAt: true },
    }),
    prisma.podcastEpisode.findMany({
      orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
      take: 60,
      select: { id: true, title: true, number: true },
    }),
  ]);
  const taught = (k: string) => (k === "masterclass" || k === "case_round" ? 0 : 1);
  return { events: [...events].sort((a, b) => taught(a.kind) - taught(b.kind)), episodes };
}
