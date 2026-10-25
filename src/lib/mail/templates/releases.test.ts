import { describe, expect, it } from "vitest";
import { renderEmail } from "../layout";
import { announcementEmail, eventAnnouncement, MASTERCLASS_CTA, masterclassAnnouncement } from "./releases";

const masterclass = {
  id: "ev1",
  slug: "laser-led-and-dose",
  title: "Laser, LED and dose: understanding the specifications",
  summary: "What laser and LED actually mean, and how to read any device's specification with a client in mind.",
  startsAt: new Date("2026-11-16T19:00:00Z"),
  endsAt: new Date("2026-11-16T20:00:00Z"),
  online: true,
  priceGBP: 20,
  memberPriceGBP: 0,
  presenters: "Adam Bond (LIVDOR) and Karley Weir",
  sponsorName: "LIVDOR",
};

/** The email exactly as an approved draft renders it. */
function rendered(a: ReturnType<typeof masterclassAnnouncement>) {
  const { subject, content } = announcementEmail({ title: a.subject, body: a.body }, { ...a });
  return { subject, ...renderEmail(content) };
}

describe("masterclassAnnouncement", () => {
  it("says what, when, who and how to join", () => {
    const a = masterclassAnnouncement(masterclass);
    const { subject, text, html } = rendered(a);
    expect(subject).toBe("New masterclass: Laser, LED and dose: understanding the specifications");
    expect(text).toContain("16 November 2026");
    expect(text).toContain("7:00 pm to 8:00 pm");
    expect(text).toContain("It is free for members, and guests pay £20.");
    expect(text).toContain("Adam Bond (LIVDOR) and Karley Weir");
    expect(a.cta).toEqual({ label: MASTERCLASS_CTA, href: "/events/laser-led-and-dose" });
    expect(html).toContain(MASTERCLASS_CTA);
    expect(html).toContain("/events/laser-led-and-dose");
  });

  it("labels a sponsored masterclass in the eyebrow, the body and the facts", () => {
    const a = masterclassAnnouncement(masterclass);
    expect(a.eyebrow).toBe("Masterclass, sponsored by LIVDOR");
    expect(a.body).toContain("Sponsored by LIVDOR.");
    expect(a.facts).toContainEqual(["Sponsored by", "LIVDOR"]);
  });

  it("says nothing about a sponsor when there isn't one", () => {
    const a = masterclassAnnouncement({ ...masterclass, sponsorName: null, presenters: null });
    expect(a.eyebrow).toBe("New masterclass");
    expect(a.body).not.toMatch(/sponsor/i);
    expect(a.facts?.map(([k]) => k)).not.toContain("Presenters");
  });

  it("keeps the event's release ref, so the Releases agent never drafts it twice", () => {
    expect(masterclassAnnouncement(masterclass).ref).toBe(eventAnnouncement(masterclass).ref);
  });

  it("uses no em dashes", () => {
    const { subject, text, html } = rendered(masterclassAnnouncement(masterclass));
    for (const s of [subject, text, html]) expect(s).not.toContain("—");
  });
});

describe("email images", () => {
  it("use the full address for our own photographs", () => {
    const { html } = renderEmail({ preheader: "Hi.", heading: "Hi.", body: "Body.", image: "ire11" });
    expect(html).toMatch(/src="https?:\/\/[^"]+\/gazette\/ireland-2026\/group-mirror\.jpg"/);
  });
});
