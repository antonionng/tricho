import { describe, expect, it } from "vitest";
import {
  attendeeRows,
  attendeeState,
  canEditDetails,
  codeFromScan,
  detailsCloseAt,
  newAttendeeCode,
  placeholderRows,
  placeRefundPence,
} from "./attendees";

const buyer = { name: "Niamh Byrne", email: "niamh@example.com" };

describe("attendee codes", () => {
  it("are 16 unambiguous characters and do not repeat", () => {
    const codes = new Set(Array.from({ length: 500 }, newAttendeeCode));
    expect(codes.size).toBe(500);
    for (const c of codes) expect(c).toMatch(/^[2-9A-HJKMNP-Z]{16}$/);
  });

  it("are read from a scanned ticket link or a typed code", () => {
    expect(codeFromScan("https://www.trichollective.net/events/whittlebury-2027/ticket/7KQ2M9XRB4TZ8HCW")).toBe("7KQ2M9XRB4TZ8HCW");
    expect(codeFromScan("https://www.trichollective.net/events/x/ticket/7KQ2M9XRB4TZ8HCW/?utm=a")).toBe("7KQ2M9XRB4TZ8HCW");
    expect(codeFromScan(" 7kq2m9xrb4tz8hcw ")).toBe("7KQ2M9XRB4TZ8HCW");
    expect(codeFromScan("https://example.com/")).toBeNull();
    expect(codeFromScan("abc")).toBeNull();
  });
});

describe("attendeeRows", () => {
  it("fills 'this is me' from the buyer and sends blank emails to the buyer", () => {
    const r = attendeeRows(
      [
        { isBuyer: true, dietary: "  Vegetarian " },
        { name: " Aisling  Murphy ", email: "", accessNeeds: "" },
        { name: "Ciara", email: "CIARA@Example.com" },
      ],
      3,
      buyer
    );
    expect(r).toEqual({
      ok: true,
      rows: [
        { name: "Niamh Byrne", email: "niamh@example.com", dietary: "Vegetarian", accessNeeds: null, isBuyer: true },
        { name: "Aisling Murphy", email: "niamh@example.com", dietary: null, accessNeeds: null, isBuyer: false },
        { name: "Ciara", email: "ciara@example.com", dietary: null, accessNeeds: null, isBuyer: false },
      ],
    });
  });

  it("needs exactly one row per place, each with a name and a usable email", () => {
    expect(attendeeRows([{ isBuyer: true }], 2, buyer)).toEqual({ ok: false, error: "Please give a name for each of the 2 places." });
    expect(attendeeRows(undefined, 1, buyer)).toEqual({ ok: false, error: "Please tell us who the ticket is for." });
    expect(attendeeRows([{ name: "" }], 1, buyer)).toEqual({ ok: false, error: "Please give the name for the ticket." });
    expect(attendeeRows([{ name: "A" }, { name: "B", email: "nope" }], 2, buyer)).toEqual({ ok: false, error: "Please check the email address for place 2." });
  });

  it("lets only one place be the buyer's", () => {
    expect(attendeeRows([{ isBuyer: true }, { isBuyer: true }], 2, buyer).ok).toBe(false);
  });

  it("makes placeholder rows from the buyer for orders without names", () => {
    expect(placeholderRows(2, buyer).map((r) => [r.name, r.email, r.isBuyer])).toEqual([
      ["Niamh Byrne", "niamh@example.com", true],
      ["Niamh Byrne (place 2)", "niamh@example.com", false],
    ]);
  });
});

describe("changing details", () => {
  const startsAt = new Date("2027-04-26T08:00:00Z");
  it("closes 48 hours before the start unless the event sets its own cut-off", () => {
    expect(detailsCloseAt({ startsAt }).toISOString()).toBe("2027-04-24T08:00:00.000Z");
    const own = new Date("2027-04-19T12:00:00Z");
    expect(detailsCloseAt({ startsAt, detailsCloseAt: own })).toBe(own);
    expect(canEditDetails({ startsAt }, new Date("2027-04-24T07:59:00Z"))).toBe(true);
    expect(canEditDetails({ startsAt }, new Date("2027-04-24T08:00:00Z"))).toBe(false);
  });
});

describe("placeRefundPence", () => {
  it("shares the order evenly and gives the last place the remainder, adding up exactly", () => {
    const order = { amount: 10000, quantity: 3 };
    const first = placeRefundPence(order, 0, 3);
    const second = placeRefundPence(order, first, 2);
    const last = placeRefundPence(order, first + second, 1);
    expect([first, second, last]).toEqual([3333, 3333, 3334]);
  });

  it("never refunds more than is left, for example after a discount code", () => {
    expect(placeRefundPence({ amount: 5000, quantity: 2 }, 4000, 2)).toBe(1000);
    expect(placeRefundPence({ amount: 0, quantity: 2 }, 0, 2)).toBe(0);
  });
});

describe("attendeeState", () => {
  it("follows the order and the place", () => {
    expect(attendeeState({ cancelledAt: null }, "paid")).toBe("confirmed");
    expect(attendeeState({ cancelledAt: null }, "pending")).toBe("pending");
    expect(attendeeState({ cancelledAt: null }, "refunded")).toBe("cancelled");
    expect(attendeeState({ cancelledAt: new Date() }, "paid")).toBe("cancelled");
  });
});
