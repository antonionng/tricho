import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The ticket checkout route, with the database and Stripe mocked: ticket types
 * are priced, limited and checked for places inside the event's lock, and
 * events without types keep their flat prices.
 */

const m = vi.hoisted(() => ({
  auth: vi.fn(),
  membership: vi.fn(),
  event: vi.fn(),
  ticketCount: vi.fn(),
  ticketFindMany: vi.fn(),
  ticketCreate: vi.fn(),
  ticketUpdate: vi.fn(),
  ticketUpdateMany: vi.fn(),
  rsvpFindMany: vi.fn(),
  attendeeCreateMany: vi.fn(),
  lock: vi.fn(),
  checkout: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: () => m.auth() }));
vi.mock("@/lib/subscription", () => ({ getMembershipByEmail: (...a: unknown[]) => m.membership(...a) }));
vi.mock("@/lib/stripe", () => ({ stripe: { checkout: { sessions: { create: (...a: unknown[]) => m.checkout(...a) } } } }));
vi.mock("@/lib/prisma", () => {
  const eventTicket = {
    count: (...a: unknown[]) => m.ticketCount(...a),
    findMany: (...a: unknown[]) => m.ticketFindMany(...a),
    create: (...a: unknown[]) => m.ticketCreate(...a),
    update: (...a: unknown[]) => m.ticketUpdate(...a),
    updateMany: (...a: unknown[]) => m.ticketUpdateMany(...a),
  };
  const eventRsvp = { findMany: (...a: unknown[]) => m.rsvpFindMany(...a) };
  const eventAttendee = { createMany: (...a: unknown[]) => m.attendeeCreateMany(...a) };
  const tx = { eventTicket, eventRsvp, eventAttendee, $executeRaw: (...a: unknown[]) => m.lock(...a) };
  return {
    prisma: {
      event: { findFirst: (...a: unknown[]) => m.event(...a) },
      eventTicket,
      eventRsvp,
      $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
    },
  };
});

import { GET, POST } from "@/app/api/events/[id]/checkout/route";

const standard = {
  id: "tt_std",
  name: "Standard",
  description: "Full day, lunch included.",
  pricePence: 19900,
  memberPricePence: 14900,
  membersOnly: false,
  capacity: 10,
  salesStart: null,
  salesEnd: null,
  maxPerOrder: 6,
  active: true,
};

const baseEvent = {
  id: "evt_1",
  slug: "whittlebury-2027",
  title: "Whittlebury",
  startsAt: new Date(Date.now() + 90 * 86_400_000),
  timezone: "Europe/London",
  online: true,
  capacity: 200,
  priceGBP: 60,
  memberPriceGBP: 40,
  published: true,
  sellTickets: true,
  ticketTypes: [standard],
};

const params = { params: Promise.resolve({ id: "evt_1" }) };
const post = (body: unknown) => POST(new Request("http://x/api/events/evt_1/checkout", { method: "POST", body: JSON.stringify(body) }), params);

beforeEach(() => {
  Object.values(m).forEach((f) => f.mockReset());
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  m.auth.mockResolvedValue(null);
  m.event.mockResolvedValue(baseEvent);
  m.ticketCount.mockResolvedValue(0);
  m.ticketFindMany.mockResolvedValue([]);
  m.rsvpFindMany.mockResolvedValue([]);
  m.ticketUpdateMany.mockResolvedValue({ count: 0 });
  m.ticketCreate.mockResolvedValue({ id: "t_new" });
  m.ticketUpdate.mockResolvedValue({});
  m.checkout.mockResolvedValue({ id: "cs_1", url: "https://checkout.stripe.com/c/cs_1" });
});

describe("ticket checkout with ticket types", () => {
  it("lists each type with what this visitor pays and what is left", async () => {
    m.ticketFindMany.mockResolvedValue([{ quantity: 3, userId: null, ticketTypeId: "tt_std" }]);
    const res = await GET(new Request("http://x"), params);
    const body = await res.json();
    expect(body.types).toEqual([
      expect.objectContaining({ id: "tt_std", amountPence: 19900, state: "on_sale", left: 7, maxPerOrder: 6 }),
    ]);
  });

  it("holds the places, charges the type's price and turns on discount codes", async () => {
    const res = await post({ name: "Niamh Byrne", email: "niamh@example.com", ticketTypeId: "tt_std", quantity: 3 });
    expect(res.status).toBe(200);
    expect(m.lock).toHaveBeenCalled();
    expect(m.ticketCreate.mock.calls[0][0].data).toMatchObject({ ticketTypeId: "tt_std", quantity: 3, amount: 59700, priceType: "guest" });
    const session = m.checkout.mock.calls[0][0];
    expect(session.allow_promotion_codes).toBe(true);
    expect(session.line_items[0]).toMatchObject({ quantity: 3, price_data: { unit_amount: 19900, product_data: { description: "Standard" } } });
    expect(session.metadata).toMatchObject({ kind: "ticket", ticketId: "t_new", ticketTypeId: "tt_std" });
  });

  it("lets a signed-in member buy several at the member price", async () => {
    m.auth.mockResolvedValue({ user: { id: "u1", email: "member@example.com", name: "Aisling" } });
    m.membership.mockResolvedValue({ isActive: true });
    m.ticketCount.mockResolvedValue(1); // already holds a ticket: fine with types
    const res = await post({ ticketTypeId: "tt_std", quantity: 4 });
    expect(res.status).toBe(200);
    expect(m.ticketCreate.mock.calls[0][0].data).toMatchObject({ quantity: 4, amount: 59600, priceType: "member", userId: "u1" });
  });

  it("refuses more than the type has left, checked inside the lock", async () => {
    m.ticketFindMany.mockResolvedValue([{ quantity: 8, userId: null, ticketTypeId: "tt_std" }]);
    const res = await post({ name: "Niamh", email: "niamh@example.com", ticketTypeId: "tt_std", quantity: 3 });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Only 2 Standard tickets are left.");
    expect(m.lock).toHaveBeenCalled();
    expect(m.ticketCreate).not.toHaveBeenCalled();
  });

  it("refuses when the event's total is full even if the type has room", async () => {
    m.event.mockResolvedValue({ ...baseEvent, capacity: 5 });
    m.ticketFindMany.mockResolvedValue([{ quantity: 5, userId: null, ticketTypeId: "tt_other" }]);
    const res = await post({ name: "Niamh", email: "niamh@example.com", ticketTypeId: "tt_std", quantity: 1 });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Standard tickets are sold out.");
  });

  it("refuses a type outside its sales window or kept for members", async () => {
    m.event.mockResolvedValue({ ...baseEvent, ticketTypes: [{ ...standard, salesEnd: new Date(Date.now() - 1000) }] });
    let res = await post({ name: "Niamh", email: "niamh@example.com", ticketTypeId: "tt_std" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Standard tickets are no longer on sale.");

    m.event.mockResolvedValue({ ...baseEvent, ticketTypes: [{ ...standard, membersOnly: true }] });
    res = await post({ name: "Niamh", email: "niamh@example.com", ticketTypeId: "tt_std" });
    expect(res.status).toBe(403);
  });

  it("asks for a type when the event sells types", async () => {
    const res = await post({ name: "Niamh", email: "niamh@example.com" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Please choose a ticket type.");
  });
});

describe("ticket checkout without types", () => {
  beforeEach(() => m.event.mockResolvedValue({ ...baseEvent, ticketTypes: [] }));

  it("keeps the flat guest price and the four-ticket limit", async () => {
    const res = await post({ name: "Niamh", email: "niamh@example.com", quantity: 9 });
    expect(res.status).toBe(200);
    expect(m.ticketCreate.mock.calls[0][0].data).toMatchObject({ quantity: 4, amount: 24000, priceType: "guest", ticketTypeId: null });
    expect(m.checkout.mock.calls[0][0].line_items[0].price_data.product_data.description).toBe("Guest ticket");
  });

  it("still sells a member only one ticket", async () => {
    m.auth.mockResolvedValue({ user: { id: "u1", email: "member@example.com", name: "Aisling" } });
    m.membership.mockResolvedValue({ isActive: true });
    m.ticketCount.mockResolvedValue(1);
    const res = await post({ quantity: 2 });
    expect(res.status).toBe(409);
  });
});

describe("in-person checkout", () => {
  beforeEach(() => m.event.mockResolvedValue({ ...baseEvent, online: false }));

  it("asks for one named attendee per place", async () => {
    const res = await post({ name: "Niamh", email: "niamh@example.com", ticketTypeId: "tt_std", quantity: 2, attendees: [{ isBuyer: true }] });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Please give a name for each of the 2 places.");
    expect(m.lock).not.toHaveBeenCalled();
  });

  it("stores the attendees with the pending order, each with their own code", async () => {
    m.attendeeCreateMany.mockResolvedValue({ count: 2 });
    const res = await post({
      name: "Niamh Byrne",
      email: "niamh@example.com",
      ticketTypeId: "tt_std",
      quantity: 2,
      attendees: [
        { isBuyer: true, dietary: "Vegetarian" },
        { name: "Aisling Murphy", email: "", accessNeeds: "Step-free access" },
      ],
    });
    expect(res.status).toBe(200);
    const rows = m.attendeeCreateMany.mock.calls[0][0].data;
    expect(rows).toEqual([
      expect.objectContaining({ name: "Niamh Byrne", email: "niamh@example.com", dietary: "Vegetarian", isBuyer: true, ticketId: "t_new", eventId: "evt_1" }),
      // A blank email sends the e-ticket to the buyer.
      expect.objectContaining({ name: "Aisling Murphy", email: "niamh@example.com", accessNeeds: "Step-free access", isBuyer: false }),
    ]);
    expect(rows[0].code).not.toBe(rows[1].code);
    // Names never travel in the Stripe URLs.
    const session = m.checkout.mock.calls[0][0];
    expect(session.success_url).not.toContain("Aisling");
  });

  it("says when a quote is for an in-person event", async () => {
    const body = await (await GET(new Request("http://x"), params)).json();
    expect(body.inPerson).toBe(true);
  });
});
