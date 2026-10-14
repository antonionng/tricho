import { describe, expect, it } from "vitest";
import { educatorCanSell, educatorSlugBase, hasEducatorAccess, sharePctFor, submitCoursesBlocker } from "./educator-rules";

const now = new Date("2026-10-14T12:00:00Z");
const future = new Date("2027-10-14T12:00:00Z");
const past = new Date("2026-10-01T12:00:00Z");

describe("educator access", () => {
  it("gives member benefits as soon as they've paid, before approval", () => {
    expect(hasEducatorAccess({ status: "pending_review", currentPeriodEnd: future }, now)).toBe(true);
    expect(hasEducatorAccess({ status: "approved", currentPeriodEnd: future }, now)).toBe(true);
  });
  it("ends access when rejected, suspended or no longer paid", () => {
    expect(hasEducatorAccess({ status: "rejected", currentPeriodEnd: future }, now)).toBe(false);
    expect(hasEducatorAccess({ status: "suspended", currentPeriodEnd: future }, now)).toBe(false);
    expect(hasEducatorAccess({ status: "approved", currentPeriodEnd: past }, now)).toBe(false);
    expect(hasEducatorAccess(null, now)).toBe(false);
  });
});

describe("sending courses for review", () => {
  it("is only open to approved, paid-up educators", () => {
    expect(submitCoursesBlocker({ status: "approved", currentPeriodEnd: future }, now)).toBeNull();
    expect(submitCoursesBlocker({ status: "pending_review", currentPeriodEnd: future }, now)).toMatch(/approved/);
    expect(submitCoursesBlocker({ status: "approved", currentPeriodEnd: past }, now)).toMatch(/ended/);
    expect(submitCoursesBlocker(null, now)).toMatch(/Only Educator/);
  });
});

describe("share", () => {
  it("uses the course rate, then the educator's, then the default", () => {
    expect(sharePctFor({ sharePct: 80 }, { sharePct: 60 })).toBe(80);
    expect(sharePctFor({ sharePct: null }, { sharePct: 60 })).toBe(60);
    expect(sharePctFor({ sharePct: null }, null)).toBe(70);
    expect(sharePctFor({ sharePct: 140 }, null)).toBe(100);
  });
});

describe("slug", () => {
  it("makes a tidy address", () => {
    expect(educatorSlugBase("Dr Áine O'Brien")).toBe("dr-aine-o-brien");
    expect(educatorSlugBase("!!!")).toBe("educator");
  });
});

describe("educatorCanSell", () => {
  const ok = { status: "approved" as const, currentPeriodEnd: future, stripeAccountId: "acct_1", transfersActive: true };
  it("needs approval, a paid-up membership and a Stripe account that can receive money", () => {
    expect(educatorCanSell(ok, now)).toBe(true);
    expect(educatorCanSell({ ...ok, transfersActive: false }, now)).toBe(false);
    expect(educatorCanSell({ ...ok, stripeAccountId: null }, now)).toBe(false);
    expect(educatorCanSell({ ...ok, status: "pending_review" }, now)).toBe(false);
    expect(educatorCanSell({ ...ok, currentPeriodEnd: past }, now)).toBe(false);
  });
});
