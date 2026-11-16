import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SYSTEM_USER_EMAIL } from "@/agents/publish";
import { ADVENT_MONTH, ADVENT_YEAR, openThrough, ukToday } from "@/content/gazette/advent";
import { deliverOnce, wantsList } from "@/lib/mail/send";
import { adventDoorEmail } from "@/lib/mail/templates/advent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** How many emails go out at once. */
const BATCH = 10;

/** Today's advent door, or 0 on any day that isn't 1 to 12 December 2026 in the UK. */
function adventDoorToday(now: Date) {
  const day = openThrough(now);
  const t = ukToday(now);
  if (day < 1 || day > 12) return 0;
  if (t.year !== ADVENT_YEAR || t.month !== ADVENT_MONTH || t.day !== day) return 0;
  return day;
}

/**
 * 7am UK, 1 to 12 December 2026: tells every account on the updates list that
 * the day's door is ready. Each person is sent each door at most once, however
 * often this runs. Vercel Cron calls it with "Authorization: Bearer $CRON_SECRET".
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const day = adventDoorToday(new Date());
  if (!day) return NextResponse.json({ sent: 0 });

  try {
    const users = await prisma.user.findMany({
      where: { email: { not: null, notIn: [SYSTEM_USER_EMAIL] } },
      select: { id: true, name: true, email: true },
    });
    const { subject } = adventDoorEmail({ name: null, day });
    let sent = 0;
    let skipped = 0;
    for (let i = 0; i < users.length; i += BATCH) {
      const results = await Promise.all(
        users.slice(i, i + BATCH).map(async (u) => {
          const to = u.email!;
          if (!(await wantsList(to, "updates"))) return "skipped" as const;
          const { content } = adventDoorEmail({ name: u.name, day });
          const ok = await deliverOnce(`advent:${ADVENT_YEAR}:${day}:${u.id}`, to, subject, content, {
            list: "updates",
            tag: "advent",
          });
          return ok ? ("sent" as const) : ("skipped" as const);
        })
      );
      const n = results.filter((r) => r === "sent").length;
      sent += n;
      skipped += results.length - n;
    }
    return NextResponse.json({ day, sent, skipped });
  } catch (error) {
    console.error("[cron/advent] failed", error);
    return NextResponse.json({ day, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
