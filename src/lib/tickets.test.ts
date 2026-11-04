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
    eventRsvp: {
      createMany: (...a: unknown[]) => db.rsvpCreateMany(...a),
      deleteMany: (...a: unknown[]) => db.rsvpDeleteMany(...a),
    },
  },
}));
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
    expect(update.where).toEqual({ id: "t1", status: { in: ["pending", "cancelled"] } });
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

  it("does nothing for payments that are not tickets", async () => {
    db.findMany.mockResolvedValue([]);
    const r = await handleTicketRefund("pi_other");
    expect(r).toEqual({ ok: false, reason: "not-a-ticket" });
  });
});
