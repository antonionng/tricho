import { prisma } from "@/lib/prisma";
import { csvRow } from "@/lib/csv";
import { audit, getStaff } from "@/lib/staff";
import { loadAttendees } from "@/lib/tickets";

export const dynamic = "force-dynamic";

/** The attendees of one event as a spreadsheet: paid tickets and saved places. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaff();
  if (!staff?.perms.has("events.edit")) {
    return new Response("Your role does not include downloading attendee lists.", { status: 403 });
  }
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id }, select: { id: true, slug: true, title: true } });
  if (!event) return new Response("That event could not be found.", { status: 404 });

  const rows = await loadAttendees(event.id);
  await audit(staff, {
    action: "event.attendees_export",
    targetType: "event",
    targetId: event.id,
    summary: `Downloaded ${rows.length} attendees of "${event.title}" as a spreadsheet.`,
  });

  const lines = [
    csvRow(["name", "email", "type", "quantity", "status", "amount_gbp", "date"]),
    ...rows.map((a) =>
      csvRow([a.name, a.email, a.type, a.quantity, a.status, a.amount != null ? (a.amount / 100).toFixed(2) : "", a.at.toISOString()])
    ),
  ];
  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trichollective-attendees-${event.slug.replace(/[^a-z0-9-]/gi, "")}.csv"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
