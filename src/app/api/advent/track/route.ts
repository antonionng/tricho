import { adventDoor } from "@/content/advent";
import { liveDoorCount } from "@/lib/advent";
import { recordAdventStat } from "@/lib/advent-server";

/** Counts a door being opened on the calendar. Sent once per door per browser. */
export async function POST(req: Request) {
  if (req.headers.get("sec-fetch-site") === "cross-site") return new Response(null, { status: 204 });
  const body = (await req.json().catch(() => null)) as { door?: unknown } | null;
  const door = typeof body?.door === "number" ? adventDoor(body.door) : undefined;
  if (door && door.day <= liveDoorCount()) await recordAdventStat(door.day, "opens", req.headers.get("user-agent"));
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
