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
  guestDetails,
  handleTicketCheckoutCompleted,
  handleTicketRefund,
  seatsLeft,
  ticketLineName,
  ticketPrice,
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
