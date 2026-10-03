import { describe, expect, it } from "vitest";
import { absoluteUrl, renderEmail } from "../layout";
import { referralAnsweredEmail, referralReceivedEmail, samples } from "./members";

describe("referral emails", () => {
  const received = referralReceivedEmail({ recipientName: "Dr Niamh Byrne", senderName: "Ciara Walsh", referralId: "r1" });
  const accepted = referralAnsweredEmail({ recipientName: "Ciara", responderName: "Niamh Byrne", accepted: true, referralId: "r1" });
  const declined = referralAnsweredEmail({ recipientName: "Ciara", responderName: "Niamh Byrne", accepted: false, referralId: "r1" });

  it("link to the referral in the member area", () => {
    for (const e of [received, accepted, declined]) {
      expect(renderEmail(e.content).text).toContain(absoluteUrl("/members/referrals/r1"));
    }
  });

  it("have full-sentence headings and no em dashes", () => {
    for (const e of [received, accepted, declined]) {
      expect(e.content.heading).toMatch(/\.$/);
      expect(e.subject + e.content.heading).not.toContain("—");
      expect(e.subject).not.toContain("!");
    }
  });

  it("say plainly whether the referral was accepted", () => {
    expect(accepted.content.heading).toContain("accepted");
    expect(declined.content.heading).toContain("not able");
  });

  it("are listed in the Studio email catalogue", () => {
    expect(samples.map((s) => s.id)).toEqual(expect.arrayContaining(["referral-received", "referral-answered"]));
  });
});
