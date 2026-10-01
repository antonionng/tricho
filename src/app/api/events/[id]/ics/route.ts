import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/mail/layout";
import { buildIcs } from "@/lib/mail/ics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** "Add to calendar": a one-event .ics file for a published event. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findFirst({
    where: { OR: [{ id }, { slug: id }], published: true },
    select: { id: true, slug: true, title: true, summary: true, startsAt: true, endsAt: true, online: true, venue: true, city: true },
  });
  if (!event) return new Response("That event could not be found.", { status: 404 });

  const ics = buildIcs({ ...event, url: absoluteUrl(`/events/${event.slug}`) });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug.replace(/[^a-z0-9-]/gi, "")}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
