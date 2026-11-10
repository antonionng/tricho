import { prisma } from "@/lib/prisma";
import { csvRow } from "@/lib/csv";
import { audit, getStaff } from "@/lib/staff";
import { loadAttendees } from "@/lib/tickets";

export const dynamic = "force-dynamic";

/**
 * The attendees of one event as a spreadsheet: paid tickets and saved places.
 * An order with named attendees has one row per person, with the order's
 * amount on its first row only so the column still adds up.
 */
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
    csvRow([
      "name",
      "email",
      "type",
      "quantity",
      "status",
      "amount_gbp",
      "date",
      "ticket_type",
      "attendee_name",
      "attendee_email",
      "dietary",
      "access_needs",
      "ticket_code",
      "attendee_status",
      "refunded_gbp",
      "checked_in_at",
    ]),
    ...rows.flatMap((a) => {
      const order = [a.name, a.email, a.type, a.quantity, a.status] as const;
      const amount = a.amount != null ? (a.amount / 100).toFixed(2) : "";
      if (!a.people.length) return [csvRow([...order, amount, a.at.toISOString(), a.ticketType])];
      return a.people.map((p, i) =>
        csvRow([
          ...order,
          i === 0 ? amount : "",
          a.at.toISOString(),
          a.ticketType,
          p.name,
          p.email,
          p.dietary,
          p.accessNeeds,
          p.code,
          p.cancelledAt || a.status === "Refunded" ? "Cancelled" : "Confirmed",
          p.refundedPence != null ? (p.refundedPence / 100).toFixed(2) : "",
          p.checkedInAt?.toISOString() ?? "",
        ])
      );
    }),
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
