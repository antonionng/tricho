import { NextResponse } from "next/server";
import { todaysDoor } from "@/lib/advent";
import { sendAdventDoor } from "@/lib/advent-send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Each morning from 12 to 23 December, emails that day's door to every account and
 * subscriber. It only sends when ADVENT_EMAILS is "on", so nothing goes out until
 * the calendar has been checked and the switch is set in Vercel. Each address is
 * sent each door at most once, so a second run the same day sends nothing new.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const door = todaysDoor();
  if (!door) return NextResponse.json({ skipped: "The calendar is not running today." });
  if (process.env.ADVENT_EMAILS !== "on") return NextResponse.json({ skipped: "ADVENT_EMAILS is not on.", door: door.day });

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.trichollective.net").replace(/\/$/, "");
  try {
    const result = await sendAdventDoor(door, siteUrl);
    return NextResponse.json({ door: door.day, ...result });
  } catch (error) {
    console.error("[cron/advent] failed", error);
    return NextResponse.json({ error: "Sending failed." }, { status: 500 });
  }
}
