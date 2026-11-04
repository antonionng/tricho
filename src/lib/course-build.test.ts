import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const db = vi.hoisted(() => ({
  courseRequest: { findUnique: vi.fn(), updateMany: vi.fn() },
  notification: { create: vi.fn() },
  emailLog: { create: vi.fn() },
}));
const mail = vi.hoisted(() => ({ alertOwners: vi.fn(), deliverOnce: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/mail/send", () => mail);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { buildFeeSettled, canPayQuote, handleCourseBuildWebhook, parseQuote, poundsToPence, requestSharePct, statusBlocker } from "./course-build";

const event = (type: string, object: unknown) => ({ type, data: { object } }) as unknown as Stripe.Event;
const paid = (over: Record<string, unknown> = {}) => ({
  id: "cs_1",
  mode: "payment",
  payment_status: "paid",
  payment_intent: "pi_1",
  amount_total: 145000,
  metadata: { kind: "course_build", requestId: "r1", userId: "u1" },
  ...over,
});
const request = (over: Record<string, unknown> = {}) => ({
  id: "r1",
  title: "Scalp assessment for colourists",
  tier: "build",
  quoteAmount: 145000,
  stripePaymentIntentId: null,
  educator: { displayName: "Áine Byrne", userId: "u1", user: { name: "Áine Byrne", email: "aine@example.test" } },
  ...over,
});

describe("the build fee gate", () => {
  it("lets work start only once the fee is paid or waived", () => {
    expect(buildFeeSettled({ quoteStatus: "paid" })).toBe(true);
    expect(buildFeeSettled({ quoteStatus: "waived" })).toBe(true);
    for (const s of ["none", "draft", "sent", "withdrawn"] as const) {
      expect(buildFeeSettled({ quoteStatus: s })).toBe(false);
      expect(statusBlocker({ quoteStatus: s }, "building")).toMatch(/paid the quote/);
    }
    expect(statusBlocker({ quoteStatus: "paid" }, "building")).toBeNull();
  });

  it("never blocks other moves, such as declining an unpaid request", () => {
    expect(statusBlocker({ quoteStatus: "none" }, "declined")).toBeNull();
    expect(statusBlocker({ quoteStatus: "sent" }, "scoping")).toBeNull();
  });

  it("lets the educator pay only a sent quote with an amount", () => {
    expect(canPayQuote({ quoteStatus: "sent", quoteAmount: 45000 })).toBe(true);
    expect(canPayQuote({ quoteStatus: "draft", quoteAmount: 45000 })).toBe(false);
    expect(canPayQuote({ quoteStatus: "withdrawn", quoteAmount: 45000 })).toBe(false);
    expect(canPayQuote({ quoteStatus: "sent", quoteAmount: null })).toBe(false);
  });
});

describe("quotes typed in Studio", () => {
  it("reads pounds as typed, into pence", () => {
    expect(poundsToPence("1450")).toBe(145000);
    expect(poundsToPence("£1,450.50")).toBe(145050);
    expect(poundsToPence("0.50")).toBeNull();
    expect(poundsToPence("50001")).toBeNull();
    expect(poundsToPence("lots")).toBeNull();
  });

  it("accepts a full quote and an empty share", () => {
    expect(parseQuote({ tier: "build", amount: "1450", sharePct: "", note: "  Six lessons.  " })).toEqual({
      ok: true,
      quote: { tier: "build", amountPence: 145000, sharePct: null, note: "Six lessons." },
    });
    expect(parseQuote({ tier: "tailor", amount: "450", sharePct: "65%", note: "" })).toMatchObject({ ok: true, quote: { sharePct: 65, note: null } });
  });

  it("refuses an unknown tier, a bad fee or a share over 100", () => {
    expect(parseQuote({ tier: "deluxe", amount: "450", sharePct: "", note: "" }).ok).toBe(false);
    expect(parseQuote({ tier: "build", amount: "", sharePct: "", note: "" }).ok).toBe(false);
    expect(parseQuote({ tier: "build", amount: "450", sharePct: "120", note: "" }).ok).toBe(false);
    expect(parseQuote({ tier: "build", amount: "450", sharePct: "12.5", note: "" }).ok).toBe(false);
  });

  it("takes the request's share first, then the tier's, then the educator's", () => {
    expect(requestSharePct({ sharePct: 55, tier: "build" }, 70)).toBe(55);
    expect(requestSharePct({ sharePct: null, tier: "tailor" }, 70)).toBe(70);
    expect(requestSharePct({ sharePct: null, tier: null }, 68)).toBe(68);
  });
});

describe("handleCourseBuildWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.emailLog.create.mockResolvedValue({});
    db.courseRequest.updateMany.mockResolvedValue({ count: 1 });
    db.courseRequest.findUnique.mockResolvedValue(request());
  });

  it("leaves course places, tickets and memberships alone", async () => {
    expect(await handleCourseBuildWebhook(event("checkout.session.completed", { mode: "payment", metadata: { kind: "course" } }))).toBe(false);
    expect(await handleCourseBuildWebhook(event("checkout.session.completed", { mode: "subscription", metadata: { kind: "educator" } }))).toBe(false);
    expect(await handleCourseBuildWebhook(event("checkout.session.expired", { metadata: { kind: "ticket" } }))).toBe(false);
    expect(await handleCourseBuildWebhook(event("charge.refunded", {}))).toBe(false);
    expect(db.courseRequest.updateMany).not.toHaveBeenCalled();
  });

  it("records the payment, moves the request to Building and tells everyone", async () => {
    expect(await handleCourseBuildWebhook(event("checkout.session.completed", paid()))).toBe(true);
    expect(db.courseRequest.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: "r1", paidAt: null },
      data: expect.objectContaining({ quoteStatus: "paid", stripeCheckoutSessionId: "cs_1", stripePaymentIntentId: "pi_1" }),
    });
    expect(db.courseRequest.updateMany).toHaveBeenNthCalledWith(2, { where: { id: "r1", status: { in: ["new", "scoping"] } }, data: { status: "building" } });
    expect(mail.deliverOnce).toHaveBeenCalledWith("course-build-paid:cs_1", "aine@example.test", expect.stringContaining("Scalp assessment"), expect.anything(), expect.anything());
    expect(mail.alertOwners).toHaveBeenCalledTimes(1);
    expect(db.notification.create).toHaveBeenCalledTimes(1);
  });

  it("changes nothing and sends nothing when Stripe sends the same payment again", async () => {
    db.courseRequest.updateMany.mockResolvedValueOnce({ count: 0 });
    db.courseRequest.findUnique.mockResolvedValue(request({ stripePaymentIntentId: "pi_1" }));
    expect(await handleCourseBuildWebhook(event("checkout.session.completed", paid()))).toBe(true);
    expect(db.courseRequest.updateMany).toHaveBeenCalledTimes(1);
    expect(mail.deliverOnce).not.toHaveBeenCalled();
    expect(mail.alertOwners).not.toHaveBeenCalled();
  });

  it("alerts the owners once when the same quote is paid twice", async () => {
    db.courseRequest.updateMany.mockResolvedValue({ count: 0 });
    db.courseRequest.findUnique.mockResolvedValue(request({ stripePaymentIntentId: "pi_first" }));
    await handleCourseBuildWebhook(event("checkout.session.completed", paid({ id: "cs_2", payment_intent: "pi_2" })));
    expect(mail.alertOwners).toHaveBeenCalledWith(expect.objectContaining({ subject: expect.stringContaining("paid twice") }));
    db.emailLog.create.mockRejectedValue(new Error("unique"));
    await handleCourseBuildWebhook(event("checkout.session.completed", paid({ id: "cs_2", payment_intent: "pi_2" })));
    expect(mail.alertOwners).toHaveBeenCalledTimes(1);
  });

  it("waits for a delayed payment to clear before starting work", async () => {
    expect(await handleCourseBuildWebhook(event("checkout.session.completed", paid({ payment_status: "unpaid" })))).toBe(true);
    expect(db.courseRequest.updateMany).not.toHaveBeenCalled();
    expect(await handleCourseBuildWebhook(event("checkout.session.async_payment_succeeded", paid()))).toBe(true);
    expect(db.courseRequest.updateMany).toHaveBeenCalled();
  });

  it("forgets a checkout that lapsed unpaid, so the educator can start again", async () => {
    expect(await handleCourseBuildWebhook(event("checkout.session.expired", { id: "cs_9", metadata: { kind: "course_build" } }))).toBe(true);
    expect(db.courseRequest.updateMany).toHaveBeenCalledWith({ where: { stripeCheckoutSessionId: "cs_9", paidAt: null }, data: { stripeCheckoutSessionId: null } });
  });
});
