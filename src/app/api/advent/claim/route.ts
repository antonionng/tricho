import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { adventDoor } from "@/content/advent";
import { claimReveal, isClaimable, liveDoorCount } from "@/lib/advent";
import { recordAdventStat } from "@/lib/advent-server";
import { deliver } from "@/lib/mail/send";
import { adventClaimEmail } from "@/lib/mail/templates/advent";

export const runtime = "nodejs";

/**
 * Claims a gift: records who claimed which door, returns the code and how to
 * redeem it, and emails them a copy the first time. Signed-in accounts only.
 */
export async function POST(req: Request) {
  if (req.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const session = await auth();
  const userId = session?.user?.id;
  const email = session?.user?.email?.toLowerCase();
  if (!userId || !email) return NextResponse.json({ error: "sign-in" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { door?: unknown; source?: unknown } | null;
  const door = typeof body?.door === "number" ? adventDoor(body.door) : undefined;
  if (!door || !isClaimable(door)) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, staffRole: true } });
  // Staff can claim ahead of time to check a door; everyone else waits for it to open.
  if (door.day > liveDoorCount() && !user?.staffRole) return NextResponse.json({ error: "not-open" }, { status: 403 });

  const source = typeof body?.source === "string" ? body.source.slice(0, 40) : null;
  let first = false;
  try {
    await prisma.adventClaim.create({ data: { userId, email, door: door.day, source } });
    first = true;
  } catch {
    // Already claimed: show the code again without counting or emailing twice.
  }

  if (first) {
    await recordAdventStat(door.day, "claims", req.headers.get("user-agent"));
    const mail = adventClaimEmail({ name: user?.name ?? null, door });
    const sent = await deliver(email, mail.subject, mail.content, { tag: "advent-claim" });
    if (sent) await prisma.adventClaim.updateMany({ where: { userId, door: door.day }, data: { emailedAt: new Date() } }).catch(() => {});
  }

  return NextResponse.json({ ...claimReveal(door), first }, { headers: { "Cache-Control": "no-store" } });
}
