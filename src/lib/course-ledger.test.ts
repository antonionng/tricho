import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const db = vi.hoisted(() => ({
  courseSale: { upsert: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  ledgerEntry: { createMany: vi.fn() },
}));
const s = vi.hoisted(() => ({
  paymentIntents: { retrieve: vi.fn() },
  transfers: { retrieve: vi.fn() },
  applicationFees: { retrieve: vi.fn() },
}));
const alert = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/stripe", () => ({ stripe: s }));
vi.mock("@/lib/mail/send", () => ({ alertOwners: alert }));

import { recordRefund, recordSale } from "./course-ledger";

describe("course ledger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    db.courseSale.upsert.mockImplementation(async ({ create }: { create: Record<string, unknown> }) => ({ id: "sale_1", ...create }));
    db.courseSale.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => data);
  });

  it("records an educator sale from what Stripe actually did", async () => {
    s.paymentIntents.retrieve.mockResolvedValue({
      id: "pi_1",
      amount: 7900,
      amount_received: 7900,
      currency: "gbp",
      application_fee_amount: 2370,
      latest_charge: { id: "ch_1", transfer: "tr_1", balance_transaction: { id: "txn_1", fee: 140 } },
    });
    const sale = await recordSale({ enrolmentId: "en_1", courseSlug: "c", versionId: "v1", priceType: "guest", paymentIntentId: "pi_1", metadata: { educatorId: "e1", sharePct: "70" } });
    expect(sale).toMatchObject({ gross: 7900, platformAmount: 2370, educatorAmount: 5530, stripeFee: 140, sharePct: 70, stripeTransferId: "tr_1", educatorId: "e1" });
    const types = db.ledgerEntry.createMany.mock.calls.map((c) => [c[0].data[0].type, c[0].data[0].amount]);
    expect(types).toEqual([
      ["sale", 7900],
      ["educator_share", -5530],
      ["stripe_fee", -140],
    ]);
  });

  it("keeps the whole of a sale of Trichollective's own course", async () => {
    s.paymentIntents.retrieve.mockResolvedValue({ id: "pi_2", amount: 4900, amount_received: 4900, currency: "gbp", application_fee_amount: null, latest_charge: { id: "ch_2", transfer: null, balance_transaction: { id: "txn_2", fee: 95 } } });
    const sale = await recordSale({ enrolmentId: "en_2", courseSlug: "c", versionId: null, priceType: "member", paymentIntentId: "pi_2", metadata: { kind: "course" } });
    expect(sale).toMatchObject({ gross: 4900, platformAmount: 4900, educatorAmount: 0, educatorId: null });
  });

  const sale = { id: "sale_1", courseSlug: "c", gross: 7900, educatorAmount: 5530, reversedAmount: 0, educatorId: "e1", stripeTransferId: "tr_1", currency: "gbp", status: "paid" };
  const refunded = (amount: number) => ({ id: "ch_1", amount_refunded: amount, payment_intent: "pi_1", application_fee: "fee_1", refunds: { data: [{ id: "re_1", amount, currency: "gbp" }] } }) as unknown as Stripe.Charge;

  it("records a full refund that took back the educator's share", async () => {
    db.courseSale.findFirst.mockResolvedValue(sale);
    s.transfers.retrieve.mockResolvedValue({ amount_reversed: 7900 });
    s.applicationFees.retrieve.mockResolvedValue({ amount_refunded: 2370 });
    const r = await recordRefund(refunded(7900));
    expect(r).toMatchObject({ refundedAmount: 7900, reversedAmount: 5530, status: "refunded" });
    expect(alert).not.toHaveBeenCalled();
  });

  it("alerts the team when a dashboard refund left the share with the educator", async () => {
    db.courseSale.findFirst.mockResolvedValue(sale);
    s.transfers.retrieve.mockResolvedValue({ amount_reversed: 0 });
    s.applicationFees.retrieve.mockResolvedValue({ amount_refunded: 0 });
    const r = await recordRefund(refunded(7900));
    expect(r).toMatchObject({ refundedAmount: 7900, reversedAmount: 0, status: "refunded" });
    expect(alert).toHaveBeenCalledOnce();
  });

  it("ignores charges that aren't course sales", async () => {
    db.courseSale.findFirst.mockResolvedValue(null);
    expect(await recordRefund(refunded(100))).toBeNull();
  });
});
