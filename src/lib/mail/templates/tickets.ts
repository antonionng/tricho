import type { EmailSample } from "../catalogue";
import type { EmailContent } from "../layout";
import { calendarHref, eventDate, eventDay, eventHref, eventTime, eventWhere, firstNameOf, type EmailEvent } from "./members";
import { mapHref } from "@/lib/event-time";
import { ticketPath } from "@/lib/attendees";

/**
 * Event ticket emails: the confirmation sent once Stripe confirms payment for a
 * ticket bought on Trichollective. Reminders reuse eventReminderEmail.
 */

type Email = { subject: string; content: EmailContent };

/** How to get there: online wording for online events, the venue, address and a map link for in-person ones. */
export function eventHow(e: EmailEvent) {
  if (e.online) {
    return e.joinUrl
      ? "It takes place online on Google Meet. Use the joining link below at the start time, and keep this email so you have it to hand."
      : "It takes place online, and we will send the joining details to this address before it starts.";
  }
  const place = [eventWhere(e), e.venueAddress?.trim()].filter(Boolean).join(", ");
  return `It takes place in person at ${place}.${e.venueAddress ? " The map link below shows the way." : ""}`;
}

/** Address and map rows for an in-person event; nothing for an online one. */
export function venueFacts(e: EmailEvent): [string, string][] {
  if (e.online) return [];
  const facts: [string, string][] = [];
  if (e.venueAddress) facts.push(["Address", e.venueAddress]);
  const map = e.venueAddress ? mapHref([e.venue, e.venueAddress]) : null;
  if (map) facts.push(["Map", map]);
  return facts;
}

export type TicketEmailInput = {
  name: string | null;
  event: EmailEvent;
  quantity: number;
  /** Already formatted, e.g. "£40.00". */
  amount: string | null;
  priceType: "member" | "guest";
  /** The ticket type bought, e.g. "Early bird", when the event sells types. */
  ticketType?: string | null;
  /** Everyone on the order, for in-person events. Each gets their own e-ticket. */
  attendees?: { name: string; email: string }[];
};

export function ticketConfirmedEmail(p: TicketEmailInput): Email {
  const e = p.event;
  const places = p.quantity === 1 ? "one place" : `${p.quantity} places`;
  const how = eventHow(e);
  const price = p.priceType === "member" ? "Member price" : "Guest price";
  const facts: [string, string][] = [
    ["Date", eventDate(e.startsAt, e.timezone)],
    ["Time", eventTime(e.startsAt, e.endsAt, e.timezone)],
    ["Where", eventWhere(e)],
    ...venueFacts(e),
    ["Tickets", p.quantity === 1 ? "1 ticket" : `${p.quantity} tickets`],
    ["Price", p.ticketType ? `${p.ticketType}, ${price.toLowerCase()}` : price],
  ];
  if (p.amount) facts.push(["Paid", p.amount]);
  if (e.joinUrl) facts.push(["Join online", e.joinUrl]);
  const people = p.attendees ?? [];
  if (people.length) facts.push([people.length === 1 ? "Attendee" : "Attendees", people.map((a) => `${a.name} (${a.email})`).join("\n")]);
  return {
    subject: `Your ticket for ${e.title} is confirmed`,
    content: {
      preheader: `${eventDay(e.startsAt, e.timezone)}. Your payment has been received and your place is booked.`,
      eyebrow: "Your ticket",
      image: "gathering",
      heading: `Your ticket for ${e.title} on ${eventDay(e.startsAt, e.timezone)} is confirmed.`,
      body: [
        `Hello ${firstNameOf(p.name)},`,
        `Thank you for booking. Your payment has been received and we have reserved ${places} for you. ${how}`,
        ...(people.length
          ? [
              people.length === 1
                ? "The e-ticket, with the QR code to show at the door, is sent by email to the address below."
                : "Each person below is sent their own e-ticket by email, with the QR code to show at the door and a link to change their name, dietary or access details.",
            ]
          : []),
        "Stripe sends your payment receipt separately. We will also send you a reminder a day or two before the event.",
        "If you can no longer attend, reply to this email and we will help.",
      ].join("\n\n"),
      facts,
      cta: e.joinUrl ? { label: "Join on Google Meet", href: e.joinUrl } : { label: "View the event", href: eventHref(e) },
      secondary: { label: "Add to your calendar", href: calendarHref(e) },
      reason: `You receive this because you bought a ticket for ${e.title}.`,
    },
  };
}

export type AttendeeTicketInput = {
  attendee: { name: string; code: string; dietary?: string | null; accessNeeds?: string | null };
  event: EmailEvent;
  ticketType?: string | null;
  /** Who bought it, when that was someone else. */
  boughtBy?: string | null;
  /** Already formatted, e.g. "Thursday 22 April 2027". */
  changesUntil: string;
};

/** The content id the QR code attachment is sent with. */
export const TICKET_QR_CID = "ticket-qr";

/** One person's e-ticket: the QR code for the door, and a link to their ticket page. */
export function attendeeTicketEmail(p: AttendeeTicketInput): Email {
  const e = p.event;
  const a = p.attendee;
  const facts: [string, string][] = [
    ["Name", a.name],
    ["Date", eventDate(e.startsAt, e.timezone)],
    ["Time", eventTime(e.startsAt, e.endsAt, e.timezone)],
    ["Where", eventWhere(e)],
    ...venueFacts(e),
  ];
  if (p.ticketType) facts.push(["Ticket", p.ticketType]);
  if (a.dietary) facts.push(["Dietary", a.dietary]);
  if (a.accessNeeds) facts.push(["Access", a.accessNeeds]);
  return {
    subject: `Your e-ticket for ${e.title}`,
    content: {
      preheader: `${eventDay(e.startsAt, e.timezone)}. Show the QR code inside at the door.`,
      eyebrow: "Your e-ticket",
      image: "gathering",
      heading: `Your ticket for ${e.title} on ${eventDay(e.startsAt, e.timezone)} is ready.`,
      body: [
        `Hello ${firstNameOf(a.name)},`,
        `${p.boughtBy ? `${p.boughtBy} has booked you a place at ${e.title}. ` : ""}${eventHow(e)}`,
        "Show the QR code below at the door, on your phone or printed, and we will check you in. The code under it works too if the camera cannot read it.",
        `If your name is spelt wrongly, or you would like us to know about dietary or access needs, you can change them from your ticket page until ${p.changesUntil}.`,
      ].join("\n\n"),
      ticket: { contentId: TICKET_QR_CID, code: a.code, label: "Ticket code" },
      facts,
      cta: { label: "View or change your ticket", href: ticketPath(e.slug, a.code) },
      secondary: { label: "Add to your calendar", href: calendarHref(e) },
      reason: `You receive this because a ticket for ${e.title} was booked in your name.`,
    },
  };
}

/** The reminder for ticket holders, members and guests, a day or two before. */
export function ticketReminderEmail(p: { name: string | null; event: EmailEvent; quantity: number }): Email {
  const e = p.event;
  const where = eventWhere(e);
  return {
    subject: `Reminder: ${e.title} is on ${eventDay(e.startsAt, e.timezone)}`,
    content: {
      preheader: `${eventTime(e.startsAt, e.endsAt, e.timezone)}, ${where.toLowerCase() === "online" ? "online" : where}.`,
      eyebrow: "Event reminder",
      image: "gathering",
      heading: `${e.title} is on ${eventDay(e.startsAt, e.timezone)}, and your ticket is booked.`,
      body: [
        `Hello ${firstNameOf(p.name)},`,
        `A short reminder that you have ${p.quantity === 1 ? "a ticket" : `${p.quantity} tickets`} for ${e.title}. Here are the details you need${e.joinUrl ? ", including the link to join on Google Meet" : ""}.`,
        "If you can no longer attend, reply to this email and we will help.",
      ].join("\n\n"),
      facts: [
        ["Date", eventDate(e.startsAt, e.timezone)],
        ["Time", eventTime(e.startsAt, e.endsAt, e.timezone)],
        ["Where", where],
        ...venueFacts(e),
        ["Tickets", p.quantity === 1 ? "1 ticket" : `${p.quantity} tickets`],
        ...(e.joinUrl ? ([["Join online", e.joinUrl]] as [string, string][]) : []),
      ],
      cta: e.joinUrl ? { label: "Join on Google Meet", href: e.joinUrl } : { label: "View the event", href: eventHref(e) },
      secondary: { label: "Add to your calendar", href: calendarHref(e) },
      reason: `You receive this because you bought a ticket for ${e.title}.`,
    },
  };
}

const sampleEvent: EmailEvent = {
  id: "sample-event",
  slug: "dublin-case-round-october",
  title: "Dublin case round: diffuse shedding",
  summary: "Bring an anonymised case of diffuse shedding and work through it with cosmetic, clinical and medical colleagues.",
  startsAt: new Date("2026-10-15T18:30:00Z"),
  endsAt: new Date("2026-10-15T20:00:00Z"),
  online: false,
  venue: "The Alex Hotel",
  city: "Dublin",
  venueAddress: "41-47 Fenian Street, Dublin 2, D02 H678",
  timezone: "Europe/Dublin",
  ticketUrl: null,
};

const confirmed = ticketConfirmedEmail({ name: "Niamh Byrne", event: sampleEvent, quantity: 2, amount: "£120.00", priceType: "guest", ticketType: "Early bird" });

const reminder = ticketReminderEmail({ name: "Niamh Byrne", event: sampleEvent, quantity: 2 });

const eTicket = attendeeTicketEmail({
  attendee: { name: "Niamh Byrne", code: "7KQ2M9XRB4TZ8HCW", dietary: "Vegetarian", accessNeeds: null },
  event: sampleEvent,
  ticketType: "Early bird",
  boughtBy: "Aisling Murphy",
  changesUntil: "Tuesday 13 October",
});

export const samples: EmailSample[] = [
  {
    id: "event-ticket-confirmed",
    name: "Event ticket confirmed",
    trigger: "Sent once Stripe confirms payment for a ticket bought on Trichollective, with an Add to calendar link.",
    audience: "everyone",
    ...confirmed,
  },
  {
    id: "event-attendee-ticket",
    name: "Event e-ticket",
    trigger: "Sent to each named attendee of an in-person event once Stripe confirms payment, with their QR code shown inline.",
    audience: "everyone",
    ...eTicket,
  },
  {
    id: "event-ticket-reminder",
    name: "Event ticket reminder",
    trigger: "Sent once, a day or two before an event, to everyone holding a paid ticket, including guests without an account.",
    audience: "everyone",
    ...reminder,
  },
];
