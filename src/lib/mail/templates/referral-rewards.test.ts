import { describe, expect, it } from "vitest";
import { absoluteUrl, esc, renderEmail } from "../layout";
import { samples, referralBankedEmail, referralCreditedEmail } from "./referrals";
import { emailGroups } from "../samples";

describe("referral reward emails", () => {
  it("have unique ids", () => {
    const ids = samples.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("are listed in the Studio email catalogue", () => {
    const all = emailGroups.flatMap((g) => g.samples.map((s) => s.id));
    expect(all).toEqual(expect.arrayContaining(["referral-credited", "referral-banked"]));
  });

  it.each(samples.map((s) => [s.id, s] as const))("%s renders", (_id, s) => {
    const { html, text } = renderEmail(s.content);
    expect(html).toContain(esc(s.content.heading));
    expect(text).toContain(s.content.heading);
    if (s.content.cta) expect(text).toContain(absoluteUrl(s.content.cta.href));
  });

  it.each(samples.map((s) => [s.id, s] as const))("%s has no em dash or exclamation mark", (_id, s) => {
    expect(s.subject).not.toMatch(/[—!]/);
    expect(s.content.heading).not.toMatch(/[—!]/);
    expect(s.content.body).not.toMatch(/[—!]/);
  });

  it("headings are full sentences", () => {
    for (const s of samples) expect(s.content.heading.trim()).toMatch(/\.$/);
  });

  it("uses only the colleague's first name", () => {
    const e = referralCreditedEmail({ name: "Aoife Kelly", referredName: "Niamh Byrne", amount: "£14.00" });
    expect(e.subject).toContain("Niamh");
    expect(`${e.subject} ${e.content.heading} ${e.content.body}`).not.toContain("Byrne");
    expect(e.content.body).toContain("£14.00");
  });

  it("falls back politely when the colleague has no name", () => {
    const e = referralBankedEmail({ name: null, referredName: null, amount: null });
    expect(e.content.heading.startsWith("A colleague")).toBe(true);
    expect(e.content.body).toContain("Hello there,");
  });
});
