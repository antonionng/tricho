import { randomBytes } from "node:crypto";

/**
 * Named attendees: one person per place on an in-person ticket. Pure helpers,
 * so checkout, the webhook, Studio and tests share the same rules.
 */

/** No 0/O or 1/I/L, so a code read aloud at the door is never ambiguous. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CODE_LENGTH = 16;

/** A random ticket code, about 79 bits: it is the only key to the ticket page. */
export function newAttendeeCode() {
  const bytes = randomBytes(CODE_LENGTH);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export { codeFromScan, ticketPath } from "@/lib/ticket-code";

export type AttendeeInput = {
  name: string;
  email: string;
  dietary: string | null;
  accessNeeds: string | null;
  isBuyer: boolean;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function line(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

/** Dietary or access notes: optional, short, one line. */
export function note(value: unknown) {
  return line(value, 300) || null;
}

export function attendeeName(value: unknown) {
  return line(value, 120);
}

/**
 * One row per place from the buy form. A blank email means the e-ticket goes
 * to the buyer. "This is me" may be ticked on one row only.
 */
export function attendeeRows(
  raw: unknown,
  quantity: number,
  buyer: { name: string | null; email: string }
): { ok: true; rows: AttendeeInput[] } | { ok: false; error: string } {
  const list = Array.isArray(raw) ? raw.slice(0, 50) : [];
  if (list.length !== quantity) {
    return { ok: false, error: quantity === 1 ? "Please tell us who the ticket is for." : `Please give a name for each of the ${quantity} places.` };
  }
  const rows: AttendeeInput[] = [];
  for (const [i, item] of list.entries()) {
    const r = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const isBuyer = r.isBuyer === true;
    const name = attendeeName(r.name) || (isBuyer ? attendeeName(buyer.name) : "");
    const email = (line(r.email, 200) || buyer.email).toLowerCase();
    const which = quantity === 1 ? "the ticket" : `place ${i + 1}`;
    if (!name) return { ok: false, error: `Please give the name for ${which}.` };
    if (!EMAIL.test(email)) return { ok: false, error: `Please check the email address for ${which}.` };
    rows.push({ name, email, dietary: note(r.dietary), accessNeeds: note(r.accessNeeds), isBuyer });
  }
  if (rows.filter((r) => r.isBuyer).length > 1) return { ok: false, error: "Only one place can be yours." };
  return { ok: true, rows };
}

/** Rows for a paid order that has none, such as one bought before names were asked for. */
export function placeholderRows(quantity: number, buyer: { name: string | null; email: string }): AttendeeInput[] {
  return Array.from({ length: Math.max(1, quantity) }, (_, i) => ({
    name: i === 0 ? buyer.name?.trim() || "Guest" : `${buyer.name?.trim() || "Guest"} (place ${i + 1})`,
    email: buyer.email,
    dietary: null,
    accessNeeds: null,
    isBuyer: i === 0,
  }));
}

export const DETAILS_CLOSE_HOURS = 48;

/** When attendees can no longer change their details: the event's own cut-off, or 48 hours before it starts. */
export function detailsCloseAt(event: { startsAt: Date; detailsCloseAt?: Date | null }) {
  return event.detailsCloseAt ?? new Date(event.startsAt.getTime() - DETAILS_CLOSE_HOURS * 3_600_000);
}

export function canEditDetails(event: { startsAt: Date; detailsCloseAt?: Date | null }, now = new Date()) {
  return now < detailsCloseAt(event);
}

/**
 * What to refund for one place. Places share the order's total (after any
 * discount code) evenly; the last place still open takes whatever is left, so
 * the refunds always add up to exactly what was paid.
 */
export function placeRefundPence(order: { amount: number; quantity: number }, refundedSoFar: number, openPlaces: number) {
  const remaining = Math.max(0, order.amount - refundedSoFar);
  if (openPlaces <= 1) return remaining;
  return Math.min(remaining, Math.floor(order.amount / Math.max(1, order.quantity)));
}

export type AttendeeState = "confirmed" | "pending" | "cancelled";

export function attendeeState(a: { cancelledAt: Date | null }, ticketStatus: string): AttendeeState {
  if (a.cancelledAt || ticketStatus === "refunded") return "cancelled";
  if (ticketStatus === "paid") return "confirmed";
  return "pending";
}
