import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { allEditions as staticEditions } from "./index";
import { isLive, mergeEditions, rowToEdition } from "./merge";
import type { Edition } from "./types";

/**
 * Every Trichozette edition readers can see: the built-in editions plus those
 * written and published in Studio. Server-only. Client components keep reading
 * the built-in list from "@/content/gazette", and receive Studio editions as props.
 *
 * Reads are cached per request. Pages that list editions are dynamic or are
 * revalidated by path when an edition is published in Studio.
 */
const loadMerged = cache(async () => {
  const now = new Date();
  let db: Edition[] = [];
  try {
    const rows = await prisma.gazetteEdition.findMany({
      where: {
        OR: [{ status: "published" }, { status: "scheduled", scheduledFor: { lte: now } }],
      },
      orderBy: { publishedAt: "desc" },
    });
    db = rows
      .filter((r) => isLive(r, now))
      .map((r) => rowToEdition(r))
      .filter((e): e is Edition => !!e);
  } catch (error) {
    // Without a database (or before the migration runs) the built-in editions still work.
    console.error("[gazette] couldn't read Studio editions, showing the built-in ones only", error);
  }
  return mergeEditions(staticEditions, db);
});

/** The monthly magazine, newest first. */
export async function getEditions() {
  return (await loadMerged()).editions;
}

/** The look-back editions, newest year first. */
export async function getArchive() {
  return (await loadMerged()).archive;
}

/** Everything readable, for lookups and the sitemap. */
export async function getAllEditions() {
  return (await loadMerged()).all;
}

export async function getEditionBySlug(slug: string) {
  return (await loadMerged()).all.find((e) => e.slug === slug);
}
