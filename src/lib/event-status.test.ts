import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/mail/send", () => ({ deliverOnce: vi.fn() }));

const { appBookingMode, bookingMode, memberEventStatus } = await import("./event-status");

const now = new Date("2026-10-10T12:00:00Z");
const base = {
  startsAt: new Date("2026-10-20T18:00:00Z"),
  endsAt: new Date("2026-10-20T19:00:00Z"),
  online: true,
  capacity: null as number | null,
  sellTickets: false,
  joinUrl: "https://meet.google.com/abc-defg-hij",
  rsvps: [] as { userId: string }[],
  tickets: [] as { quantity: number; userId: string | null; status: string }[],
};

describe("memberEventStatus", () => {
  it("keeps the joining link from members who are not going", () => {
    const s = memberEventStatus(base, "u1", now);
    expect(s).toMatchObject({ going: false, attending: false, joinUrl: null, started: false, past: false, full: false, left: null });
  });

  it("gives the joining link to members going to an online event", () => {
    const s = memberEventStatus({ ...base, rsvps: [{ userId: "u1" }] }, "u1", now);
    expect(s.attending).toBe(true);
    expect(s.joinUrl).toBe(base.joinUrl);
  });

  it("gives the joining link to ticket holders, but never for an in-person event", () => {
    const tickets = [{ quantity: 1, userId: "u1", status: "paid" }];
    expect(memberEventStatus({ ...base, tickets }, "u1", now)).toMatchObject({ hasTicket: true, joinUrl: base.joinUrl });
    expect(memberEventStatus({ ...base, online: false, tickets }, "u1", now).joinUrl).toBeNull();
  });

  it("counts free places against capacity, and seats when tickets are sold", () => {
    expect(memberEventStatus({ ...base, capacity: 1, rsvps: [{ userId: "u2" }] }, "u1", now).full).toBe(true);
    const sold = memberEventStatus(
      { ...base, sellTickets: true, capacity: 3, tickets: [{ quantity: 2, userId: null, status: "paid" }] },
      "u1",
      now
    );
    expect(sold).toMatchObject({ left: 1, full: false });
  });

  it("knows when an event has started and when it has finished", () => {
    const later = new Date("2026-10-20T18:30:00Z");
    expect(memberEventStatus(base, "u1", later)).toMatchObject({ started: true, past: false });
    expect(memberEventStatus(base, "u1", new Date("2026-10-21T00:00:00Z"))).toMatchObject({ started: true, past: true });
  });
});

describe("bookingMode", () => {
  const free = { memberPriceGBP: 0, sellTickets: false, ticketUrl: null };
  const s = { hasTicket: false, started: false, going: false, full: false };

  it("matches the website's buttons", () => {
    expect(bookingMode(free, s)).toBe("rsvp");
    expect(bookingMode(free, { ...s, going: true })).toBe("rsvp");
    expect(bookingMode(free, { ...s, full: true })).toBe("full");
    expect(bookingMode(free, { ...s, full: true, going: true })).toBe("rsvp");
    expect(bookingMode(free, { ...s, hasTicket: true })).toBe("none");
    expect(bookingMode(free, { ...s, started: true })).toBe("started");
    expect(bookingMode(free, { ...s, started: true, going: true })).toBe("none");
    expect(bookingMode({ memberPriceGBP: 20, sellTickets: true, ticketUrl: null }, s)).toBe("buy");
    expect(bookingMode({ memberPriceGBP: 20, sellTickets: true, ticketUrl: null }, { ...s, full: true })).toBe("sold_out");
    expect(bookingMode({ memberPriceGBP: 20, sellTickets: false, ticketUrl: "https://example.com" }, s)).toBe("external");
    expect(bookingMode({ memberPriceGBP: 0, sellTickets: true, ticketUrl: null }, s)).toBe("rsvp");
  });
});

describe("appBookingMode", () => {
  it("sends paid online tickets to the website without a link, and keeps in-person checkout", () => {
    expect(appBookingMode("buy", true)).toBe("web_only");
    expect(appBookingMode("external", true)).toBe("web_only");
    expect(appBookingMode("buy", false)).toBe("buy");
    expect(appBookingMode("external", false)).toBe("external");
    expect(appBookingMode("rsvp", true)).toBe("rsvp");
  });
});
