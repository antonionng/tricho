import { beforeEach, describe, expect, it, vi } from "vitest";

const generateStructured = vi.fn();
const generate = vi.fn();
vi.mock("./ai", () => ({ generateStructured: (...a: unknown[]) => generateStructured(...a), generate: (...a: unknown[]) => generate(...a) }));

import { draftEvent, writeEventBody } from "./events";

const base = {
  title: "Scalp micropigmentation masterclass",
  kind: "masterclass",
  summary: "A practical evening on scalp micropigmentation for members.",
  body: "Paragraph one.\n\n\n\nParagraph two.",
  startsAt: "2026-10-08T19:00",
  endsAt: null,
  online: false,
  city: "Dublin",
  venue: null,
  priceGBP: 60,
  memberPriceGBP: 40,
  capacity: 20,
  ticketUrl: null,
};

beforeEach(() => {
  generateStructured.mockReset();
  generate.mockReset();
});

describe("draftEvent", () => {
  it("returns null when AI is unavailable", async () => {
    generateStructured.mockResolvedValue(null);
    expect(await draftEvent("A masterclass next Thursday in Dublin")).toBeNull();
  });

  it("returns null for an empty sentence without calling the model", async () => {
    expect(await draftEvent("   ")).toBeNull();
    expect(generateStructured).not.toHaveBeenCalled();
  });

  it("gives the model today's London date, weekday and the site facts", async () => {
    generateStructured.mockResolvedValue(base);
    await draftEvent("A masterclass next Thursday evening in Dublin", new Date("2026-10-02T10:00:00Z"));
    const prompt = generateStructured.mock.calls[0][2] as string;
    expect(prompt).toContain("Friday");
    expect(prompt).toContain("2026-10-02 at 11:00");
    expect(prompt).toContain("Killashee");
    expect(prompt).toContain("A masterclass next Thursday evening in Dublin");
  });

  it("returns tidy form fields", async () => {
    generateStructured.mockResolvedValue(base);
    const out = await draftEvent("A masterclass next Thursday evening in Dublin, £40 members, £60 guests, 20 places");
    expect(out).toMatchObject({
      title: base.title,
      kind: "masterclass",
      startsAt: "2026-10-08T19:00",
      endsAt: "",
      city: "Dublin",
      venue: "",
      priceGBP: 60,
      memberPriceGBP: 40,
      capacity: 20,
      ticketUrl: "",
    });
    expect(out?.body).toBe("Paragraph one.\n\nParagraph two.");
  });

  it("drops a ticket link or venue that is not in the sentence", async () => {
    generateStructured.mockResolvedValue({ ...base, venue: "The Shelbourne", ticketUrl: "https://www.eventbrite.co.uk/e/made-up" });
    const out = await draftEvent("A masterclass next Thursday in Dublin");
    expect(out?.venue).toBe("");
    expect(out?.ticketUrl).toBe("");
  });

  it("keeps a ticket link and venue that are in the sentence", async () => {
    generateStructured.mockResolvedValue({ ...base, venue: "The Shelbourne", ticketUrl: "https://eventbrite.co.uk/e/123" });
    const out = await draftEvent("A masterclass at the Shelbourne next Thursday, tickets at eventbrite.co.uk/e/123");
    expect(out?.venue).toBe("The Shelbourne");
    expect(out?.ticketUrl).toBe("https://eventbrite.co.uk/e/123");
  });

  it("discards malformed dates, negative prices and the place for online events", async () => {
    generateStructured.mockResolvedValue({ ...base, startsAt: "next Thursday", online: true, priceGBP: -5, capacity: 0, summary: "s".repeat(600) });
    const out = await draftEvent("An online masterclass");
    expect(out).toMatchObject({ startsAt: "", online: true, city: "", priceGBP: 0, capacity: null });
    expect(out?.summary.length).toBe(400);
  });
});

describe("writeEventBody", () => {
  it("needs a title and summary", async () => {
    expect(await writeEventBody({ title: "", summary: "x" })).toBeNull();
    expect(generate).not.toHaveBeenCalled();
  });
  it("passes the facts to the model", async () => {
    generate.mockResolvedValue("Body.");
    expect(await writeEventBody({ title: "T", summary: "S", city: "Dublin" })).toBe("Body.");
    expect(generate.mock.calls[0][1]).toContain("City: Dublin");
  });
});
