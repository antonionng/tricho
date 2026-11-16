import { describe, expect, it } from "vitest";
import { ADVENT_DOORS, ADVENT_QUOTES } from "@/content/gazette/advent";
import { absoluteUrl, esc, renderEmail } from "../layout";
import { ownerAlertContent } from "../send";
import { adventClaimConfirmEmail, adventClaimOwnerAlert, adventDoorEmail, samples } from "./advent";

describe("adventDoorEmail", () => {
  for (const door of ADVENT_DOORS) {
    describe(`door ${door.day}`, () => {
      const { subject, content } = adventDoorEmail({ name: "Niamh Byrne", day: door.day });
      const { html, text } = renderEmail(content);

      it("says the door is ready", () => {
        expect(subject).toBe(`Door ${door.day} is ready to open`);
        expect(content.preheader).toBe(`Behind today's door: something ${door.hint}.`);
        expect(text).toContain("Hello Niamh,");
      });

      it("never gives the gift away", () => {
        for (const s of [subject, content.preheader, html, text]) {
          expect(s).not.toContain(door.title);
          expect(s).not.toContain(esc(door.title));
          expect(s).not.toContain(door.gift.href);
        }
      });

      it("carries the day's quote in the html and the text", () => {
        const q = ADVENT_QUOTES[door.day - 1];
        expect(content.quote).toEqual(q);
        expect(html).toContain(esc(q.text));
        expect(text).toContain(q.text);
        expect(text).toContain(q.who);
      });

      it("links to the advent and wears the festive band", () => {
        expect(text).toContain(`Open door ${door.day}: ${absoluteUrl("/trichozette/ready-for-2027#advent")}`);
        expect(html).toContain("#9b1b2a");
        expect(html).toContain(`>Door ${door.day}</p>`);
        expect(html).not.toMatch(/<svg|<img/);
      });

      it("uses no em dashes", () => {
        for (const s of [subject, html, text]) expect(s).not.toContain("—");
      });
    });
  }
});

describe("advent claims", () => {
  it("confirms a claim and says when the team will be in touch", () => {
    const { subject, content } = adventClaimConfirmEmail({ name: "Niamh Byrne", day: 7 });
    expect(subject).toBe("We've got your claim for door 7");
    expect(content.body).toContain("within two working days");
  });

  it("puts a door 12 entrant in the draw", () => {
    const { content } = adventClaimConfirmEmail({ name: "Niamh Byrne", day: 12 });
    expect(renderEmail(content).text).toContain("drawn on 19 December 2026");
  });

  it("tells the owners who claimed what, with replies going to the member", () => {
    const a = adventClaimOwnerAlert({ name: "Niamh Byrne", email: "niamh@example.com", day: 10, note: "Two sites" });
    expect(a.facts?.map(([k]) => k)).toEqual(["Door", "Gift", "Name", "Email", "Note"]);
    expect(a.facts).toContainEqual(["Gift", "A month of Kiera SI, free"]);
    expect(a.replyTo).toBe("niamh@example.com");
    expect(adventClaimOwnerAlert({ name: "N", email: "n@example.com", day: 7 }).facts).toContainEqual(["Note", "None"]);
  });

  it("has samples with unique ids and no em dashes", () => {
    expect(new Set(samples.map((s) => s.id)).size).toBe(samples.length);
    for (const s of samples) {
      const { html, text } = renderEmail(s.content);
      for (const x of [s.subject, html, text]) expect(x).not.toContain("—");
    }
    const alert = adventClaimOwnerAlert({ name: "N", email: "n@example.com", day: 8 });
    expect(renderEmail(ownerAlertContent(alert)).text).toContain("Gift: A month of Trichollective, free");
  });

  it("refuses a door that doesn't exist", () => {
    expect(() => adventDoorEmail({ name: null, day: 13 })).toThrow();
  });
});
