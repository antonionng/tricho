import { beforeEach, describe, expect, it, vi } from "vitest";

const DAY = 24 * 60 * 60 * 1000;

type User = {
  email: string;
  plan: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: Date | null;
  compPlan?: string | null;
  compUntil?: Date | null;
};
type Partner = { name: string; ownerEmail: string; tier: string; hidden: boolean };
const db = { users: [] as User[], partners: [] as Partner[], seats: [] as { ownerEmail: string; email: string }[] };

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: async ({ where }: { where: { email: string } }) => db.users.find((u) => u.email === where.email) ?? null },
    partner: {
      findFirst: async ({ where }: { where: Partial<Partner> }) =>
        db.partners.find((p) => p.ownerEmail === where.ownerEmail && p.tier === where.tier && p.hidden === where.hidden) ?? null,
      findUnique: async ({ where }: { where: { ownerEmail: string } }) => db.partners.find((p) => p.ownerEmail === where.ownerEmail) ?? null,
    },
    businessSeat: { findMany: async ({ where }: { where: { email: string } }) => db.seats.filter((s) => s.email === where.email) },
  },
}));
const { getMembershipByEmail, isBusinessAccount } = await import("./subscription");

const business = (email: string, end: number): User => ({
  email,
  plan: "business",
  stripePriceId: null,
  stripeCurrentPeriodEnd: new Date(Date.now() + end),
});

describe("business seats", () => {
  beforeEach(() => {
    db.users = [];
    db.partners = [];
    db.seats = [];
  });

  it("gives a team member Professional while the Business plan is active", async () => {
    db.users.push(business("owner@clinic.ie", 10 * DAY));
    db.partners.push({ name: "Scalp Clinic", ownerEmail: "owner@clinic.ie", tier: "business", hidden: false });
    db.seats.push({ ownerEmail: "owner@clinic.ie", email: "ciara@clinic.ie" });

    const m = await getMembershipByEmail("ciara@clinic.ie");
    expect(m).toMatchObject({ isActive: true, tierId: "professional", via: "Scalp Clinic" });
  });

  it("stops when the Business plan lapses", async () => {
    db.users.push(business("owner@clinic.ie", -3 * DAY));
    db.seats.push({ ownerEmail: "owner@clinic.ie", email: "ciara@clinic.ie" });

    expect((await getMembershipByEmail("ciara@clinic.ie")).isActive).toBe(false);
    expect(await isBusinessAccount("owner@clinic.ie")).toBe(false);
  });

  it("gives seats through a complimentary Business plan while it lasts", async () => {
    db.users.push({ email: "owner@clinic.ie", plan: null, stripePriceId: null, stripeCurrentPeriodEnd: null, compPlan: "business", compUntil: null });
    db.partners.push({ name: "Scalp Clinic", ownerEmail: "owner@clinic.ie", tier: "business", hidden: false });
    db.seats.push({ ownerEmail: "owner@clinic.ie", email: "ciara@clinic.ie" });

    expect(await isBusinessAccount("owner@clinic.ie")).toBe(true);
    expect(await getMembershipByEmail("ciara@clinic.ie")).toMatchObject({ isActive: true, tierId: "professional", via: "Scalp Clinic" });

    db.users[0].compUntil = new Date(Date.now() - DAY);
    expect(await isBusinessAccount("owner@clinic.ie")).toBe(false);
    expect((await getMembershipByEmail("ciara@clinic.ie")).isActive).toBe(false);
  });

  it("does not treat a complimentary Professional plan as a Business account", async () => {
    db.users.push({ email: "solo@clinic.ie", plan: null, stripePriceId: null, stripeCurrentPeriodEnd: null, compPlan: "professional" });
    expect(await isBusinessAccount("solo@clinic.ie")).toBe(false);
  });

  it("treats the owner of a Premium page as Professional, unless the page is paused", async () => {
    db.partners.push({ name: "Follicle Labs", ownerEmail: "brand@labs.com", tier: "premium", hidden: false });
    expect(await getMembershipByEmail("brand@labs.com")).toMatchObject({ isActive: true, via: "Follicle Labs" });

    db.partners[0].hidden = true;
    expect((await getMembershipByEmail("brand@labs.com")).isActive).toBe(false);
  });
});
