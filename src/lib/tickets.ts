import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { alertOwners, deliverOnce } from "@/lib/mail/send";
import { formatMoney, ticketSoldAlert } from "@/lib/mail/templates/billing";
import { ticketConfirmedEmail } from "@/lib/mail/templates/tickets";

/**
 * Native event tickets, paid through Stripe Checkout (one-off payments).
 *
 * Rules, kept deliberately simple:
 *  - An active member who is signed in pays the member price and buys one ticket.
 *  - Everyone else (guests, and signed-in accounts without membership) pays the
 *    guest price and may buy up to four tickets in one order.
 *  - A price of £0 for the buyer means no checkout: members save a free place
 *    with an RSVP instead.
 *  - A pending ticket holds its seats while its Checkout Session is open. The
 *    session expires after 31 minutes; holds older than PENDING_HOLD_MINUTES
 *    stop counting and are marked cancelled.
 */

export const MAX_GUEST_TICKETS = 4;
export const MAX_MEMBER_TICKETS = 1;
export const PENDING_HOLD_MINUTES = 35;
/** Stripe's minimum Checkout Session lifetime is 30 minutes. */
export const CHECKOUT_EXPIRES_MINUTES = 31;

export type PriceType = "member" | "guest";

type Priced = { priceGBP: number; memberPriceGBP: number };

/** What this buyer pays for one ticket, in pence. Zero means no checkout. */
export function ticketPrice(event: Priced, isMember: boolean): { amountPence: number; priceType: PriceType } {
  const pounds = isMember ? event.memberPriceGBP : event.priceGBP;
  const amountPence = Math.max(0, Math.round((Number.isFinite(pounds) ? pounds : 0) * 100));
  return { amountPence, priceType: isMember ? "member" : "guest" };
}

/** How many tickets this buyer may take in one order, within what is left. */
export function clampQuantity(raw: unknown, isMember: boolean) {
  const max = isMember ? MAX_MEMBER_TICKETS : MAX_GUEST_TICKETS;
  const n = Math.round(Number(raw ?? 1));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(max, n);
}

/**
 * Seats left, or null when the event has no limit. Paid (and held) ticket
 * quantities count in full; an RSVP counts only when that person does not
 * already hold a ticket, because paying signed-in members also get an RSVP.
 */
export function seatsLeft(
  event: { capacity: number | null },
  tickets: { quantity: number; userId: string | null }[],
  rsvps: { userId: string }[]
): number | null {
  if (event.capacity == null) return null;
  const holders = new Set(tickets.map((t) => t.userId).filter(Boolean));
  const ticketSeats = tickets.reduce((sum, t) => sum + Math.max(0, t.quantity), 0);
  const rsvpSeats = rsvps.filter((r) => !holders.has(r.userId)).length;
  return Math.max(0, event.capacity - ticketSeats - rsvpSeats);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The name and email a guest gives before paying. Never put either in a URL. */
export function guestDetails(body: { name?: unknown; email?: unknown }):
  | { ok: true; name: string; email: string }
  | { ok: false; error: string } {
  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ").slice(0, 120) : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  if (!name) return { ok: false, error: "Please give the name the ticket should be in." };
  if (!EMAIL.test(email)) return { ok: false, error: "Please give an email address we can send your ticket to." };
  return { ok: true, name, email };
}

/** The line Stripe shows at checkout and on the receipt: "Scalp masterclass, Thursday 12 November 2026". */
export function ticketLineName(event: { title: string; startsAt: Date }) {
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Dublin",
  })
    .format(event.startsAt)
    // Some ICU versions put a comma after the weekday.
    .replace(/^(\p{L}+),/u, "$1");
  return `${event.title}, ${date}`.slice(0, 250);
}

/** Holds older than this no longer count against capacity. */
export function holdCutoff(now = new Date()) {
  return new Date(now.getTime() - PENDING_HOLD_MINUTES * 60_000);
}

/** The tickets and RSVPs that take a seat right now, for seatsLeft. */
export async function seatUsage(eventId: string, now = new Date(), db: Pick<typeof prisma, "eventTicket" | "eventRsvp"> = prisma) {
  const [tickets, rsvps] = await Promise.all([
    db.eventTicket.findMany({
      where: { eventId, OR: [{ status: "paid" }, { status: "pending", createdAt: { gte: holdCutoff(now) } }] },
      select: { quantity: true, userId: true },
    }),
    db.eventRsvp.findMany({ where: { eventId }, select: { userId: true } }),
  ]);
  return { tickets, rsvps };
}

function refresh(slug: string) {
  try {
    revalidatePath(`/events/${slug}`);
    revalidatePath("/members/events");
  } catch {
    // Outside a request (e.g. tests); pages refresh on their own schedule.
  }
}

function idOf(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/**
 * checkout.session.completed for a ticket. Marks it paid, saves the member's
 * place as an RSVP and sends the confirmation. Safe to run more than once.
 */
export async function handleTicketCheckoutCompleted(session: Stripe.Checkout.Session) {
  const ticketId = session.metadata?.ticketId;
  if (!ticketId) return { ok: false as const, reason: "no-ticket-id" };
  if (session.payment_status !== "paid") {
    console.warn("[TICKETS] checkout completed without payment", { ticketId, status: session.payment_status });
    return { ok: false as const, reason: "unpaid" };
  }

  const ticket = await prisma.eventTicket.findUnique({ where: { id: ticketId }, include: { event: true } });
  if (!ticket) {
    console.error("[TICKETS] paid checkout for an unknown ticket", { ticketId, session: session.id });
    return { ok: false as const, reason: "unknown-ticket" };
  }
  if (ticket.status === "refunded") return { ok: true as const, ticketId, already: true };

  const paymentIntent = idOf(session.payment_intent as string | { id: string } | null);
  // Only a pending or lapsed hold becomes paid, so a retried event changes nothing.
  // A hold that lapsed is still honoured: the money has been taken.
  const updated = await prisma.eventTicket.updateMany({
    where: { id: ticket.id, status: { in: ["pending", "cancelled"] } },
    data: {
      status: "paid",
      paidAt: new Date(),
      stripeSessionId: session.id,
      ...(paymentIntent ? { stripePaymentIntentId: paymentIntent } : {}),
      ...(typeof session.amount_total === "number" ? { amount: session.amount_total } : {}),
      ...(session.currency ? { currency: session.currency } : {}),
    },
  });

  if (ticket.userId) {
    await prisma.eventRsvp.createMany({ data: [{ eventId: ticket.eventId, userId: ticket.userId }], skipDuplicates: true });
  }

  const email = ticketConfirmedEmail({
    name: ticket.name,
    event: ticket.event,
    quantity: ticket.quantity,
    amount: formatMoney(session.amount_total ?? ticket.amount, session.currency ?? ticket.currency),
    priceType: ticket.priceType === "member" ? "member" : "guest",
  });
  await deliverOnce(`ticket-confirmed:${ticket.id}`, ticket.email, email.subject, email.content, { tag: "event-ticket" });

  // The team hears about each sale once: only the event that marked the ticket paid sends it.
  if (updated.count > 0) {
    await alertOwners(
      ticketSoldAlert({
        name: ticket.name,
        email: ticket.email,
        event: ticket.event.title,
        quantity: ticket.quantity,
        amount: formatMoney(session.amount_total ?? ticket.amount, session.currency ?? ticket.currency),
        priceType: ticket.priceType,
      })
    );
  }

  refresh(ticket.event.slug);
  return { ok: true as const, ticketId: ticket.id, already: updated.count === 0 };
}

/** checkout.session.expired for a ticket: release the hold straight away. */
export async function handleTicketCheckoutExpired(session: Stripe.Checkout.Session) {
  const ticketId = session.metadata?.ticketId;
  if (!ticketId) return;
  await prisma.eventTicket.updateMany({ where: { id: ticketId, status: "pending" }, data: { status: "cancelled" } });
}

/**
 * charge.refunded (or a payment intent) for a ticket. A full refund marks the
 * ticket refunded and frees the member's RSVP when they hold no other ticket.
 * A partial refund leaves the ticket paid, since the team may refund one of
 * several places by hand.
 */
export async function handleTicketRefund(source: Stripe.Charge | Stripe.PaymentIntent | string) {
  let paymentIntentId: string | null;
  if (typeof source === "string") {
    paymentIntentId = source;
  } else if (source.object === "charge") {
    if (!source.refunded) {
      console.info("[TICKETS] partial refund left as paid", { charge: source.id });
      return { ok: false as const, reason: "partial" };
    }
    paymentIntentId = idOf(source.payment_intent as string | { id: string } | null);
  } else {
    paymentIntentId = source.id;
  }
  if (!paymentIntentId) return { ok: false as const, reason: "no-payment-intent" };

  const tickets = await prisma.eventTicket.findMany({
    where: { stripePaymentIntentId: paymentIntentId, status: { not: "refunded" } },
    select: { id: true, eventId: true, userId: true, event: { select: { slug: true } } },
  });
  if (!tickets.length) return { ok: false as const, reason: "not-a-ticket" };

  await prisma.eventTicket.updateMany({ where: { id: { in: tickets.map((t) => t.id) } }, data: { status: "refunded" } });
  for (const t of tickets) {
    if (t.userId) {
      const other = await prisma.eventTicket.count({ where: { eventId: t.eventId, userId: t.userId, status: "paid" } });
      if (!other) await prisma.eventRsvp.deleteMany({ where: { eventId: t.eventId, userId: t.userId } });
    }
    refresh(t.event.slug);
  }
  return { ok: true as const, count: tickets.length };
}

const isTicketSession = (s: Stripe.Checkout.Session) => s.mode === "payment" && s.metadata?.kind === "ticket";

/**
 * The Stripe webhook's entry point for tickets. Returns true when the event was
 * a ticket checkout and has been fully handled, so the membership logic is
 * skipped. Refunds are handled here but return false, so other handlers can
 * still see them; a refund failure is logged and never fails the webhook.
 */
export async function handleTicketWebhook(event: Stripe.Event): Promise<boolean> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!isTicketSession(session)) return false;
      await handleTicketCheckoutCompleted(session);
      return true;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!isTicketSession(session)) return false;
      await handleTicketCheckoutExpired(session);
      return true;
    }
    case "charge.refunded": {
      try {
        await handleTicketRefund(event.data.object as Stripe.Charge);
      } catch (error) {
        console.error("[TICKETS] refund handling failed", error);
      }
      return false;
    }
    default:
      return false;
  }
}

export type Attendee = {
  key: string;
  name: string | null;
  email: string;
  type: "Member ticket" | "Guest ticket" | "RSVP";
  quantity: number;
  status: string;
  amount: number | null;
  at: Date;
};

/**
 * Everyone coming to an event, for the Studio attendees list and its CSV:
 * tickets that are paid or refunded, plus RSVPs from people without a paid
 * ticket (paying members also have an RSVP, so they are listed once).
 */
export async function loadAttendees(eventId: string): Promise<Attendee[]> {
  const [tickets, rsvps] = await Promise.all([
    prisma.eventTicket.findMany({
      where: { eventId, status: { in: ["paid", "refunded"] } },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, priceType: true, quantity: true, status: true, amount: true, userId: true, paidAt: true, createdAt: true },
    }),
    prisma.eventRsvp.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
      select: { userId: true, createdAt: true, user: { select: { name: true, email: true } } },
    }),
  ]);
  const paidHolders = new Set(tickets.filter((t) => t.status === "paid" && t.userId).map((t) => t.userId));
  return [
    ...tickets.map<Attendee>((t) => ({
      key: `t:${t.id}`,
      name: t.name,
      email: t.email,
      type: t.priceType === "member" ? "Member ticket" : "Guest ticket",
      quantity: t.quantity,
      status: t.status === "paid" ? "Paid" : "Refunded",
      amount: t.amount,
      at: t.paidAt ?? t.createdAt,
    })),
    ...rsvps
      .filter((r) => !paidHolders.has(r.userId))
      .map<Attendee>((r) => ({
        key: `r:${r.userId}`,
        name: r.user.name,
        email: r.user.email ?? "",
        type: "RSVP",
        quantity: 1,
        status: "Going",
        amount: null,
        at: r.createdAt,
      })),
  ];
}
