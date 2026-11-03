import { prisma } from "@/lib/prisma";
import { audit, getStaff } from "@/lib/staff";
import { doorList } from "@/lib/checkin";
import { doorListPdf } from "@/lib/door-list-pdf";
import { eventTimeZone } from "@/lib/event-time";

export const dynamic = "force-dynamic";

/** The door list as a PDF to print before the event, for when the signal drops. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaff();
  if (!staff?.perms.has("events.checkin")) {
    return new Response("Your role does not include checking people in.", { status: 403 });
  }
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id }, select: { id: true, slug: true, title: true, startsAt: true, timezone: true } });
  if (!event) return new Response("That event could not be found.", { status: 404 });

  const people = await doorList(event.id);
  const tz = eventTimeZone(event.timezone);
  const fmt = (d: Date, withDay: boolean) =>
    new Intl.DateTimeFormat("en-GB", {
      ...(withDay ? { weekday: "long", day: "numeric", month: "long", year: "numeric" } : { day: "numeric", month: "short" }),
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: tz,
    }).format(d);
  const pdf = await doorListPdf({ title: event.title, when: fmt(event.startsAt, true), people, printedAt: fmt(new Date(), false) });

  await audit(staff, {
    action: "event.door_list_print",
    targetType: "event",
    targetId: event.id,
    summary: `Downloaded the printable door list of ${people.length} attendees for "${event.title}".`,
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="door-list-${event.slug.replace(/[^a-z0-9-]/gi, "")}.pdf"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
