import { describe, expect, it } from "vitest";
import { googleCalendarHref } from "./calendar-links";

describe("googleCalendarHref", () => {
  const base = {
    title: "Masterclass: the five-minute scalp check",
    summary: "A live session.",
    startsAt: new Date("2026-10-21T18:00:00Z"),
    endsAt: new Date("2026-10-21T19:00:00Z"),
    online: true,
    pageUrl: "https://www.trichollective.net/events/x",
  };
  it("builds a Google Calendar template link with UTC times", () => {
    const u = new URL(googleCalendarHref(base));
    expect(u.hostname).toBe("calendar.google.com");
    expect(u.searchParams.get("dates")).toBe("20261021T180000Z/20261021T190000Z");
    expect(u.searchParams.get("text")).toBe(base.title);
  });
  it("puts the joining link in the details and location when given", () => {
    const u = new URL(googleCalendarHref({ ...base, joinUrl: "https://meet.google.com/abc-defg-hij" }));
    expect(u.searchParams.get("details")).toContain("https://meet.google.com/abc-defg-hij");
    expect(u.searchParams.get("location")).toBe("https://meet.google.com/abc-defg-hij");
  });
  it("defaults to an hour when there is no end time", () => {
    const u = new URL(googleCalendarHref({ ...base, endsAt: null }));
    expect(u.searchParams.get("dates")).toBe("20261021T180000Z/20261021T190000Z");
  });
});
