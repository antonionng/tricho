import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { alertOwners, deliverOnce } from "@/lib/mail/send";
import { formatMoney, ticketSoldAlert } from "@/lib/mail/templates/billing";
import { attendeeTicketEmail, packageConfirmedEmail, packageSoldAlert, TICKET_QR_CID, ticketConfirmedEmail } from "@/lib/mail/templates/tickets";
import { eventDay } from "@/lib/mail/templates/members";
import { detailsCloseAt, newAttendeeCode, placeholderRows, placeRefundPence } from "@/lib/attendees";
import { eventTimeZone } from "@/lib/event-time";
import { exhibitorPath, kindOf, packageIncludes, type PackageOrder } from "@/lib/packages";

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
 *
 * An event can instead sell ticket types (early bird, standard and so on).
 * Then the buyer picks a type, pays its member price when signed in as a member
 * (or its price otherwise), and may buy up to the type's own maximum per order,
 * members included. Each type's places and the event's total are both checked.
 * Events without types keep the flat rules above.
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

/** A ticket type's rules, as the checkout and the event page need them. */
export type TicketTypeRule = {
  id: string;
  name: string;
  description?: string;
  pricePence: number;
  memberPricePence: number | null;
  membersOnly: boolean;
  capacity: number | null;
  salesStart: Date | null;
  salesEnd: Date | null;
  maxPerOrder: number;
  active: boolean;
};

/** What this buyer pays for one ticket of a type, in pence. Members pay the member price when there is one. */
export function typePrice(type: Pick<TicketTypeRule, "pricePence" | "memberPricePence">, isMember: boolean): { amountPence: number; priceType: PriceType } {
  const member = isMember && type.memberPricePence != null;
  const raw = member ? type.memberPricePence! : type.pricePence;
  return { amountPence: Math.max(0, Math.round(Number.isFinite(raw) ? raw : 0)), priceType: member ? "member" : "guest" };
}

/** How many of a type one order may take: one up to the type's maximum. */
export function clampTypeQuantity(raw: unknown, type: Pick<TicketTypeRule, "maxPerOrder">) {
  const max = Math.max(1, Math.round(type.maxPerOrder) || 1);
  const n = Math.round(Number(raw ?? 1));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(max, n);
}

/** Places of one type that are paid or held. */
export function typeSeatsTaken(typeId: string, tickets: { quantity: number; ticketTypeId?: string | null }[]) {
  return tickets.reduce((sum, t) => (t.ticketTypeId === typeId ? sum + Math.max(0, t.quantity) : sum), 0);
}

export type TypeState = "on_sale" | "not_yet" | "closed" | "sold_out" | "members_only";

export type TypeAvailability = {
  state: TypeState;
  /** Places of this type still available, within the event's total. Null means no limit. */
  left: number | null;
  /** When sales open, for "not_yet". */
  opensAt: Date | null;
};

/**
 * Whether a type can be bought right now, and how many are left. The order of
 * checks matters: a type not yet on sale says so even when the event is full.
 */
export function typeAvailability(
  type: TicketTypeRule,
  opts: { now?: Date; eventStartsAt: Date; taken: number; eventLeft: number | null; isMember: boolean }
): TypeAvailability {
  const now = opts.now ?? new Date();
  const typeLeft = type.capacity == null ? null : Math.max(0, type.capacity - opts.taken);
  const left = typeLeft == null ? opts.eventLeft : opts.eventLeft == null ? typeLeft : Math.min(typeLeft, opts.eventLeft);
  if (!type.active) return { state: "closed", left, opensAt: null };
  if (type.salesStart && type.salesStart > now) return { state: "not_yet", left, opensAt: type.salesStart };
  if ((type.salesEnd && type.salesEnd <= now) || opts.eventStartsAt <= now) return { state: "closed", left, opensAt: null };
  if (left === 0) return { state: "sold_out", left, opensAt: null };
  if (type.membersOnly && !opts.isMember) return { state: "members_only", left, opensAt: null };
  return { state: "on_sale", left, opensAt: null };
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
export function ticketLineName(event: { title: string; startsAt: Date; timezone?: string | null }) {
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: eventTimeZone(event.timezone),
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

/**
 * The tickets and RSVPs that take a seat right now, for seatsLeft and
 * typeSeatsTaken, and the exhibitor packages and extra places that are paid or
 * held, for package stock. Exhibitor places do not count towards the event's
 * Places, which is for delegates.
 */
export async function seatUsage(eventId: string, now = new Date(), db: Pick<typeof prisma, "eventTicket" | "eventRsvp"> = prisma) {
  const [all, rsvps] = await Promise.all([
    db.eventTicket.findMany({
      where: { eventId, OR: [{ status: "paid" }, { status: "pending", createdAt: { gte: holdCutoff(now) } }] },
      select: {
        id: true,
        quantity: true,
        userId: true,
        ticketTypeId: true,
        packageTicketId: true,
        ticketType: { select: { kind: true, includesStand: true, includesStageSlot: true } },
        _count: { select: { attendees: { where: { cancelledAt: { not: null } } } } },
      },
    }),
    db.eventRsvp.findMany({ where: { eventId }, select: { userId: true } }),
  ]);
  const isPackageOrder = (t: (typeof all)[number]) => kindOf(t.ticketType) !== "attendee";
  return {
    // A place refunded on its own in Studio frees its seat; the rest of the order still counts.
    tickets: all
      .filter((t) => !isPackageOrder(t))
      .map((t) => ({ quantity: Math.max(0, t.quantity - (t._count?.attendees ?? 0)), userId: t.userId, ticketTypeId: t.ticketTypeId })),
    rsvps,
    // A package keeps its stock, stand and stage slot until the whole order is refunded.
    packageOrders: all.filter(isPackageOrder).map<PackageOrder>((t) => ({
      ticketTypeId: t.ticketTypeId,
      quantity: kindOf(t.ticketType) === "addon" ? Math.max(0, t.quantity - (t._count?.attendees ?? 0)) : 1,
      packageTicketId: t.packageTicketId ?? null,
      includesStand: kindOf(t.ticketType) === "package" && !!t.ticketType?.includesStand,
      includesStageSlot: kindOf(t.ticketType) === "package" && !!t.ticketType?.includesStageSlot,
    })),
  };
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

  const ticket = await prisma.eventTicket.findUnique({
    where: { id: ticketId },
    include: {
      event: true,
      ticketType: { select: { name: true, kind: true, placesIncluded: true, includesStand: true, includesStageSlot: true, description: true } },
      exhibitor: { select: { companyName: true, contactName: true, manageCode: true, vatNumber: true } },
    },
  });
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

  if (kindOf(ticket.ticketType) === "package") {
    await completePackage(ticket, session, updated.count > 0);
    refresh(ticket.event.slug);
    return { ok: true as const, ticketId: ticket.id, already: updated.count === 0 };
  }

  if (ticket.userId) {
    await prisma.eventRsvp.createMany({ data: [{ eventId: ticket.eventId, userId: ticket.userId }], skipDuplicates: true });
  }

  // In person, every place has a named attendee with their own e-ticket.
  const attendees = ticket.event.online ? [] : await ensureAttendees(ticket);

  const email = ticketConfirmedEmail({
    name: ticket.name,
    event: ticket.event,
    quantity: ticket.quantity,
    amount: formatMoney(session.amount_total ?? ticket.amount, session.currency ?? ticket.currency),
    priceType: ticket.priceType === "member" ? "member" : "guest",
    ticketType: ticket.ticketType?.name ?? null,
    attendees: attendees.filter((a) => !a.cancelledAt).map((a) => ({ name: a.name, email: a.email })),
  });
  await deliverOnce(`ticket-confirmed:${ticket.id}`, ticket.email, email.subject, email.content, { tag: "event-ticket" });
  for (const a of attendees) {
    if (!a.cancelledAt) await sendAttendeeTicket(a, ticket);
  }

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

/**
 * A paid exhibitor package: the confirmation to the contact with links to name
 * their places, add their logo and booklet text, and buy extra places; an
 * e-ticket for each place already named; and an alert to the owners.
 */
async function completePackage(
  ticket: PaidTicket & {
    amount: number;
    currency: string;
    ticketTypeId: string | null;
    ticketType: { name: string; kind: string; placesIncluded: number; includesStand: boolean; includesStageSlot: boolean; description: string } | null;
    exhibitor: { companyName: string; contactName: string; manageCode: string; vatNumber: string | null } | null;
  },
  session: Stripe.Checkout.Session,
  firstTime: boolean
) {
  const type = ticket.ticketType!;
  const ex = ticket.exhibitor;
  if (!ex) {
    console.error("[TICKETS] paid package without company details", { ticketId: ticket.id });
    return;
  }
  const attendees = await prisma.eventAttendee.findMany({ where: { ticketId: ticket.id }, orderBy: { createdAt: "asc" } });
  const open = attendees.filter((a) => !a.cancelledAt);
  const extras = ticket.ticketTypeId
    ? await prisma.eventTicketType.findFirst({
        where: { eventId: ticket.eventId, kind: "addon", active: true, addonForTypeIds: { has: ticket.ticketTypeId } },
        select: { name: true, pricePence: true, maxPerOrder: true },
      })
    : null;
  const amount = formatMoney(session.amount_total ?? ticket.amount, session.currency ?? ticket.currency);
  const email = packageConfirmedEmail({
    contactName: ex.contactName,
    companyName: ex.companyName,
    event: ticket.event,
    packageName: type.name,
    includes: packageIncludes(type),
    amount,
    named: open.filter((a) => !a.awaitingName).map((a) => ({ name: a.name, email: a.email })),
    waiting: open.filter((a) => a.awaitingName).length,
    manageHref: exhibitorPath(ticket.event.slug, ex.manageCode),
    code: ex.manageCode,
    extras: extras ? { name: extras.name, price: formatMoney(extras.pricePence, "gbp") ?? "", max: extras.maxPerOrder } : null,
  });
  await deliverOnce(`package-confirmed:${ticket.id}`, ticket.email, email.subject, email.content, { tag: "event-package" });
  for (const a of open) {
    if (!a.awaitingName) await sendAttendeeTicket(a, ticket);
  }
  if (firstTime) {
    await alertOwners(
      packageSoldAlert({
        company: ex.companyName,
        contact: ex.contactName,
        email: ticket.email,
        event: ticket.event.title,
        eventId: ticket.eventId,
        packageName: type.name,
        amount,
        vatNumber: ex.vatNumber,
      })
    );
  }
}

type PaidTicket = {
  id: string;
  eventId: string;
  name: string | null;
  email: string;
  quantity: number;
  event: Parameters<typeof attendeeTicketEmail>[0]["event"] & { detailsCloseAt?: Date | null };
  ticketType?: { name: string } | null;
};

/** The order's attendees, creating them from the buyer's details for an order that has none. */
async function ensureAttendees(ticket: PaidTicket) {
  const existing = await prisma.eventAttendee.findMany({ where: { ticketId: ticket.id }, orderBy: { createdAt: "asc" } });
  if (existing.length) return existing;
  await prisma.eventAttendee.createMany({
    data: placeholderRows(ticket.quantity, { name: ticket.name, email: ticket.email }).map((row) => ({
      ...row,
      ticketId: ticket.id,
      eventId: ticket.eventId,
      code: newAttendeeCode(),
    })),
  });
  return prisma.eventAttendee.findMany({ where: { ticketId: ticket.id }, orderBy: { createdAt: "asc" } });
}

/** One attendee's e-ticket, with the QR code inline. Sent once per attendee. */
export async function sendAttendeeTicket(
  a: { id: string; name: string; email: string; code: string; dietary: string | null; accessNeeds: string | null; isBuyer: boolean },
  ticket: PaidTicket
) {
  try {
    const { ticketQrPngBase64 } = await import("@/lib/ticket-qr");
    const png = await ticketQrPngBase64(ticket.event.slug, a.code);
    const email = attendeeTicketEmail({
      attendee: a,
      event: ticket.event,
      ticketType: ticket.ticketType?.name ?? null,
      boughtBy: !a.isBuyer && a.email !== ticket.email.toLowerCase() ? ticket.name : null,
      changesUntil: eventDay(detailsCloseAt(ticket.event), ticket.event.timezone),
    });
    return await deliverOnce(`ticket-attendee:${a.id}`, a.email, email.subject, email.content, {
      tag: "event-eticket",
      attachments: [{ filename: `ticket-${a.code}.png`, content: png, contentId: TICKET_QR_CID }],
    });
  } catch (error) {
    console.error("[TICKETS] e-ticket failed", { attendee: a.id, error });
    return false;
  }
}

/** checkout.session.expired for a ticket: release the hold straight away. */
export async function handleTicketCheckoutExpired(session: Stripe.Checkout.Session) {
  const ticketId = session.metadata?.ticketId;
  if (!ticketId) return;
  await prisma.eventTicket.updateMany({ where: { id: ticketId, status: "pending" }, data: { status: "cancelled" } });
}

/**
 * charge.refunded (or a payment intent) for a ticket. A full refund marks the
 * ticket refunded, cancels its attendees and frees the member's RSVP when they
 * hold no other ticket. A partial refund leaves the ticket paid: single places
 * are refunded from Studio with refundAttendee, which records which one.
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
  // A full refund cancels every place on the order.
  await prisma.eventAttendee.updateMany({
    where: { ticketId: { in: tickets.map((t) => t.id) }, cancelledAt: null },
    data: { cancelledAt: new Date() },
  });
  for (const t of tickets) {
    await closeOrder(t);
    refresh(t.event.slug);
  }
  return { ok: true as const, count: tickets.length };
}

/** After an order has no places left: mark it refunded and free the member's RSVP if they hold no other ticket. */
async function closeOrder(t: { id: string; eventId: string; userId: string | null }) {
  await prisma.eventTicket.updateMany({ where: { id: t.id, status: "paid" }, data: { status: "refunded" } });
  if (t.userId) {
    const other = await prisma.eventTicket.count({ where: { eventId: t.eventId, userId: t.userId, status: "paid" } });
    if (!other) await prisma.eventRsvp.deleteMany({ where: { eventId: t.eventId, userId: t.userId } });
  }
}

export type AttendeeRefund = { ok: true; amount: number; orderClosed: boolean; name: string } | { ok: false; error: string };

/**
 * Refund one place on a paid order through Stripe and cancel that attendee.
 * Places share what the order cost (after any discount code); the last place
 * takes what is left. The place is claimed before Stripe is called, so two
 * presses can never refund it twice, and Stripe's idempotency key backs that up.
 */
export async function refundAttendee(attendeeId: string): Promise<AttendeeRefund> {
  const a = await prisma.eventAttendee.findUnique({
    where: { id: attendeeId },
    select: {
      id: true,
      name: true,
      cancelledAt: true,
      ticket: {
        select: {
          id: true,
          eventId: true,
          userId: true,
          status: true,
          amount: true,
          quantity: true,
          stripePaymentIntentId: true,
          ticketType: { select: { kind: true } },
          event: { select: { slug: true } },
          attendees: { select: { id: true, cancelledAt: true, refundedPence: true } },
        },
      },
    },
  });
  if (!a) return { ok: false, error: "That attendee could not be found." };
  if (a.cancelledAt) return { ok: false, error: `${a.name}'s place has already been cancelled.` };
  const t = a.ticket;
  if (t.status !== "paid") return { ok: false, error: "Only a place on a paid order can be refunded." };
  if (kindOf(t.ticketType) === "package") {
    return { ok: false, error: "Places included in a package are not priced on their own, so refund the whole package in Stripe instead." };
  }
  if (!t.stripePaymentIntentId && t.amount > 0) return { ok: false, error: "This order has no Stripe payment to refund." };

  const refundedSoFar = t.attendees.reduce((sum, x) => sum + (x.refundedPence ?? 0), 0);
  const open = t.attendees.filter((x) => !x.cancelledAt).length;
  const amount = placeRefundPence(t, refundedSoFar, open);

  const claimed = await prisma.eventAttendee.updateMany({
    where: { id: a.id, cancelledAt: null },
    data: { cancelledAt: new Date(), refundedPence: amount },
  });
  if (!claimed.count) return { ok: false, error: `${a.name}'s place has already been cancelled.` };

  if (amount > 0) {
    try {
      const { stripe } = await import("@/lib/stripe");
      const refund = await stripe.refunds.create(
        {
          payment_intent: t.stripePaymentIntentId!,
          amount,
          reason: "requested_by_customer",
          metadata: { kind: "ticket", ticketId: t.id, attendeeId: a.id },
        },
        { idempotencyKey: `ticket-attendee-refund:${a.id}` }
      );
      await prisma.eventAttendee.update({ where: { id: a.id }, data: { stripeRefundId: refund.id } });
    } catch (error) {
      // Stripe refused: the place is still theirs.
      await prisma.eventAttendee.update({ where: { id: a.id }, data: { cancelledAt: null, refundedPence: null } });
      console.error("[TICKETS] attendee refund failed", { attendee: a.id, error });
      return { ok: false, error: error instanceof Error ? `Stripe could not make the refund: ${error.message}` : "Stripe could not make the refund." };
    }
  }

  const orderClosed = open <= 1;
  if (orderClosed) await closeOrder(t);
  refresh(t.event.slug);
  return { ok: true, amount, orderClosed, name: a.name };
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

/** One named person on an order, for the Studio list, its CSV and check-in. */
export type AttendeePerson = {
  id: string;
  name: string;
  email: string;
  dietary: string | null;
  accessNeeds: string | null;
  code: string;
  checkedInAt: Date | null;
  cancelledAt: Date | null;
  refundedPence: number | null;
};

export type Attendee = {
  key: string;
  name: string | null;
  email: string;
  type: "Member ticket" | "Guest ticket" | "RSVP" | "Exhibitor package" | "Extra exhibitor places";
  /** The company, for exhibitor packages and their extra places. */
  company?: string | null;
  /** The ticket type's name, when the event sells types. */
  ticketType: string | null;
  quantity: number;
  status: string;
  amount: number | null;
  at: Date;
  /** The named people on the order, for in-person events. */
  people: AttendeePerson[];
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
      select: {
        id: true,
        name: true,
        email: true,
        priceType: true,
        quantity: true,
        status: true,
        amount: true,
        userId: true,
        paidAt: true,
        createdAt: true,
        ticketType: { select: { name: true, kind: true } },
        exhibitor: { select: { companyName: true } },
        packageTicket: { select: { exhibitor: { select: { companyName: true } } } },
        attendees: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            name: true,
            email: true,
            dietary: true,
            accessNeeds: true,
            code: true,
            checkedInAt: true,
            cancelledAt: true,
            refundedPence: true,
          },
        },
      },
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
      type:
        kindOf(t.ticketType) === "package"
          ? "Exhibitor package"
          : kindOf(t.ticketType) === "addon"
            ? "Extra exhibitor places"
            : t.priceType === "member"
              ? "Member ticket"
              : "Guest ticket",
      company: t.exhibitor?.companyName ?? t.packageTicket?.exhibitor?.companyName ?? null,
      ticketType: t.ticketType?.name ?? null,
      quantity: t.quantity,
      status: t.status === "paid" ? "Paid" : "Refunded",
      amount: t.amount,
      at: t.paidAt ?? t.createdAt,
      people: t.attendees ?? [],
    })),
    ...rsvps
      .filter((r) => !paidHolders.has(r.userId))
      .map<Attendee>((r) => ({
        key: `r:${r.userId}`,
        name: r.user.name,
        email: r.user.email ?? "",
        type: "RSVP",
        ticketType: null,
        quantity: 1,
        status: "Going",
        amount: null,
        at: r.createdAt,
        people: [],
      })),
  ];
}
