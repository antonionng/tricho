import { describe, expect, it } from "vitest";
import { absoluteUrl, esc, renderEmail } from "../layout";
import { samples, ticketConfirmedEmail, ticketReminderEmail } from "./tickets";

const event = {
  id: "evt_1",
  slug: "scalp-masterclass",
  title: "Scalp masterclass",
  summary: "A practical evening on scalp assessment.",
  startsAt: new Date("2026-11-12T19:00:00Z"),
  endsAt: null,
  online: true,
};

describe("ticket emails", () => {
  for (const s of samples) {
    it(`${s.id} renders with a full-sentence heading and no em dash`, () => {
      const { html, text } = renderEmail(s.content);
      expect(html).toContain(esc(s.content.heading));
      expect(s.content.heading).toMatch(/\.$/);
      expect(s.subject).not.toContain("—");
      if (s.content.cta) expect(text).toContain(absoluteUrl(s.content.cta.href));
    });
  }

  it("links to the calendar file and states the quantity and price", () => {
    const e = ticketConfirmedEmail({ name: "Dr Aisling Murphy", event, quantity: 1, amount: "£40.00", priceType: "member" });
    expect(e.content.secondary?.href).toBe("/api/events/evt_1/ics");
    expect(e.content.cta?.href).toBe("/events/scalp-masterclass");
    expect(e.content.facts).toContainEqual(["Tickets", "1 ticket"]);
    expect(e.content.facts).toContainEqual(["Price", "Member price"]);
    expect(e.content.facts).toContainEqual(["Paid", "£40.00"]);
    expect(e.content.body).toContain("Hello Dr Murphy,");
    expect(e.content.body).toContain("online");
  });

  it("names several places for a guest booking and omits a missing amount", () => {
    const e = ticketConfirmedEmail({ name: null, event: { ...event, online: false, city: "Dublin" }, quantity: 3, amount: null, priceType: "guest" });
    expect(e.content.body).toContain("3 places");
    expect(e.content.body).toContain("Dublin");
    expect(e.content.facts?.some(([k]) => k === "Paid")).toBe(false);
  });

  it("reminds ticket holders without pointing guests to the members' area", () => {
    const e = ticketReminderEmail({ name: "Niamh", event, quantity: 2 });
    expect(e.content.body).toContain("2 tickets");
    expect(e.content.body).not.toContain("events page in the app");
    expect(e.content.secondary?.href).toBe("/api/events/evt_1/ics");
  });
});
