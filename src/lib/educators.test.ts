import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  educatorProfile: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  course: { updateMany: vi.fn() },
  notification: { create: vi.fn() },
  emailLog: { create: vi.fn() },
  $transaction: vi.fn(async (ops: unknown[]) => ops),
}));
const stripeMock = vi.hoisted(() => ({ subscriptions: { retrieve: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/stripe", () => ({ stripe: stripeMock }));
vi.mock("@/lib/mail/send", () => ({ alertOwners: vi.fn(), deliver: vi.fn(), deliverOnce: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { handleEducatorWebhook } from "./educators";

const event = (type: string, object: unknown) => ({ type, data: { object } }) as unknown as Stripe.Event;
const sub = (metadata: Record<string, string>, end = 1_800_000_000) =>
  ({ id: "sub_1", customer: "cus_1", metadata, cancel_at_period_end: false, items: { data: [{ current_period_end: end }] } }) as unknown as Stripe.Subscription;

describe("handleEducatorWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.emailLog.create.mockResolvedValue({});
    db.educatorProfile.findMany.mockResolvedValue([]);
  });

  it("leaves member plan events alone", async () => {
    expect(await handleEducatorWebhook(event("checkout.session.completed", { mode: "subscription", metadata: { plan: "professional" } }))).toBe(false);
    expect(await handleEducatorWebhook(event("customer.subscription.deleted", sub({ plan: "professional" })))).toBe(false);
    expect(await handleEducatorWebhook(event("checkout.session.completed", { mode: "payment", metadata: { kind: "course" } }))).toBe(false);
  });

  it("creates a profile waiting for approval when an educator pays", async () => {
    db.user.findUnique.mockResolvedValue({ id: "u1", name: "Áine Byrne", email: "aine@example.test" });
    db.educatorProfile.findUnique.mockResolvedValue(null);
    stripeMock.subscriptions.retrieve.mockResolvedValue(sub({ kind: "educator", userId: "u1" }));
    const handled = await handleEducatorWebhook(
      event("checkout.session.completed", { id: "cs_1", mode: "subscription", subscription: "sub_1", metadata: { kind: "educator", userId: "u1", termsVersion: "2026-10-14" } })
    );
    expect(handled).toBe(true);
    expect(db.educatorProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "u1", status: "pending_review", slug: "aine-byrne", sharePct: 70, stripeSubscriptionId: "sub_1", termsVersion: "2026-10-14" }) })
    );
  });

  it("ends the membership and takes courses off sale when the subscription is cancelled", async () => {
    db.educatorProfile.findUnique.mockResolvedValue({ id: "e1", status: "approved" });
    expect(await handleEducatorWebhook(event("customer.subscription.deleted", sub({ kind: "educator" })))).toBe(true);
    expect(db.educatorProfile.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "lapsed" }) }));
    expect(db.course.updateMany).toHaveBeenCalledWith({ where: { educatorId: "e1", status: "published" }, data: { status: "unlisted" } });
  });

  it("claims an educator's invoice so the membership logic never sees it", async () => {
    stripeMock.subscriptions.retrieve.mockResolvedValue(sub({ kind: "educator" }));
    const invoice = { parent: { subscription_details: { subscription: "sub_1", metadata: { kind: "educator" } } } };
    expect(await handleEducatorWebhook(event("invoice.payment_succeeded", invoice))).toBe(true);
    expect(db.educatorProfile.updateMany).toHaveBeenCalled();
  });

  it("passes a member's invoice through", async () => {
    db.educatorProfile.findUnique.mockResolvedValue(null);
    const invoice = { parent: { subscription_details: { subscription: "sub_2", metadata: { plan: "professional" } } } };
    expect(await handleEducatorWebhook(event("invoice.payment_succeeded", invoice))).toBe(false);
    expect(stripeMock.subscriptions.retrieve).not.toHaveBeenCalled();
  });
});
