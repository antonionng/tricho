import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
const { planFromProduct, storeStateFrom } = await import("./store");

const DAY = 24 * 60 * 60 * 1000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();
const sub = (expires: string | null, extra: Partial<{ store: string; unsubscribe_detected_at: string | null; billing_issues_detected_at: string | null }> = {}) => ({
  expires_date: expires,
  store: "app_store",
  unsubscribe_detected_at: null,
  billing_issues_detected_at: null,
  ...extra,
});

describe("app store products", () => {
  it("reads the plan from the product id", () => {
    expect(planFromProduct("tc_professional_annual")).toBe("professional");
    expect(planFromProduct("tc.community.monthly")).toBe("community");
    expect(planFromProduct("TC_BUSINESS_MONTHLY")).toBe("business");
    expect(planFromProduct("tc_tips")).toBeNull();
  });

  it("picks the highest current plan", () => {
    const state = storeStateFrom({
      tc_community_monthly: sub(iso(10 * DAY)),
      tc_professional_monthly: sub(iso(5 * DAY), { store: "play_store", unsubscribe_detected_at: iso(-DAY) }),
    });
    expect(state.plan).toBe("professional");
    expect(state.source).toBe("play_store");
    expect(state.cancelAtPeriodEnd).toBe(true);
  });

  it("ignores expired subscriptions but keeps the last end date", () => {
    const end = iso(-3 * DAY);
    const state = storeStateFrom({ tc_professional_monthly: sub(end), tc_community_monthly: sub(iso(-9 * DAY)) });
    expect(state.plan).toBeNull();
    expect(state.periodEnd?.toISOString()).toBe(end);
  });

  it("flags a billing problem", () => {
    expect(storeStateFrom({ tc_community_monthly: sub(iso(DAY), { billing_issues_detected_at: iso(-1) }) }).billingIssue).toBe(true);
  });

  it("is empty with nothing bought", () => {
    expect(storeStateFrom({})).toMatchObject({ plan: null, periodEnd: null });
  });
});
