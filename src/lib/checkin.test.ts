import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ updateMany: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    eventAttendee: {
      updateMany: (...a: unknown[]) => db.updateMany(...a),
      findFirst: (...a: unknown[]) => db.findFirst(...a),
      findMany: (...a: unknown[]) => db.findMany(...a),
    },
  },
}));
vi.mock("server-only", () => ({}));

import { checkIn, doorList, undoCheckIn } from "./checkin";
import { bySurname, matchesSearch } from "./checkin-list";
import { doorListPdf } from "./door-list-pdf";

const row = (over: Record<string, unknown> = {}) => ({
  id: "a1",
  name: "Aisling Murphy",
  email: "aisling@example.com",
  code: "7KQ2M9XRB4TZ8HCW",
  dietary: "Vegetarian",
  accessNeeds: null,
  checkedInAt: new Date("2027-04-26T08:42:00Z"),
  cancelledAt: null,
  eventId: "e1",
  event: { title: "Whittlebury" },
  ticket: { status: "paid", ticketType: { name: "Standard" } },
  ...over,
});

beforeEach(() => Object.values(db).forEach((f) => f.mockReset()));

describe("checkIn", () => {
  it("checks in with one conditional update that only matches someone not yet in", async () => {
    db.updateMany.mockResolvedValue({ count: 1 });
    db.findFirst.mockResolvedValue(row());
    const r = await checkIn("e1", { code: "7KQ2M9XRB4TZ8HCW" }, "staff1");
    expect(r).toMatchObject({ status: "checked_in", person: { name: "Aisling Murphy", ticketType: "Standard", dietary: "Vegetarian" } });
    const update = db.updateMany.mock.calls[0][0];
    expect(update.where).toEqual({ code: "7KQ2M9XRB4TZ8HCW", eventId: "e1", checkedInAt: null, cancelledAt: null, ticket: { status: "paid" } });
    expect(update.data).toMatchObject({ checkedInById: "staff1" });
  });

  it("says when a ticket was already scanned", async () => {
    db.updateMany.mockResolvedValue({ count: 0 });
    db.findFirst.mockResolvedValue(row());
    expect(await checkIn("e1", { code: "7KQ2M9XRB4TZ8HCW" }, "staff2")).toMatchObject({ status: "already", at: "2027-04-26T08:42:00.000Z" });
  });

  it("refuses cancelled, unpaid, unknown and other events' tickets", async () => {
    db.updateMany.mockResolvedValue({ count: 0 });
    db.findFirst.mockResolvedValue(row({ cancelledAt: new Date(), checkedInAt: null }));
    expect((await checkIn("e1", { id: "a1" }, "s")).status).toBe("cancelled");
    db.findFirst.mockResolvedValue(row({ checkedInAt: null, ticket: { status: "pending", ticketType: null } }));
    expect((await checkIn("e1", { id: "a1" }, "s")).status).toBe("unpaid");
    db.findFirst.mockResolvedValue(row({ eventId: "e2", event: { title: "Dublin case round" } }));
    expect(await checkIn("e1", { id: "a1" }, "s")).toEqual({ status: "other_event", eventTitle: "Dublin case round" });
    db.findFirst.mockResolvedValue(null);
    expect(await checkIn("e1", { code: "NOPE" }, "s")).toEqual({ status: "not_found" });
    expect(await checkIn("e1", {}, "s")).toEqual({ status: "not_found" });
  });

  it("undoes only a check-in that happened", async () => {
    db.updateMany.mockResolvedValue({ count: 1 });
    expect(await undoCheckIn("e1", "a1")).toBe(true);
    expect(db.updateMany.mock.calls[0][0]).toEqual({
      where: { id: "a1", eventId: "e1", checkedInAt: { not: null } },
      data: { checkedInAt: null, checkedInById: null },
    });
    db.updateMany.mockResolvedValue({ count: 0 });
    expect(await undoCheckIn("e1", "a1")).toBe(false);
  });

  it("loads the door list of paid, uncancelled places sorted by surname", async () => {
    db.findMany.mockResolvedValue([row({ id: "a1", name: "Niamh Walsh" }), row({ id: "a2", name: "Ciara Byrne" })]);
    const list = await doorList("e1");
    expect(list.map((p) => p.name)).toEqual(["Ciara Byrne", "Niamh Walsh"]);
    expect(db.findMany.mock.calls[0][0].where).toEqual({ eventId: "e1", cancelledAt: null, ticket: { status: "paid" } });
  });
});

describe("door list search", () => {
  const p = { name: "Siobhán Ó Briain", email: "siobhan@example.com", code: "7KQ2M9XRB4TZ8HCW" };
  it("matches names without accents, emails and the start of a code", () => {
    expect(matchesSearch(p, "siobhan")).toBe(true);
    expect(matchesSearch(p, "o bri")).toBe(true);
    expect(matchesSearch(p, "example.com")).toBe(true);
    expect(matchesSearch(p, "7kq2")).toBe(true);
    expect(matchesSearch(p, "hcw")).toBe(false);
    expect(matchesSearch(p, "  ")).toBe(true);
  });

  it("sorts by surname, then first name", () => {
    const names = ["Niamh Walsh", "Aoife Byrne", "Ciara Byrne", "Prince"].map((name) => ({ name }));
    expect(names.sort(bySurname).map((n) => n.name)).toEqual(["Aoife Byrne", "Ciara Byrne", "Prince", "Niamh Walsh"]);
  });
});

describe("doorListPdf", () => {
  it("prints everyone across as many pages as it takes", async () => {
    const people = Array.from({ length: 140 }, (_, i) => ({
      id: `a${i}`,
      name: `Attendee Number${i} Ó Briain`,
      email: `a${i}@example.com`,
      code: "7KQ2M9XRB4TZ8HCW",
      ticketType: "Early bird",
      dietary: i % 3 ? null : "Vegetarian, no nuts, and please no mushrooms in anything",
      accessNeeds: i % 5 ? null : "Step-free access 🦽",
      checkedInAt: null,
    }));
    const bytes = await doorListPdf({ title: "Whittlebury", when: "Monday 26 April 2027, 09:00", people, printedAt: "25 Apr, 18:00" });
    expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe("%PDF-");
    const { PDFDocument } = await import("pdf-lib");
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(2);
  });
});
