import { describe, expect, it } from "vitest";
import { absoluteUrl, esc, renderEmail } from "../layout";
import { buildIcs, icsEscape } from "../ics";
import { unsubscribeToken, unsubscribeUrl, oneClickUnsubscribeUrl, verifyUnsubscribeToken } from "../send";
import { samples as members, draftHeading, accountSuspendedEmail, accountClosedEmail, accountRestoredEmail } from "./members";
import { samples as releases, editionsAnnouncement } from "./releases";
import { samples as owners, digestIsEmpty } from "./owners";
import { verificationApprovedEmail, verificationRejectedEmail } from "./members";
import { verificationSubmittedAlert } from "./owners";
import { newEditions } from "@/agents/releases";
import { editions, archive } from "@/content/gazette";

const all = [...members, ...releases, ...owners];

describe("member, release and owner email samples", () => {
  it("have unique ids", () => {
    expect(new Set(all.map((s) => s.id)).size).toBe(all.length);
  });

  for (const s of all) {
    describe(s.id, () => {
      const { html, text } = renderEmail(s.content);

      it("renders the heading in the html", () => {
        expect(html).toContain(esc(s.content.heading));
      });

      it("includes the call to action URL in the text version", () => {
        if (s.content.cta) expect(text).toContain(absoluteUrl(s.content.cta.href));
      });

      it("has no em dash in the subject or heading", () => {
        expect(s.subject).not.toContain("—");
        expect(s.content.heading).not.toContain("—");
      });

      it("has a heading that is a full sentence", () => {
        expect(s.content.heading).toMatch(/[.!?]$/);
      });
    });
  }
});

describe("draft headings", () => {
  it("turns an invitation into a full sentence", () => {
    expect(draftHeading({ invite: true }, "An invitation to the Trichollective founding directory")).toMatch(/\.$/);
  });
  it("falls back to the subject as a sentence", () => {
    expect(draftHeading({}, "Something happened")).toBe("Something happened.");
  });
});

describe("owner digest", () => {
  it("is empty when nothing happened", () => {
    expect(
      digestIsEmpty({
        dateLabel: "",
        subscribersBySource: [],
        freeAccounts: 0,
        paidByPlan: [],
        listingsWaiting: 0,
        enquiriesDelivered: 0,
        enquiriesHeld: 0,
        contactMessages: 0,
        partnerApplications: 0,
        reportsOpen: 0,
        leads: [],
      })
    ).toBe(true);
  });
});

describe("unsubscribe tokens", () => {
  const email = "niamh@example.com";

  it("accepts a valid token, whatever the case of the address", () => {
    expect(verifyUnsubscribeToken(email, "updates", unsubscribeToken(email, "updates"))).toBe(true);
    expect(verifyUnsubscribeToken("Niamh@Example.com", "updates", unsubscribeToken(email, "updates"))).toBe(true);
  });

  it("rejects a tampered token", () => {
    const t = unsubscribeToken(email, "updates");
    const tampered = (t[0] === "a" ? "b" : "a") + t.slice(1);
    expect(verifyUnsubscribeToken(email, "updates", tampered)).toBe(false);
    expect(verifyUnsubscribeToken(email, "updates", "")).toBe(false);
    expect(verifyUnsubscribeToken("someone@example.com", "updates", t)).toBe(false);
  });

  it("rejects a token for the wrong list", () => {
    expect(verifyUnsubscribeToken(email, "activity", unsubscribeToken(email, "updates"))).toBe(false);
  });

  it("points the footer at the page and the header at the one-click API", () => {
    expect(unsubscribeUrl(email, "updates")).toContain("/email/unsubscribe?");
    expect(oneClickUnsubscribeUrl(email, "updates")).toContain("/api/email/unsubscribe?");
  });
});

describe("calendar file", () => {
  const ics = buildIcs(
    {
      id: "evt1",
      title: "Case round: shedding, thinning and bloods",
      summary: "Bring a case; we'll work through it together.",
      startsAt: new Date("2026-10-15T18:30:00Z"),
      endsAt: null,
      online: false,
      venue: "The Alex Hotel",
      city: "Dublin",
      url: "https://trichollective.net/events/case-round",
    },
    new Date("2026-10-01T08:00:00Z")
  );

  it("is a valid single-event calendar", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });

  it("writes times in UTC, with a two-hour default length", () => {
    expect(ics).toContain("DTSTART:20261015T183000Z");
    expect(ics).toContain("DTEND:20261015T203000Z");
  });

  it("escapes commas and semicolons", () => {
    expect(ics).toContain("SUMMARY:Case round: shedding\\, thinning and bloods");
    expect(ics).toContain("LOCATION:The Alex Hotel\\, Dublin");
    expect(icsEscape("a;b,c\nd")).toBe("a\\;b\\,c\\nd");
  });

  it("folds long lines to 75 octets", () => {
    for (const line of ics.split("\r\n")) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
  });
});

describe("release window", () => {
  it("never announces the four-year archive", () => {
    const now = new Date(`${archive[0].published}T12:00:00Z`);
    const groups = newEditions([...editions, ...archive], now, new Set());
    const slugs = groups.flat().map((e) => e.slug);
    for (const a of archive) expect(slugs).not.toContain(a.slug);
  });

  it("ignores editions published more than 14 days ago and ones already announced", () => {
    const e = editions[0];
    const later = new Date(new Date(`${e.published}T00:00:00Z`).getTime() + 20 * 24 * 60 * 60 * 1000);
    expect(newEditions([e], later, new Set())).toHaveLength(0);
    const sameDay = new Date(`${e.published}T12:00:00Z`);
    expect(newEditions([e], sameDay, new Set([`release:edition:${e.slug}`]))).toHaveLength(0);
    expect(newEditions([e], sameDay, new Set())).toHaveLength(1);
  });

  it("announces editions published on the same day together", () => {
    const sameDay = editions.filter((e) => e.published === editions[0].published);
    const a = editionsAnnouncement(sameDay);
    if (sameDay.length > 1) expect(a.covers).toHaveLength(sameDay.length);
    expect(a.heading).toMatch(/\.$/);
  });
});

describe("account access emails", () => {
  it("says when a pause ends, or that the team will lift it", () => {
    const dated = accountSuspendedEmail({ name: "Niamh Byrne", until: new Date("2026-11-01T12:00:00Z"), reason: null });
    expect(dated.content.body).toMatch(/until Sunday,? 1 November 2026/);
    expect(dated.content.body).toContain("Hello Niamh,");
    const open = accountSuspendedEmail({ name: null, until: null });
    expect(open.content.body).toContain("until the team lifts it");
    expect(open.content.body).not.toContain("reason the team gave");
  });

  it("gives the reason as a full sentence", () => {
    const e = accountSuspendedEmail({ name: "Aoife", until: null, reason: "Promoting products" });
    expect(e.content.body).toContain("The reason the team gave is: Promoting products.");
  });

  it("tells a closed account that billing is not cancelled", () => {
    const e = accountClosedEmail({ name: "Aoife", reason: null });
    expect(e.content.body).toContain("does not cancel a membership subscription");
    expect(e.content.cta).toBeUndefined();
  });

  it("invites a restored member to sign in", () => {
    const e = accountRestoredEmail({ name: "Aoife" });
    expect(e.content.cta?.href).toBe("/login?next=/members");
  });

  it("never uses exclamation marks", () => {
    for (const e of [
      accountSuspendedEmail({ name: "A", until: null, reason: "x" }),
      accountClosedEmail({ name: "A", reason: "x" }),
      accountRestoredEmail({ name: "A" }),
    ]) {
      expect(`${e.subject}${e.content.heading}${e.content.body}`).not.toContain("!");
    }
  });
});

describe("verification emails", () => {
  it("tells an approved member where the badge shows and links to their verification page", () => {
    const e = verificationApprovedEmail({ name: "Niamh Byrne" });
    expect(e.content.body).toContain("Hello Niamh,");
    expect(e.content.body).toContain("directory profile");
    expect(e.content.cta?.href).toBe("/members/profile/verification");
  });

  it("gives the reason as a full sentence and explains how to resubmit", () => {
    const e = verificationRejectedEmail({ name: "Aoife", reason: "The certificate does not show your name" });
    expect(e.content.body).toContain("The reason the team gave is: The certificate does not show your name.");
    expect(e.content.body).toContain("send another document");
    expect(e.content.cta?.href).toBe("/members/profile/verification");
  });

  it("alerts the owners with the member and the document, replying to the member", () => {
    const a = verificationSubmittedAlert({ name: null, email: "aoife@example.com", title: "IAT Diploma in Trichology, 2019" });
    expect(a.facts).toContainEqual(["Member", "No name given"]);
    expect(a.facts).toContainEqual(["Document", "IAT Diploma in Trichology, 2019"]);
    expect(a.replyTo).toBe("aoife@example.com");
    expect(a.cta?.href).toBe("/studio/verification");
    expect(a.heading).toMatch(/\.$/);
  });

  it("never uses exclamation marks", () => {
    for (const e of [verificationApprovedEmail({ name: "A" }), verificationRejectedEmail({ name: "A", reason: "x" })]) {
      expect(`${e.subject}${e.content.heading}${e.content.body}`).not.toContain("!");
    }
  });
});
