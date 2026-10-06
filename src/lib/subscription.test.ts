import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
const { resolveMembership, isProfessionalPlan, resolveComp } = await import("./subscription");

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

describe("complimentary plans", () => {
  const now = new Date("2026-10-02T12:00:00Z");

  it("is nothing without a plan", () => {
    expect(resolveComp({ compPlan: null }, now)).toBeNull();
    expect(resolveComp({}, now)).toBeNull();
  });

  it("lasts until it is taken away when there is no end date", () => {
    const comp = resolveComp({ compPlan: "professional", compUntil: null }, now);
    expect(comp).toMatchObject({ isActive: true, tierId: "professional", tierName: "Professional", via: "Complimentary", complimentary: true });
    expect(comp?.currentPeriodEnd).toBeNull();
  });

  it("lasts until the end date and no longer", () => {
    const until = new Date(now.getTime() + DAY);
    expect(resolveComp({ compPlan: "business", compUntil: until }, now)).toMatchObject({ tierId: "business", currentPeriodEnd: until });
    expect(resolveComp({ compPlan: "business", compUntil: now }, now)).toBeNull();
    expect(resolveComp({ compPlan: "community", compUntil: new Date(now.getTime() - DAY) }, now)).toBeNull();
  });

  it("ignores a plan it does not recognise", () => {
    expect(resolveComp({ compPlan: "gold" }, now)).toBeNull();
  });
});

describe("memberships bought in the app", async () => {
  const { resolveStoreMembership, betterMembership } = await import("./subscription");

  it("counts an app subscription until its period ends, plus the grace day", () => {
    expect(resolveStoreMembership({ storePlan: "professional", storeCurrentPeriodEnd: new Date(Date.now() + DAY) })).toMatchObject({
      isActive: true,
      tierId: "professional",
    });
    expect(resolveStoreMembership({ storePlan: "community", storeCurrentPeriodEnd: new Date(Date.now() - 2 * DAY) }).isActive).toBe(false);
    expect(resolveStoreMembership({ storePlan: null, storeCurrentPeriodEnd: new Date(Date.now() + DAY) }).isActive).toBe(false);
  });

  it("prefers an active membership, then the higher plan", () => {
    const active = { isActive: true, tierId: "community" as const };
    const lapsed = { isActive: false, tierId: "business" as const };
    const pro = { isActive: true, tierId: "professional" as const };
    expect(betterMembership(lapsed, active)).toBe(active);
    expect(betterMembership(active, pro)).toBe(pro);
    expect(betterMembership(pro, active)).toBe(pro);
  });
});
