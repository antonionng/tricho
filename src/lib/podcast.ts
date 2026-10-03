import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { images, type BrandImage } from "@/content/images";

/** Published episodes, newest first. Empty if the database can't be reached, so public pages still render. */
export async function publishedEpisodes() {
  try {
    return await prisma.podcastEpisode.findMany({
      where: { status: "published" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
  } catch (error) {
    console.error("[podcast] couldn't load episodes", error);
    return [];
  }
}

/** One published episode by its web address, or null. */
export const publishedEpisode = cache(async (slug: string) =>
  prisma.podcastEpisode.findFirst({ where: { slug, status: "published" } })
);

export function episodeImage(key: string | null | undefined): BrandImage {
  return key && key in images ? images[key as keyof typeof images] : images.ed29;
}

/** 2723 -> "PT45M23S", for structured data. */
export function isoDuration(seconds: number | null | undefined) {
  if (!seconds) return undefined;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s || (!h && !m) ? `${s}S` : ""}`;
}
