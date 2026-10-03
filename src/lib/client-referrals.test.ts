import { describe, expect, it } from "vitest";
import {
  CONTEXT_MAX,
  looksIdentifying,
  nextReferralStatus,
  referralBlocker,
  referralFindings,
  statusSentence,
  validateReferral,
  type Recipient,
} from "./client-referrals";

const kinds = (t: string) => looksIdentifying(t).map((f) => f.kind);

describe("validateReferral", () => {
  it("accepts a good summary and tidies optional fields", () => {
    const r = validateReferral({ summary: "  Diffuse shedding for six months after illness.  ", reason: "  ", clientContext: "Woman in her 40s" });
    expect(r).toEqual({ ok: true, data: { summary: "Diffuse shedding for six months after illness.", reason: null, clientContext: "Woman in her 40s" } });
  });
  it("rejects a summary that is too short or too long", () => {
    expect(validateReferral({ summary: "Too short" }).ok).toBe(false);
    expect(validateReferral({ summary: "x".repeat(2001) }).ok).toBe(false);
  });
  it("rejects client context over the limit", () => {
    expect(validateReferral({ summary: "A long enough summary of the concern.", clientContext: "x".repeat(CONTEXT_MAX + 1) }).ok).toBe(false);
  });
  it("writes errors as full sentences", () => {
    const r = validateReferral({ summary: "" });
    expect(r.ok === false && /\.$/.test(r.error)).toBe(true);
  });
});

describe("looksIdentifying", () => {
  it("finds nothing in a well-written referral", () => {
    expect(looksIdentifying("Woman in her 40s with diffuse shedding since a fever in March. Ferritin was low at her last GP visit.")).toEqual([]);
  });
  it("blocks emails and phone numbers", () => {
    const f = looksIdentifying("Contact her at jane@example.com or 087 123 4567.");
    expect(f.map((x) => x.kind)).toEqual(["email", "phone"]);
    expect(f.every((x) => x.severity === "block")).toBe(true);
    expect(kinds("Call +44 (0)20 7946 0958 after six.")).toContain("phone");
  });
  it("does not treat short numbers or ages as phone numbers", () => {
    expect(kinds("Using 5% minoxidil for 12 months, aged 35 to 40.")).not.toContain("phone");
  });
  it("warns about dates of birth", () => {
    expect(kinds("DOB 12/03/1985")).toContain("date");
    expect(kinds("She was born on 3 March 1990.")).toContain("date");
    expect(looksIdentifying("Date of birth is in the notes.")[0].severity).toBe("warn");
  });
  it("warns about names", () => {
    expect(kinds("Mrs Byrne has noticed thinning at the crown.")).toContain("name");
    expect(kinds("I saw Mary Byrne last week about shedding.")).toContain("name");
    expect(kinds("Her name is Aoife and she has patchy loss.")).toContain("name");
  });
  it("does not mistake condition names for people", () => {
    expect(kinds("Suspected Frontal Fibrosing Alopecia, and possibly Lichen Planopilaris.")).not.toContain("name");
  });
  it("warns about postcodes and Eircodes", () => {
    expect(kinds("Lives near D02 X285.")).toContain("postcode");
    expect(kinds("Lives in SW1A 1AA.")).toContain("postcode");
  });
});

describe("referralFindings", () => {
  it("checks every field and lists each kind once", () => {
    const f = referralFindings({ summary: "Email jane@example.com about the shedding.", reason: "a@b.co", clientContext: "Mrs Byrne" });
    expect(f.map((x) => x.kind)).toEqual(["email", "name"]);
  });
});

describe("referralBlocker", () => {
  const pro = { id: "a", professional: true };
  const recipient = (over: Partial<Recipient> = {}): Recipient => ({ id: "b", active: true, professional: true, listings: [], ...over });

  it("lets a professional refer to another professional", () => {
    expect(referralBlocker(pro, recipient())).toBeNull();
  });
  it("lets a professional refer to a listed practitioner who accepts referrals", () => {
    expect(referralBlocker(pro, recipient({ professional: false, listings: [true] }))).toBeNull();
  });
  it("only lets professionals send", () => {
    expect(referralBlocker({ id: "a", professional: false }, recipient())).toMatch(/Professional/);
  });
  it("stops referrals to yourself, to missing members and to members who cannot receive them", () => {
    expect(referralBlocker(pro, recipient({ id: "a" }))).toMatch(/yourself/);
    expect(referralBlocker(pro, null)).toMatch(/could not find/);
    expect(referralBlocker(pro, recipient({ active: false }))).toMatch(/could not find/);
    expect(referralBlocker(pro, recipient({ professional: false }))).toMatch(/cannot receive/);
  });
  it("respects a member who has opted out on every listing", () => {
    expect(referralBlocker(pro, recipient({ listings: [false] }))).toMatch(/chosen not to/);
  });
});

describe("nextReferralStatus", () => {
  it("marks a new referral as seen when the recipient opens it", () => {
    expect(nextReferralStatus("sent", "open", true)).toEqual({ ok: true, status: "seen", changed: true });
    expect(nextReferralStatus("seen", "open", true)).toEqual({ ok: true, status: "seen", changed: false });
  });
  it("does not change anything when the sender opens it", () => {
    expect(nextReferralStatus("sent", "open", false)).toEqual({ ok: true, status: "sent", changed: false });
  });
  it("lets only the recipient accept or decline, once", () => {
    expect(nextReferralStatus("sent", "accept", true)).toEqual({ ok: true, status: "accepted", changed: true });
    expect(nextReferralStatus("seen", "decline", true)).toEqual({ ok: true, status: "declined", changed: true });
    expect(nextReferralStatus("seen", "accept", false).ok).toBe(false);
    expect(nextReferralStatus("accepted", "decline", true).ok).toBe(false);
  });
});

describe("statusSentence", () => {
  it("is a full sentence for every status and side", () => {
    for (const s of ["sent", "seen", "accepted", "declined"] as const) {
      expect(statusSentence(s, "Niamh", "sent")).toMatch(/\.$/);
      expect(statusSentence(s, "Niamh", "received")).toMatch(/\.$/);
    }
  });
});
