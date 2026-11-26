import { adventDoor } from "@/content/advent";
import { liveDoorCount } from "@/lib/advent";
import { recordAdventStat } from "@/lib/advent-server";

/** The tracked button on each door: counts the click, then sends the visitor on. */
export async function GET(req: Request, { params }: { params: Promise<{ door: string }> }) {
  const { door: raw } = await params;
  const url = new URL(req.url);
  const door = adventDoor(Number.parseInt(raw, 10));
  if (!door || door.day > liveDoorCount()) return Response.redirect(new URL("/christmas", url), 302);

  const purpose = `${req.headers.get("sec-purpose") ?? ""} ${req.headers.get("purpose") ?? ""}`;
  if (!/prefetch|prerender/i.test(purpose)) await recordAdventStat(door.day, "clicks", req.headers.get("user-agent"));

  const external = /^https?:/.test(door.cta.href);
  return new Response(null, {
    status: 302,
    headers: {
      Location: external ? door.cta.href : new URL(door.cta.href, url).toString(),
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "origin",
    },
  });
}
