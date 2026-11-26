import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isBot, utcDay } from "@/lib/partner-stats";

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
