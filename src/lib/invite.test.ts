import { describe, expect, it } from "vitest";
import { LAUNCH_POSTS } from "@/content/launch-posts";
import { composeInviteEmail, firstName, mapDiscipline, parseInviteLines } from "./invite";

describe("parseInviteLines", () => {
  it("reads a full line", () => {
    const { valid, problems } = parseInviteLines("Aoife Byrne, Aoife@Example.ie, trichologist, Galway, Ireland");
    expect(problems).toEqual([]);
    expect(valid).toEqual([
      { line: 1, name: "Aoife Byrne", email: "aoife@example.ie", profession: "clinical", city: "Galway", country: "Ireland" },
    ]);
  });

  it("needs only a name and email, defaulting to clinical and Ireland", () => {
    const { valid } = parseInviteLines("Sam Lee, sam@example.com");
    expect(valid[0]).toMatchObject({ profession: "clinical", city: "", country: "Ireland" });
  });

  it("maps discipline words", () => {
    const { valid } = parseInviteLines(
      [
        "A One, a@example.com, doctor",
        "B Two, b@example.com, stylist",
        "C Three, c@example.com, head spa",
        "D Four, d@example.com, Trichologist",
        "E Five, e@example.com, Medical",
        "F Six, f@example.com, cosmetic",
      ].join("\n")
    );
    expect(valid.map((v) => v.profession)).toEqual(["medical", "cosmetic", "cosmetic", "clinical", "medical", "cosmetic"]);
    expect(mapDiscipline("Head Spa therapist")).toBe("cosmetic");
    expect(mapDiscipline("astronaut")).toBeNull();
  });

  it("reports an unknown discipline", () => {
    const { valid, problems } = parseInviteLines("A One, a@example.com, astronaut");
    expect(valid).toEqual([]);
    expect(problems[0].reason).toMatch(/discipline/);
  });

  it("accepts listed countries in any case, defaults blanks and rejects others", () => {
    const { valid, problems } = parseInviteLines(
      [
        "A One, a@example.com, , Belfast, northern ireland",
        "B Two, b@example.com, , Leeds, England",
        "C Three, c@example.com, , Dublin, ",
        "D Four, d@example.com, , Paris, France",
      ].join("\n")
    );
    expect(valid.map((v) => v.country)).toEqual(["Northern Ireland", "England", "Ireland"]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatchObject({ line: 4 });
  });

  it("rejects bad emails and missing names", () => {
    const { valid, problems } = parseInviteLines(
      ["No Email, not-an-email", "Spaces, a b@example.com", ", x@example.com", "Fine Person, fine@example.com"].join("\n")
    );
    expect(valid.map((v) => v.email)).toEqual(["fine@example.com"]);
    expect(problems.map((p) => p.line)).toEqual([1, 2, 3]);
  });

  it("skips duplicate emails within the paste, ignoring case", () => {
    const { valid, problems } = parseInviteLines("A One, a@example.com\nA Again, A@EXAMPLE.com");
    expect(valid).toHaveLength(1);
    expect(problems[0]).toMatchObject({ line: 2, reason: expect.stringMatching(/more than once/) });
  });

  it("ignores blank and comment lines and accepts tabs", () => {
    const { valid, problems } = parseInviteLines("\n# header\n\nA One\ta@example.com\tstylist\tCork\tIreland\n");
    expect(problems).toEqual([]);
    expect(valid[0]).toMatchObject({ line: 4, profession: "cosmetic", city: "Cork" });
  });
});

describe("firstName", () => {
  it("skips titles", () => {
    expect(firstName("Dr. Jane O'Neill")).toBe("Jane");
    expect(firstName("Karley Weir")).toBe("Karley");
  });
});

const BANNED = /unlock|elevate|seamless|empower|journey|holistic|game-changer|!/i;

describe("composeInviteEmail", () => {
  const base = {
    name: "Dr Jane O'Neill",
    token: "a".repeat(32),
    founderFull: "Karley Weir",
    baseUrl: "https://example.com/",
    launchTitle: "Trichollective Ireland",
    launchStartsAt: "2026-10-05T09:30:00+01:00",
    freeDays: 90,
  };

  it("includes the link, the offer and the launch date", () => {
    const { subject, body } = composeInviteEmail(base);
    expect(subject).toMatch(/founding directory/);
    expect(body).toContain("Dear Jane,");
    expect(body).toContain(`https://example.com/directory/list?invite=${"a".repeat(32)}`);
    expect(body).toMatch(/free for good/);
    expect(body).toMatch(/90 days/);
    expect(body).toContain("Trichollective Ireland on 5 October");
    expect(body).not.toMatch(BANNED);
  });

  it("adds the personal note only when there is one", () => {
    expect(composeInviteEmail({ ...base, note: "  See you in Naas.  " }).body).toContain("\n\nSee you in Naas.\n\n");
    expect(composeInviteEmail({ ...base, note: "  " }).body.split("\n\n")).toHaveLength(7);
  });
});

describe("launch posts", () => {
  it("has one pinned welcome post in the lounge and keeps to house style", () => {
    const pinned = LAUNCH_POSTS.filter((p) => p.pin);
    expect(pinned).toHaveLength(1);
    expect(pinned[0].space).toBe("lounge");
    for (const p of LAUNCH_POSTS) {
      expect(p.title + p.body).not.toMatch(BANNED);
      expect(p.body.length).toBeGreaterThan(200);
    }
  });
});
