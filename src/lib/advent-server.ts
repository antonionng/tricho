import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isBot, utcDay } from "@/lib/partner-stats";
import { ADVENT_DAYS } from "@/content/advent";
import { doorDate, openDoorCount, publicDoors, type AdventLive } from "@/lib/advent";

export type AdventStatField = "opens" | "claims" | "clicks";

/**
 * Adds one to today's count for a door. Bots and the Trichollective team are not
 * counted, and it never throws: tracking must not break the page.
 */
export async function recordAdventStat(door: number, field: AdventStatField, userAgent: string | null) {
  try {
    if (isBot(userAgent)) return;
    const session = await auth().catch(() => null);
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { staffRole: true } }).catch(() => null);
      if (user?.staffRole) return;
    }
    const day = utcDay();
    await prisma.adventStat.upsert({
      where: { door_day: { door, day } },
      create: { door, day, [field]: 1 },
      update: { [field]: { increment: 1 } },
    });
  } catch (err) {
    console.error("[advent] tracking failed", err);
  }
}

/** The doors this person has already claimed. */
export async function claimedDoors(userId: string | null | undefined) {
  if (!userId) return [];
  const rows = await prisma.adventClaim.findMany({ where: { userId }, select: { door: true } }).catch(() => []);
  return rows.map((r) => r.door);
}

type Query = Record<string, string | string[] | undefined> | undefined;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * The calendar as this reader should see it. The team (and local development) can look
 * ahead with ?day=N to check a door before it opens.
 */
export async function adventLive(reader: { userId: string | null; isAdmin: boolean }, query: Query): Promise<AdventLive> {
  const canPreview = reader.isAdmin || process.env.NODE_ENV !== "production";
  const day = one(query?.day);
  const preview = canPreview && day ? Math.max(0, Math.min(ADVENT_DAYS, Number.parseInt(day, 10) || 0)) : null;
  const openCount = preview ?? openDoorCount();
  const initialDoor = Number.parseInt(one(query?.door), 10) || null;
  return {
    doors: publicDoors(openCount, await claimedDoors(reader.userId)),
    signedIn: !!reader.userId,
    // December is GMT, so midnight in the UK is midnight UTC.
    nextOpens: openCount >= ADVENT_DAYS ? null : `${doorDate(openCount + 1)}T00:00:00Z`,
    openCount,
    initialDoor,
    source: one(query?.utm_source).slice(0, 40) || (initialDoor ? "link" : "trichozette"),
    preview,
  };
}
