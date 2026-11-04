/**
 * Checking attendees in at the door. Each check-in is a single conditional
 * update, so two phones scanning the same ticket at once can never both
 * succeed: the second is told when the first one let them in.
 */

import { prisma } from "@/lib/prisma";
import { bySurname, type CheckInPerson, type CheckInResult } from "@/lib/checkin-list";

export type { CheckInPerson, CheckInResult };

const personSelect = {
  id: true,
  name: true,
  email: true,
  code: true,
  dietary: true,
  accessNeeds: true,
  checkedInAt: true,
  cancelledAt: true,
  eventId: true,
  event: { select: { title: true } },
  ticket: { select: { status: true, ticketType: { select: { name: true } } } },
} as const;

type Row = {
  id: string;
  name: string;
  email: string;
  code: string;
  dietary: string | null;
  accessNeeds: string | null;
  checkedInAt: Date | null;
  ticket: { ticketType: { name: string } | null };
};

export function toPerson(a: Row): CheckInPerson {
  return {
    id: a.id,
    name: a.name,
    email: a.email,
    code: a.code,
    ticketType: a.ticket.ticketType?.name ?? null,
    dietary: a.dietary,
    accessNeeds: a.accessNeeds,
    checkedInAt: a.checkedInAt?.toISOString() ?? null,
  };
}

/** Check someone in by their ticket code (from a scan) or their id (from the list). */
export async function checkIn(eventId: string, key: { code?: string; id?: string }, staffUserId: string): Promise<CheckInResult> {
  const where = key.code ? { code: key.code } : key.id ? { id: key.id } : null;
  if (!where) return { status: "not_found" };

  const now = new Date();
  const claimed = await prisma.eventAttendee.updateMany({
    where: { ...where, eventId, checkedInAt: null, cancelledAt: null, ticket: { status: "paid" } },
    data: { checkedInAt: now, checkedInById: staffUserId },
  });

  const a = await prisma.eventAttendee.findFirst({ where, select: personSelect });
  if (!a) return { status: "not_found" };
  if (a.eventId !== eventId) return { status: "other_event", eventTitle: a.event.title };
  const person = toPerson(a);
  if (claimed.count === 1) return { status: "checked_in", person };
  if (a.cancelledAt || a.ticket.status === "refunded") return { status: "cancelled", person };
  if (a.ticket.status !== "paid") return { status: "unpaid", person };
  return { status: "already", person, at: a.checkedInAt!.toISOString() };
}

/** Undo a check-in, for a wrong tap or someone who has to leave and come back. */
export async function undoCheckIn(eventId: string, id: string) {
  const r = await prisma.eventAttendee.updateMany({
    where: { id, eventId, checkedInAt: { not: null } },
    data: { checkedInAt: null, checkedInById: null },
  });
  return r.count === 1;
}

/** Everyone who can be let in, for the preloaded list on the check-in page and the printed backup. */
export async function doorList(eventId: string): Promise<CheckInPerson[]> {
  const rows = await prisma.eventAttendee.findMany({
    where: { eventId, cancelledAt: null, ticket: { status: "paid" } },
    select: personSelect,
  });
  return rows.map(toPerson).sort(bySurname);
}
