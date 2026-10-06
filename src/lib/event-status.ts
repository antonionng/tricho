import { seatsLeft } from "@/lib/tickets";

/**
 * Where a member stands with an event, worked out the same way for the members'
 * events pages and the app. Pure, so it can be tested without a database.
 */

type StatusEvent = {
  startsAt: Date;
  endsAt: Date | null;
  online: boolean;
  capacity: number | null;
  sellTickets: boolean;
  joinUrl?: string | null;
  rsvps: { userId: string }[];
  tickets: { quantity: number; userId: string | null; status: string }[];
};

export type MemberEventStatus = {
  going: boolean;
  hasTicket: boolean;
  /** Places left when tickets are sold here with a limit, otherwise null. */
  left: number | null;
  full: boolean;
  started: boolean;
  past: boolean;
  /** Going, either with a free place or a paid ticket. */
  attending: boolean;
  /** The joining link, only ever for members who are going to an online event. */
  joinUrl: string | null;
};

export function memberEventStatus(event: StatusEvent, userId: string, now = new Date()): MemberEventStatus {
  const t = now.getTime();
  const going = event.rsvps.some((r) => r.userId === userId);
  const hasTicket = event.tickets.some((x) => x.userId === userId && x.status === "paid");
  const left = event.sellTickets ? seatsLeft(event, event.tickets, event.rsvps) : null;
  const full = event.sellTickets ? left === 0 : event.capacity != null && event.rsvps.length >= event.capacity;
  const attending = going || hasTicket;
  return {
    going,
    hasTicket,
    left,
    full,
    started: event.startsAt.getTime() < t,
    past: (event.endsAt ?? event.startsAt).getTime() < t,
    attending,
    joinUrl: attending && event.online ? event.joinUrl ?? null : null,
  };
}

/**
 * How a member books an event, mirroring the website's buttons:
 *  - "none": nothing to do (they already hold a ticket, or it started and they are going)
 *  - "started": it has started, so places can no longer be booked
 *  - "sold_out": tickets are sold here and none are left
 *  - "buy": a paid ticket bought through Stripe checkout on the website
 *  - "external": members pay on the organiser's own ticket page
 *  - "rsvp": a free place, saved or released with one tap
 *  - "full": free places have all gone (a member who is going can still release theirs)
 */
export type BookingMode = "none" | "started" | "sold_out" | "buy" | "external" | "rsvp" | "full";

export function bookingMode(
  event: { memberPriceGBP: number; sellTickets: boolean; ticketUrl: string | null },
  s: Pick<MemberEventStatus, "hasTicket" | "started" | "going" | "full">
): BookingMode {
  if (s.hasTicket) return "none";
  if (s.started) return s.going ? "none" : "started";
  if (event.sellTickets && event.memberPriceGBP > 0) return s.full ? "sold_out" : "buy";
  if (!event.sellTickets && event.ticketUrl && event.memberPriceGBP > 0) return "external";
  return s.full && !s.going ? "full" : "rsvp";
}

/**
 * The booking modes the app shows. App Store rules let a phone open the website's
 * checkout only for events that take place in person. For a paid online event,
 * whether sold here or on an organiser's page, the app says tickets are on
 * trichollective.net and offers no link ("web_only"). Free places work in the app.
 */
export type AppBookingMode = BookingMode | "web_only";

export function appBookingMode(mode: BookingMode, online: boolean): AppBookingMode {
  if (online && (mode === "buy" || mode === "external")) return "web_only";
  return mode;
}
