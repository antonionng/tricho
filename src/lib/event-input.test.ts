import { describe, expect, it } from "vitest";
import { cleanUrl, dateToLondonInput, formValuesFromPayload, londonToDate, missingEventFields, pounds, validateEventInput } from "./event-input";

describe("London time", () => {
  it("reads summer (BST) times an hour ahead of UTC", () => {
    expect(londonToDate("2026-10-05T09:30")?.toISOString()).toBe("2026-10-05T08:30:00.000Z");
  });

  it("reads winter (GMT) times as UTC", () => {
    expect(londonToDate("2026-12-01T19:00")?.toISOString()).toBe("2026-12-01T19:00:00.000Z");
  });

  it("handles the clocks going back on the last Sunday of October", () => {
    expect(londonToDate("2026-10-24T19:00")?.toISOString()).toBe("2026-10-24T18:00:00.000Z");
    expect(londonToDate("2026-10-25T00:30")?.toISOString()).toBe("2026-10-24T23:30:00.000Z");
    expect(londonToDate("2026-10-25T03:00")?.toISOString()).toBe("2026-10-25T03:00:00.000Z");
    expect(londonToDate("2026-10-26T19:00")?.toISOString()).toBe("2026-10-26T19:00:00.000Z");
  });

  it("handles the clocks going forward in March", () => {
    expect(londonToDate("2026-03-28T12:00")?.toISOString()).toBe("2026-03-28T12:00:00.000Z");
    expect(londonToDate("2026-03-29T12:00")?.toISOString()).toBe("2026-03-29T11:00:00.000Z");
  });

  it("round trips through the form value", () => {
    for (const v of ["2026-10-05T09:30", "2026-10-24T19:00", "2026-10-25T03:00", "2026-10-26T19:00", "2027-01-15T08:05", "2027-06-30T23:59"]) {
      expect(dateToLondonInput(londonToDate(v))).toBe(v);
    }
  });

  it("formats UTC instants as London wall-clock time", () => {
    expect(dateToLondonInput(new Date("2026-10-25T00:30:00Z"))).toBe("2026-10-25T01:30");
    expect(dateToLondonInput(new Date("2026-10-25T01:30:00Z"))).toBe("2026-10-25T01:30");
    expect(dateToLondonInput(new Date("2026-10-25T02:30:00Z"))).toBe("2026-10-25T02:30");
  });

  it("rejects empty and malformed values", () => {
    expect(londonToDate("")).toBeNull();
    expect(londonToDate("next Thursday")).toBeNull();
    expect(dateToLondonInput(null)).toBe("");
    expect(dateToLondonInput(undefined)).toBe("");
  });
});

describe("cleanUrl", () => {
  it("adds https when the scheme is missing", () => {
    expect(cleanUrl("eventbrite.co.uk/e/123")).toBe("https://eventbrite.co.uk/e/123");
  });
  it("keeps http and https links", () => {
    expect(cleanUrl("http://example.com/a")).toBe("http://example.com/a");
    expect(cleanUrl("HTTPS://Example.com")).toBe("https://example.com/");
  });
  it("returns null for empty or invalid input", () => {
    expect(cleanUrl("")).toBeNull();
    expect(cleanUrl("not a url")).toBeNull();
  });
});

describe("pounds", () => {
  it("rounds to whole pounds", () => {
    expect(pounds("40")).toBe(40);
    expect(pounds("39.6")).toBe(40);
  });
  it("treats empty, negative and nonsense values as zero", () => {
    expect(pounds("")).toBe(0);
    expect(pounds("-5")).toBe(0);
    expect(pounds("abc")).toBe(0);
  });
});

describe("validateEventInput", () => {
  const complete = {
    title: "  Scalp masterclass  ",
    kind: "masterclass",
    summary: "A practical evening on scalp assessment.",
    startsAt: "2026-10-08T19:00",
    endsAt: "",
    online: undefined,
    city: "Dublin",
    venue: "",
    priceGBP: "60",
    memberPriceGBP: "40",
    capacity: "20",
    ticketUrl: "eventbrite.co.uk/e/1",
    published: "on",
  };

  it("accepts a complete event and normalises it", () => {
    const r = validateEventInput(complete);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toMatchObject({
      title: "Scalp masterclass",
      kind: "masterclass",
      body: null,
      endsAt: null,
      online: false,
      city: "Dublin",
      venue: null,
      priceGBP: 60,
      memberPriceGBP: 40,
      capacity: 20,
      ticketUrl: "https://eventbrite.co.uk/e/1",
      published: true,
    });
    expect(r.data.startsAt.toISOString()).toBe("2026-10-08T18:00:00.000Z");
  });

  it("clears the place for online events and accepts boolean flags", () => {
    const r = validateEventInput({ ...complete, online: true, published: false });
    expect(r.ok && r.data.city).toBeNull();
    expect(r.ok && r.data.published).toBe(false);
  });

  it("lists every missing required field", () => {
    const r = validateEventInput({ ...complete, title: " ", kind: "party", summary: "", startsAt: "" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.missing).toEqual(["title", "kind", "summary", "startsAt"]);
    expect(r.data.city).toBe("Dublin");
    expect(r.data.title).toBeUndefined();
  });

  it("caps the summary at 400 characters and treats a blank capacity as no limit", () => {
    const r = validateEventInput({ ...complete, summary: "a".repeat(500), capacity: "" });
    expect(r.ok && r.data.summary.length).toBe(400);
    expect(r.ok && r.data.capacity).toBeNull();
  });
});

describe("prefill payloads", () => {
  it("reads stored fields back as form values", () => {
    const v = formValuesFromPayload({ title: "Meet-up", kind: "chapter_meetup", priceGBP: 0, capacity: 30, online: false, startsAt: "" });
    expect(v).toMatchObject({ title: "Meet-up", kind: "chapter_meetup", priceGBP: "0", capacity: "30", startsAt: "" });
    expect(missingEventFields(v!)).toEqual(["summary", "startsAt"]);
  });
  it("ignores unexpected payloads", () => {
    expect(formValuesFromPayload(null)).toBeNull();
    expect(formValuesFromPayload([1])).toBeNull();
    expect(formValuesFromPayload({ kind: "party" })?.kind).toBe("gathering");
  });
});
