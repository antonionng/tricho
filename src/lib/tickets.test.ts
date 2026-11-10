import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  rsvpCreateMany: vi.fn(),
  rsvpDeleteMany: vi.fn(),
  deliverOnce: vi.fn(),
  alertOwners: vi.fn(),
  attendeeFindMany: vi.fn(),
  attendeeFindUnique: vi.fn(),
  attendeeCreateMany: vi.fn(),
  attendeeUpdateMany: vi.fn(),
  attendeeUpdate: vi.fn(),
  refundCreate: vi.fn(),
  typeFindFirst: vi.fn(),
};

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    eventTicket: {
      findUnique: (...a: unknown[]) => db.findUnique(...a),
      updateMany: (...a: unknown[]) => db.updateMany(...a),
      findMany: (...a: unknown[]) => db.findMany(...a),
      count: (...a: unknown[]) => db.count(...a),
    },
    eventTicketType: { findFirst: (...a: unknown[]) => db.typeFindFirst(...a) },
    eventRsvp: {
      createMany: (...a: unknown[]) => db.rsvpCreateMany(...a),
      deleteMany: (...a: unknown[]) => db.rsvpDeleteMany(...a),
    },
    eventAttendee: {
      findMany: (...a: unknown[]) => db.attendeeFindMany(...a),
      findUnique: (...a: unknown[]) => db.attendeeFindUnique(...a),
      createMany: (...a: unknown[]) => db.attendeeCreateMany(...a),
      updateMany: (...a: unknown[]) => db.attendeeUpdateMany(...a),
      update: (...a: unknown[]) => db.attendeeUpdate(...a),
    },
  },
}));
vi.mock("@/lib/stripe", () => ({ stripe: { refunds: { create: (...a: unknown[]) => db.refundCreate(...a) } } }));
vi.mock("@/lib/mail/send", () => ({
  deliverOnce: (...a: unknown[]) => db.deliverOnce(...a),
  alertOwners: (...a: unknown[]) => db.alertOwners(...a),
}));

import type Stripe from "stripe";
import {
  clampQuantity,
  clampTypeQuantity,
  guestDetails,
  handleTicketCheckoutCompleted,
  handleTicketRefund,
  refundAttendee,
  seatsLeft,
  ticketLineName,
  ticketPrice,
  typeAvailability,
  typePrice,
  typeSeatsTaken,
  type TicketTypeRule,
} from "./tickets";

describe("ticketPrice", () => {
  const event = { priceGBP: 60, memberPriceGBP: 40 };
  it("charges members the member price and everyone else the guest price, in pence", () => {
    expect(ticketPrice(event, true)).toEqual({ amountPence: 4000, priceType: "member" });
    expect(ticketPrice(event, false)).toEqual({ amountPence: 6000, priceType: "guest" });
  });
  it("returns zero when the event is free for that buyer", () => {
    expect(ticketPrice({ priceGBP: 20, memberPriceGBP: 0 }, true).amountPence).toBe(0);
    expect(ticketPrice({ priceGBP: -5, memberPriceGBP: 0 }, false).amountPence).toBe(0);
  });
});

describe("clampQuantity", () => {
  it("lets guests buy one to four and members one", () => {
    expect(clampQuantity(3, false)).toBe(3);
    expect(clampQuantity(9, false)).toBe(4);
    expect(clampQuantity(0, false)).toBe(1);
    expect(clampQuantity("abc", false)).toBe(1);
    expect(clampQuantity(3, true)).toBe(1);
  });
});

describe("seatsLeft", () => {
  it("is unlimited without a capacity", () => {
    expect(seatsLeft({ capacity: null }, [{ quantity: 3, userId: null }], [])).toBeNull();
  });
  it("counts ticket quantities and RSVPs, without counting a paying member twice", () => {
    const tickets = [
      { quantity: 3, userId: null },
      { quantity: 1, userId: "u1" },
    ];
    const rsvps = [{ userId: "u1" }, { userId: "u2" }];
    expect(seatsLeft({ capacity: 10 }, tickets, rsvps)).toBe(5);
  });
  it("never goes below zero", () => {
    expect(seatsLeft({ capacity: 2 }, [{ quantity: 4, userId: null }], [])).toBe(0);
  });
});

const earlyBird: TicketTypeRule = {
  id: "tt_early",
  name: "Early bird",
  pricePence: 14900,
  memberPricePence: 9900,
  membersOnly: false,
  capacity: 50,
  salesStart: null,
  salesEnd: new Date("2027-01-31T23:59:00Z"),
  maxPerOrder: 6,
  active: true,
};

describe("ticket types", () => {
  const startsAt = new Date("2027-04-26T08:00:00Z");
  const now = new Date("2026-12-01T12:00:00Z");

  it("charges members the member price when the type has one", () => {
    expect(typePrice(earlyBird, true)).toEqual({ amountPence: 9900, priceType: "member" });
    expect(typePrice(earlyBird, false)).toEqual({ amountPence: 14900, priceType: "guest" });
    expect(typePrice({ ...earlyBird, memberPricePence: null }, true)).toEqual({ amountPence: 14900, priceType: "guest" });
  });

  it("lets anyone, members included, buy up to the type's maximum", () => {
    expect(clampTypeQuantity(5, earlyBird)).toBe(5);
    expect(clampTypeQuantity(9, earlyBird)).toBe(6);
    expect(clampTypeQuantity("x", earlyBird)).toBe(1);
    expect(clampTypeQuantity(3, { maxPerOrder: 0 })).toBe(1);
  });

  it("counts only places of the same type", () => {
    const tickets = [
      { quantity: 2, ticketTypeId: "tt_early" },
      { quantity: 3, ticketTypeId: "tt_standard" },
      { quantity: 1, ticketTypeId: "tt_early" },
      { quantity: 4, ticketTypeId: null },
    ];
    expect(typeSeatsTaken("tt_early", tickets)).toBe(3);
  });

  it("is on sale with the smaller of the type's and the event's places left", () => {
    expect(typeAvailability(earlyBird, { now, eventStartsAt: startsAt, taken: 10, eventLeft: 100, isMember: false })).toEqual({ state: "on_sale", left: 40, opensAt: null });
    expect(typeAvailability(earlyBird, { now, eventStartsAt: startsAt, taken: 10, eventLeft: 5, isMember: false }).left).toBe(5);
    expect(typeAvailability({ ...earlyBird, capacity: null }, { now, eventStartsAt: startsAt, taken: 10, eventLeft: null, isMember: false }).left).toBeNull();
  });

  it("is sold out when either the type or the event is full", () => {
    expect(typeAvailability(earlyBird, { now, eventStartsAt: startsAt, taken: 50, eventLeft: 100, isMember: false }).state).toBe("sold_out");
    expect(typeAvailability(earlyBird, { now, eventStartsAt: startsAt, taken: 0, eventLeft: 0, isMember: false }).state).toBe("sold_out");
  });

  it("follows the sales window and the event start", () => {
    const later = { ...earlyBird, salesStart: new Date("2027-02-01T09:00:00Z") };
    expect(typeAvailability(later, { now, eventStartsAt: startsAt, taken: 0, eventLeft: null, isMember: false })).toMatchObject({
      state: "not_yet",
      opensAt: later.salesStart,
    });
    const after = new Date("2027-02-01T00:00:00Z");
    expect(typeAvailability(earlyBird, { now: after, eventStartsAt: startsAt, taken: 0, eventLeft: null, isMember: false }).state).toBe("closed");
    const open = { ...earlyBird, salesEnd: null };
    expect(typeAvailability(open, { now: startsAt, eventStartsAt: startsAt, taken: 0, eventLeft: null, isMember: false }).state).toBe("closed");
    expect(typeAvailability({ ...earlyBird, active: false }, { now, eventStartsAt: startsAt, taken: 0, eventLeft: null, isMember: false }).state).toBe("closed");
  });

  it("keeps members-only types from guests", () => {
    const members = { ...earlyBird, membersOnly: true };
    expect(typeAvailability(members, { now, eventStartsAt: startsAt, taken: 0, eventLeft: null, isMember: false }).state).toBe("members_only");
    expect(typeAvailability(members, { now, eventStartsAt: startsAt, taken: 0, eventLeft: null, isMember: true }).state).toBe("on_sale");
  });
});

describe("guestDetails", () => {
  it("normalises a valid name and email", () => {
    expect(guestDetails({ name: "  Niamh   Byrne ", email: " Niamh@Example.com " })).toEqual({ ok: true, name: "Niamh Byrne", email: "niamh@example.com" });
  });
  it("asks for a name and a usable email", () => {
    expect(guestDetails({ name: "", email: "a@b.co" }).ok).toBe(false);
    expect(guestDetails({ name: "Niamh", email: "not-an-email" }).ok).toBe(false);
  });
});

describe("ticketLineName", () => {
  it("names the event and its date", () => {
    expect(ticketLineName({ title: "Scalp masterclass", startsAt: new Date("2026-11-12T19:00:00Z") })).toBe(
      "Scalp masterclass, Thursday 12 November 2026"
    );
  });
  it("uses the event's own time zone for the date", () => {
    // 23:30 UTC is already the next day in a zone ahead of UTC.
    const late = new Date("2027-04-25T23:30:00Z");
    expect(ticketLineName({ title: "Whittlebury", startsAt: late })).toBe("Whittlebury, Monday 26 April 2027");
    expect(ticketLineName({ title: "Whittlebury", startsAt: late, timezone: "America/New_York" })).toBe("Whittlebury, Sunday 25 April 2027");
  });
});

const ticket = {
  id: "t1",
  eventId: "e1",
  userId: "u1",
  email: "niamh@example.com",
  name: "Niamh Byrne",
  quantity: 1,
  amount: 4000,
  currency: "gbp",
  priceType: "member",
  status: "pending",
  event: {
    id: "e1",
    slug: "scalp-masterclass",
    title: "Scalp masterclass",
    summary: "A practical evening.",
    startsAt: new Date("2026-11-12T19:00:00Z"),
    endsAt: null,
    online: true,
    venue: null,
    city: null,
    ticketUrl: null,
  },
};

const session = {
  id: "cs_1",
  mode: "payment",
  payment_status: "paid",
  payment_intent: "pi_1",
  amount_total: 4000,
  currency: "gbp",
  metadata: { kind: "ticket", ticketId: "t1", eventId: "e1" },
} as unknown as Stripe.Checkout.Session;

describe("handleTicketCheckoutCompleted", () => {
  beforeEach(() => {
    Object.values(db).forEach((f) => f.mockReset());
    db.findUnique.mockResolvedValue(ticket);
    db.updateMany.mockResolvedValue({ count: 1 });
    db.rsvpCreateMany.mockResolvedValue({ count: 1 });
    db.deliverOnce.mockResolvedValue(true);
  });

  it("marks the ticket paid, saves the RSVP and sends one confirmation", async () => {
    const r = await handleTicketCheckoutCompleted(session);
    expect(r).toMatchObject({ ok: true, already: false });
    const update = db.updateMany.mock.calls[0][0];
    // A lapsed hold is honoured, but an order cancelled after payment is never brought back.
    expect(update.where).toEqual({ id: "t1", OR: [{ status: "pending" }, { status: "cancelled", paidAt: null }] });
    expect(update.data).toMatchObject({ status: "paid", stripePaymentIntentId: "pi_1", amount: 4000 });
    expect(db.rsvpCreateMany).toHaveBeenCalledWith({ data: [{ eventId: "e1", userId: "u1" }], skipDuplicates: true });
    const [ref, to, subject] = db.deliverOnce.mock.calls[0];
    expect(ref).toBe("ticket-confirmed:t1");
    expect(to).toBe("niamh@example.com");
    expect(subject).toContain("Scalp masterclass");
    // The team is told about the sale.
    expect(db.alertOwners).toHaveBeenCalledTimes(1);
    expect(db.alertOwners.mock.calls[0][0].subject).toContain("Ticket sold");
  });

  it("is idempotent: a retried event changes nothing and the email is deduplicated by ref", async () => {
    db.updateMany.mockResolvedValue({ count: 0 });
    const r = await handleTicketCheckoutCompleted(session);
    expect(r).toMatchObject({ ok: true, already: true });
    expect(db.deliverOnce.mock.calls[0][0]).toBe("ticket-confirmed:t1");
    // A retried event never alerts the team twice.
    expect(db.alertOwners).not.toHaveBeenCalled();
  });

  it("does not create an RSVP for a guest", async () => {
    db.findUnique.mockResolvedValue({ ...ticket, userId: null, priceType: "guest" });
    await handleTicketCheckoutCompleted(session);
    expect(db.rsvpCreateMany).not.toHaveBeenCalled();
  });

  it("confirms an order a 100% discount code left with nothing to pay", async () => {
    const free = { ...session, payment_status: "no_payment_required", payment_intent: null, amount_total: 0 } as unknown as Stripe.Checkout.Session;
    const r = await handleTicketCheckoutCompleted(free);
    expect(r).toMatchObject({ ok: true, already: false });
    const update = db.updateMany.mock.calls[0][0];
    expect(update.data).toMatchObject({ status: "paid", amount: 0 });
    expect(update.data.stripePaymentIntentId).toBeUndefined();
    expect(db.deliverOnce.mock.calls[0][0]).toBe("ticket-confirmed:t1");
  });

  it("ignores sessions that are not paid", async () => {
    const r = await handleTicketCheckoutCompleted({ ...session, payment_status: "unpaid" } as Stripe.Checkout.Session);
    expect(r.ok).toBe(false);
    expect(db.updateMany).not.toHaveBeenCalled();
  });
});

describe("handleTicketRefund", () => {
  beforeEach(() => {
    Object.values(db).forEach((f) => f.mockReset());
    db.findMany.mockResolvedValue([{ id: "t1", eventId: "e1", userId: "u1", event: { slug: "scalp-masterclass" } }]);
    db.updateMany.mockResolvedValue({ count: 1 });
    db.count.mockResolvedValue(0);
    db.rsvpDeleteMany.mockResolvedValue({ count: 1 });
    db.attendeeUpdateMany.mockResolvedValue({ count: 2 });
  });

  it("cancels every attendee on a fully refunded order", async () => {
    await handleTicketRefund("pi_1");
    expect(db.attendeeUpdateMany.mock.calls[0][0]).toMatchObject({ where: { ticketId: { in: ["t1"] }, cancelledAt: null } });
    expect(db.attendeeUpdateMany.mock.calls[0][0].data.cancelledAt).toBeInstanceOf(Date);
  });

  it("marks a fully refunded charge's ticket refunded and frees the RSVP", async () => {
    const charge = { object: "charge", id: "ch_1", refunded: true, payment_intent: "pi_1" } as unknown as Stripe.Charge;
    const r = await handleTicketRefund(charge);
    expect(r).toEqual({ ok: true, count: 1 });
    expect(db.findMany.mock.calls[0][0].where.stripePaymentIntentId).toBe("pi_1");
    expect(db.updateMany.mock.calls[0][0].data).toEqual({ status: "refunded" });
    expect(db.rsvpDeleteMany).toHaveBeenCalledWith({ where: { eventId: "e1", userId: "u1" } });
  });

  it("leaves a partially refunded ticket paid", async () => {
    const charge = { object: "charge", id: "ch_1", refunded: false, payment_intent: "pi_1" } as unknown as Stripe.Charge;
    const r = await handleTicketRefund(charge);
    expect(r.ok).toBe(false);
    expect(db.updateMany).not.toHaveBeenCalled();
  });

  it("cancels a refunded package's extra places, without refunding them, and tells the owners", async () => {
    db.findMany
      .mockResolvedValueOnce([
        {
          id: "t_pkg",
          eventId: "e1",
          userId: null,
          event: { slug: "whittlebury-2027", title: "Whittlebury" },
          ticketType: { kind: "package", name: "Evolve" },
          exhibitor: { companyName: "Follicle Labs" },
        },
      ])
      .mockResolvedValueOnce([
        { id: "x1", status: "paid", amount: 20_000, currency: "gbp", stripePaymentIntentId: "pi_x1", attendees: [{ id: "a1" }, { id: "a2" }] },
        { id: "x2", status: "paid", amount: 10_000, currency: "gbp", stripePaymentIntentId: "pi_x2", attendees: [{ id: "a3" }] },
      ]);
    await handleTicketRefund("pi_pkg");
    expect(db.findMany.mock.calls[1][0].where).toEqual({ packageTicketId: "t_pkg", status: { in: ["paid", "pending"] } });
    expect(db.updateMany).toHaveBeenCalledWith({ where: { id: { in: ["x1", "x2"] } }, data: { status: "cancelled" } });
    expect(db.attendeeUpdateMany.mock.calls.at(-1)![0].where).toEqual({ ticketId: { in: ["x1", "x2"] }, cancelledAt: null });
    expect(db.refundCreate).not.toHaveBeenCalled();
    expect(db.alertOwners).toHaveBeenCalledTimes(1);
    const alert = db.alertOwners.mock.calls[0][0];
    expect(alert.heading).toContain("3 extra places were also cancelled; refund them in Stripe");
    expect(alert.facts).toContainEqual(["Payment 1", "£200.00 (pi_x1)"]);
  });

  it("does nothing for payments that are not tickets", async () => {
    db.findMany.mockResolvedValue([]);
    const r = await handleTicketRefund("pi_other");
    expect(r).toEqual({ ok: false, reason: "not-a-ticket" });
  });
});

const inPersonTicket = {
  ...ticket,
  userId: null,
  priceType: "guest",
  quantity: 2,
  amount: 29800,
  ticketType: { name: "Early bird" },
  event: {
    ...ticket.event,
    slug: "whittlebury-2027",
    title: "Whittlebury",
    online: false,
    venue: "Whittlebury Hall",
    venueAddress: "Whittlebury, Towcester NN12 8QH",
    timezone: "Europe/London",
    startsAt: new Date("2027-04-26T08:00:00Z"),
    detailsCloseAt: null,
  },
};

const person = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  name: `Person ${id}`,
  email: `${id}@example.com`,
  code: `CODE${id.toUpperCase()}XXXXXXXX`,
  dietary: null,
  accessNeeds: null,
  isBuyer: false,
  cancelledAt: null,
  ...over,
});

describe("in-person orders", () => {
  beforeEach(() => {
    Object.values(db).forEach((f) => f.mockReset());
    db.findUnique.mockResolvedValue(inPersonTicket);
    db.updateMany.mockResolvedValue({ count: 1 });
    db.deliverOnce.mockResolvedValue(true);
  });

  it("sends each attendee their own e-ticket with the QR code inline, and the buyer a receipt listing everyone", async () => {
    db.attendeeFindMany.mockResolvedValue([person("a1", { isBuyer: true, email: "niamh@example.com" }), person("a2")]);
    await handleTicketCheckoutCompleted(session);
    const refs = db.deliverOnce.mock.calls.map((c) => c[0]);
    expect(refs).toEqual(["ticket-confirmed:t1", "ticket-attendee:a1", "ticket-attendee:a2"]);
    const receipt = db.deliverOnce.mock.calls[0][3];
    expect(receipt.facts).toContainEqual(["Attendees", "Person a1 (niamh@example.com)\nPerson a2 (a2@example.com)"]);
    const [, to, subject, content, opts] = db.deliverOnce.mock.calls[2];
    expect(to).toBe("a2@example.com");
    expect(subject).toBe("Your e-ticket for Whittlebury");
    expect(content.ticket).toMatchObject({ contentId: "ticket-qr", code: "CODEA2XXXXXXXX" });
    expect(content.body).toContain("Niamh Byrne has booked you a place");
    expect(content.cta.href).toBe("/events/whittlebury-2027/ticket/CODEA2XXXXXXXX");
    expect(opts.attachments[0]).toMatchObject({ contentId: "ticket-qr", filename: "ticket-CODEA2XXXXXXXX.png" });
    expect(Buffer.from(opts.attachments[0].content, "base64").subarray(1, 4).toString()).toBe("PNG");
  });

  it("names the places from the buyer when an order has no attendees yet", async () => {
    db.attendeeFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([person("a1"), person("a2")]);
    db.attendeeCreateMany.mockResolvedValue({ count: 2 });
    await handleTicketCheckoutCompleted(session);
    const rows = db.attendeeCreateMany.mock.calls[0][0].data;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: "Niamh Byrne", email: "niamh@example.com", isBuyer: true, ticketId: "t1", eventId: "e1" });
    expect(rows[0].code).toMatch(/^[2-9A-Z]{16}$/);
  });

  it("does not send e-tickets for cancelled places", async () => {
    db.attendeeFindMany.mockResolvedValue([person("a1"), person("a2", { cancelledAt: new Date() })]);
    await handleTicketCheckoutCompleted(session);
    expect(db.deliverOnce.mock.calls.map((c) => c[0])).toEqual(["ticket-confirmed:t1", "ticket-attendee:a1"]);
  });

  it("leaves online orders without attendees", async () => {
    db.findUnique.mockResolvedValue(ticket);
    db.rsvpCreateMany.mockResolvedValue({ count: 1 });
    await handleTicketCheckoutCompleted(session);
    expect(db.attendeeFindMany).not.toHaveBeenCalled();
    expect(db.deliverOnce).toHaveBeenCalledTimes(1);
  });
});

describe("refundAttendee", () => {
  const order = (over: Record<string, unknown> = {}) => ({
    id: "a2",
    name: "Person a2",
    cancelledAt: null,
    ticket: {
      id: "t1",
      eventId: "e1",
      userId: null,
      status: "paid",
      amount: 10000,
      quantity: 3,
      stripePaymentIntentId: "pi_1",
      event: { slug: "whittlebury-2027" },
      attendees: [
        { id: "a1", cancelledAt: null, refundedPence: null },
        { id: "a2", cancelledAt: null, refundedPence: null },
        { id: "a3", cancelledAt: null, refundedPence: null },
      ],
      ...over,
    },
  });

  beforeEach(() => {
    Object.values(db).forEach((f) => f.mockReset());
    db.attendeeUpdateMany.mockResolvedValue({ count: 1 });
    db.attendeeUpdate.mockResolvedValue({});
    db.updateMany.mockResolvedValue({ count: 1 });
    db.refundCreate.mockResolvedValue({ id: "re_1" });
  });

  it("claims the place, refunds its share through Stripe once, and keeps the order open", async () => {
    db.attendeeFindUnique.mockResolvedValue(order());
    const r = await refundAttendee("a2");
    expect(r).toEqual({ ok: true, amount: 3333, orderClosed: false, name: "Person a2" });
    expect(db.attendeeUpdateMany.mock.calls[0][0]).toMatchObject({ where: { id: "a2", cancelledAt: null }, data: { refundedPence: 3333 } });
    const [params, opts] = db.refundCreate.mock.calls[0];
    expect(params).toMatchObject({ payment_intent: "pi_1", amount: 3333, metadata: { kind: "ticket", attendeeId: "a2" } });
    expect(opts).toEqual({ idempotencyKey: "ticket-attendee-refund:a2" });
    expect(db.attendeeUpdate).toHaveBeenCalledWith({ where: { id: "a2" }, data: { stripeRefundId: "re_1" } });
    expect(db.updateMany).not.toHaveBeenCalled();
  });

  it("gives the last place whatever is left and closes the order", async () => {
    db.attendeeFindUnique.mockResolvedValue(
      order({
        attendees: [
          { id: "a1", cancelledAt: new Date(), refundedPence: 3333 },
          { id: "a2", cancelledAt: null, refundedPence: null },
          { id: "a3", cancelledAt: new Date(), refundedPence: 3333 },
        ],
      })
    );
    const r = await refundAttendee("a2");
    expect(r).toMatchObject({ ok: true, amount: 3334, orderClosed: true });
    expect(db.updateMany.mock.calls[0][0]).toEqual({ where: { id: "t1", status: "paid" }, data: { status: "refunded" } });
  });

  it("puts the place back when Stripe refuses", async () => {
    db.attendeeFindUnique.mockResolvedValue(order());
    db.refundCreate.mockRejectedValue(new Error("charge already refunded"));
    const r = await refundAttendee("a2");
    expect(r).toEqual({ ok: false, error: "Stripe could not make the refund: charge already refunded" });
    expect(db.attendeeUpdate).toHaveBeenCalledWith({ where: { id: "a2" }, data: { cancelledAt: null, refundedPence: null } });
  });

  it("never refunds twice", async () => {
    db.attendeeFindUnique.mockResolvedValue(order());
    db.attendeeUpdateMany.mockResolvedValue({ count: 0 });
    const r = await refundAttendee("a2");
    expect(r.ok).toBe(false);
    expect(db.refundCreate).not.toHaveBeenCalled();
    db.attendeeFindUnique.mockResolvedValue({ ...order(), cancelledAt: new Date() });
    expect((await refundAttendee("a2")).ok).toBe(false);
  });

  it("never refunds a place included in a package on its own", async () => {
    db.attendeeFindUnique.mockResolvedValue(order({ ticketType: { kind: "package" }, quantity: 1, amount: 75_000 }));
    const r = await refundAttendee("a2");
    expect(r.ok).toBe(false);
    expect(db.attendeeUpdateMany).not.toHaveBeenCalled();
    expect(db.refundCreate).not.toHaveBeenCalled();
  });

  it("only refunds places on paid orders", async () => {
    db.attendeeFindUnique.mockResolvedValue(order({ status: "refunded" }));
    expect(await refundAttendee("a2")).toEqual({ ok: false, error: "Only a place on a paid order can be refunded." });
  });
});

describe("paid exhibitor packages", () => {
  const packageTicket = {
    ...inPersonTicket,
    email: "sam@follicle.example",
    name: "Sam Patel",
    quantity: 1,
    amount: 75_000,
    ticketTypeId: "tt_evolve",
    ticketType: { name: "Evolve", kind: "package", placesIncluded: 3, includesStand: true, includesStageSlot: true, description: "A stand space with priority positioning." },
    exhibitor: { companyName: "Follicle Labs", contactName: "Sam Patel", manageCode: "MANAGE2345678ABC", vatNumber: "GB123456789" },
  };
  const packageSession = { ...session, amount_total: 75_000 } as Stripe.Checkout.Session;

  beforeEach(() => {
    Object.values(db).forEach((f) => f.mockReset());
    db.findUnique.mockResolvedValue(packageTicket);
    db.updateMany.mockResolvedValue({ count: 1 });
    db.deliverOnce.mockResolvedValue(true);
    db.typeFindFirst.mockResolvedValue({ name: "Extra exhibitor ticket", pricePence: 10_000, maxPerOrder: 5 });
    db.attendeeFindMany.mockResolvedValue([
      person("a1", { name: "Sam Patel", email: "sam@follicle.example", awaitingName: false }),
      person("a2", { name: "Follicle Labs, place 2", email: "sam@follicle.example", awaitingName: true }),
      person("a3", { name: "Follicle Labs, place 3", email: "sam@follicle.example", awaitingName: true }),
    ]);
  });

  it("sends the package confirmation, e-tickets only for named places, and one owner alert", async () => {
    const r = await handleTicketCheckoutCompleted(packageSession);
    expect(r).toMatchObject({ ok: true, already: false });
    // Package places are never invented from the buyer: they were created at checkout.
    expect(db.attendeeCreateMany).not.toHaveBeenCalled();
    expect(db.rsvpCreateMany).not.toHaveBeenCalled();
    expect(db.deliverOnce.mock.calls.map((c) => c[0])).toEqual(["package-confirmed:t1", "ticket-attendee:a1"]);
    const [, to, subject, content] = db.deliverOnce.mock.calls[0];
    expect(to).toBe("sam@follicle.example");
    expect(subject).toBe("Your Evolve package for Whittlebury is confirmed");
    expect(content.cta).toEqual({ label: "Open your exhibitor page", href: "/events/whittlebury-2027/exhibitor/MANAGE2345678ABC" });
    expect(content.facts).toContainEqual(["Package code", "MANAGE2345678ABC"]);
    expect(content.body).toContain("2 of your 3 places are still to be named");
    expect(content.body).toContain("up to 5 extra places for your team at £100.00 each");
    expect(content.body).toContain("- 3 delegate places, each with its own e-ticket.\n- A slot on the main stage.");
    expect(db.typeFindFirst.mock.calls[0][0].where).toMatchObject({ kind: "addon", active: true, addonForTypeIds: { has: "tt_evolve" } });
    expect(db.alertOwners).toHaveBeenCalledTimes(1);
    expect(db.alertOwners.mock.calls[0][0]).toMatchObject({ subject: "Package sold: Evolve to Follicle Labs, £750.00" });
  });

  it("leaves out the extra places when the package is not offered them", async () => {
    db.typeFindFirst.mockResolvedValue(null);
    await handleTicketCheckoutCompleted(packageSession);
    expect(db.deliverOnce.mock.calls[0][3].body).not.toContain("extra places");
  });

  it("does not alert the team twice for a retried event", async () => {
    db.updateMany.mockResolvedValue({ count: 0 });
    await handleTicketCheckoutCompleted(packageSession);
    expect(db.alertOwners).not.toHaveBeenCalled();
  });
});
