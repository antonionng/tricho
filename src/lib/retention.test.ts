import { describe, expect, it } from "vitest";
import {
  RETENTION_SEGMENTS,
  SEGMENT_INFO,
  keyDate,
  mayEmail,
  needsAttention,
  nudgeEmail,
  retentionRef,
  segmentsFor,
  type RetentionMember,
} from "./retention";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-03T12:00:00Z");
const ago = (days: number) => new Date(now.getTime() - days * DAY);
const ahead = (days: number) => new Date(now.getTime() + days * DAY);

const member = (over: Partial<RetentionMember> = {}): RetentionMember => ({
  id: "u1",
  createdAt: ago(100),
  onboardedAt: ago(99),
  plan: "professional",
  compPlan: null,
  compUntil: null,
  stripeCurrentPeriodEnd: ahead(20),
  cancelAtPeriodEnd: false,
  lastPaymentFailedAt: null,
  lastSeenAt: ago(1),
  ...over,
});

describe("retention segments", () => {
  it("leaves an engaged, paying member alone", () => {
    expect(segmentsFor(member(), now)).toEqual([]);
    expect(needsAttention(member(), now)).toBe(false);
  });

  it("finds members who have cancelled but are still inside the paid period", () => {
    expect(segmentsFor(member({ cancelAtPeriodEnd: true, stripeCurrentPeriodEnd: ahead(5) }), now)).toEqual(["cancelling"]);
    expect(segmentsFor(member({ cancelAtPeriodEnd: true, stripeCurrentPeriodEnd: ago(2), plan: null }), now)).not.toContain("cancelling");
  });

  it("counts a failed payment for 14 days, and not once it has been cleared", () => {
    expect(segmentsFor(member({ lastPaymentFailedAt: ago(3) }), now)).toContain("payment_failed");
    expect(segmentsFor(member({ lastPaymentFailedAt: ago(15) }), now)).not.toContain("payment_failed");
    expect(segmentsFor(member({ lastPaymentFailedAt: null }), now)).not.toContain("payment_failed");
  });

  it("notes renewals within 14 days, unless the member is cancelling", () => {
    expect(segmentsFor(member({ stripeCurrentPeriodEnd: ahead(10) }), now)).toEqual(["renewing_soon"]);
    expect(segmentsFor(member({ stripeCurrentPeriodEnd: ahead(10), cancelAtPeriodEnd: true }), now)).toEqual(["cancelling"]);
    expect(needsAttention(member({ stripeCurrentPeriodEnd: ahead(10) }), now)).toBe(false);
  });

  it("finds memberships that ended in the last 30 days, allowing a day's grace", () => {
    expect(segmentsFor(member({ plan: null, stripeCurrentPeriodEnd: ago(10) }), now)).toContain("lapsed_recently");
    expect(segmentsFor(member({ plan: null, stripeCurrentPeriodEnd: ago(0.5) }), now)).not.toContain("lapsed_recently");
    expect(segmentsFor(member({ plan: null, stripeCurrentPeriodEnd: ago(40) }), now)).not.toContain("lapsed_recently");
  });

  it("does not count someone as lapsed while a complimentary plan is running", () => {
    expect(segmentsFor(member({ plan: null, stripeCurrentPeriodEnd: ago(10), compPlan: "professional" }), now)).not.toContain(
      "lapsed_recently"
    );
    expect(
      segmentsFor(member({ plan: null, stripeCurrentPeriodEnd: ago(10), compPlan: "professional", compUntil: ago(1) }), now)
    ).toContain("lapsed_recently");
  });

  it("finds people who joined three or more days ago and have not set up", () => {
    expect(segmentsFor(member({ onboardedAt: null, createdAt: ago(4) }), now)).toContain("not_onboarded");
    expect(segmentsFor(member({ onboardedAt: null, createdAt: ago(2) }), now)).not.toContain("not_onboarded");
  });

  it("finds paying members who have been quiet for three weeks", () => {
    expect(segmentsFor(member({ lastSeenAt: ago(22) }), now)).toEqual(["quiet"]);
    expect(segmentsFor(member({ lastSeenAt: ago(20) }), now)).toEqual([]);
    expect(segmentsFor(member({ lastSeenAt: null, createdAt: ago(30) }), now)).toEqual(["quiet"]);
    expect(segmentsFor(member({ lastSeenAt: null, createdAt: ago(10), onboardedAt: ago(9) }), now)).toEqual([]);
    expect(segmentsFor(member({ lastSeenAt: ago(40), plan: null, stripeCurrentPeriodEnd: null }), now)).toEqual([]);
  });

  it("returns the date that matters for each segment", () => {
    const m = member({ lastPaymentFailedAt: ago(2), lastSeenAt: ago(30) });
    expect(keyDate("cancelling", m)).toEqual(m.stripeCurrentPeriodEnd);
    expect(keyDate("payment_failed", m)).toEqual(m.lastPaymentFailedAt);
    expect(keyDate("not_onboarded", m)).toEqual(m.createdAt);
    expect(keyDate("quiet", m)).toEqual(m.lastSeenAt);
  });
});

describe("retention nudges", () => {
  it("dedupes by segment, member and month", () => {
    expect(retentionRef("quiet", "u1", now)).toBe("retention:quiet:u1:2026-10");
    expect(retentionRef("quiet", "u1", ahead(30))).toBe("retention:quiet:u1:2026-11");
  });

  it("sends service emails regardless of preferences, and optional ones only with consent", () => {
    expect(mayEmail("payment_failed", false)).toBe(true);
    expect(mayEmail("cancelling", false)).toBe(true);
    expect(mayEmail("quiet", false)).toBe(false);
    expect(mayEmail("lapsed_recently", true)).toBe(true);
  });

  it("writes every email in full sentences, with no exclamation marks", () => {
    const links = { members: "https://x/members", billing: "https://x/members/billing", pricing: "https://x/pricing", onboarding: "https://x/members/onboarding" };
    for (const s of RETENTION_SEGMENTS) {
      const email = nudgeEmail(s, { firstName: "Niamh", planName: "Professional", date: "14 October 2026", links, signOff: "Founder, Trichollective" });
      expect(email.subject.length).toBeGreaterThan(10);
      expect(email.body).toContain("Hello Niamh,");
      expect(email.body).not.toContain("!");
      expect(SEGMENT_INFO[s].description).toMatch(/\.$/);
      expect(SEGMENT_INFO[s].action).toMatch(/\.$/);
    }
  });
});

describe("not set up window", async () => {
  const { segmentsFor } = await import("./retention");
  const now = new Date("2026-10-03T12:00:00Z");
  const base = { id: "u", onboardedAt: null, plan: null, isFounding: false, stripeCurrentPeriodEnd: null, cancelAtPeriodEnd: false, lastPaymentFailedAt: null, lastSeenAt: null, compPlan: null, compUntil: null };
  it("includes recent sign-ups and leaves out old ones", () => {
    const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    expect(segmentsFor({ ...base, createdAt: daysAgo(5) } as never, now)).toContain("not_onboarded");
    expect(segmentsFor({ ...base, createdAt: daysAgo(90) } as never, now)).not.toContain("not_onboarded");
  });
});
