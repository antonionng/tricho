import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
const { resolveMembership, isProfessionalPlan } = await import("./subscription");

const DAY = 24 * 60 * 60 * 1000;

describe("membership", () => {
  it("is active until the period ends, plus a one-day grace", () => {
    expect(resolveMembership({ stripeCurrentPeriodEnd: new Date(Date.now() + DAY) }).isActive).toBe(true);
    expect(resolveMembership({ stripeCurrentPeriodEnd: new Date(Date.now() - DAY / 2) }).isActive).toBe(true);
    expect(resolveMembership({ stripeCurrentPeriodEnd: new Date(Date.now() - 2 * DAY) }).isActive).toBe(false);
    expect(resolveMembership({ stripeCurrentPeriodEnd: null }).isActive).toBe(false);
  });

  it("treats professional, business and admin as professional", () => {
    expect(isProfessionalPlan("professional")).toBe(true);
    expect(isProfessionalPlan("business")).toBe(true);
    expect(isProfessionalPlan("community")).toBe(false);
    expect(isProfessionalPlan(null, "admin")).toBe(true);
  });
});
