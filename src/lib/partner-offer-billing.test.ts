import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const sessionsCreate = vi.fn();
const subscriptionsCreate = vi.fn();
const customersCreate = vi.fn();
const finalizeInvoice = vi.fn();
const sendInvoice = vi.fn();
vi.mock("@/lib/stripe", () => ({
  stripe: {
    prices: { retrieve: async () => ({ product: "prod_premium" }) },
    checkout: { sessions: { create: (...a: unknown[]) => sessionsCreate(...a) } },
    subscriptions: { create: (...a: unknown[]) => subscriptionsCreate(...a) },
    customers: { create: (...a: unknown[]) => customersCreate(...a) },
    invoices: { finalizeInvoice: (...a: unknown[]) => finalizeInvoice(...a), sendInvoice: (...a: unknown[]) => sendInvoice(...a) },
  },
}));

process.env.STRIPE_PRICE_ID_PREMIUM = "price_premium";
const { createOfferCheckout, createOfferInvoice } = await import("@/lib/partner-offer-billing");

const offer = {
  id: "cmoffer1234567",
  token: "tok_abcdefghijklmnopqrstuv",
  businessName: "LIVDOR",
  priceGBP: 1400,
  interval: "year",
  isFounding: true,
  accountEmail: "ann@livdor.com",
  email: "info@livdor.com",
};

describe("Stripe charges built from an offer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  });

  it("charges £1,400 a year on the Premium product, tagged with the offer, for the email that signed", async () => {
    sessionsCreate.mockResolvedValue({ id: "cs_test_1", url: "https://checkout.stripe.com/x" });
    await createOfferCheckout(offer);
    const params = sessionsCreate.mock.calls[0][0];
    expect(params.mode).toBe("subscription");
    expect(params.line_items[0].price_data).toMatchObject({
      currency: "gbp",
      product: "prod_premium",
      unit_amount: 140000,
      recurring: { interval: "year" },
      tax_behavior: "inclusive",
    });
    expect(params.customer_email).toBe("ann@livdor.com");
    expect(params.metadata).toMatchObject({ tier: "premium", offerId: "cmoffer1234567" });
    expect(params.subscription_data.metadata).toEqual(params.metadata);
    // Without the publishable key, Stripe's own page is used and comes back to the onboarding page.
    expect(params.ui_mode).toBeUndefined();
    expect(params.success_url).toContain("/onboard/tok_abcdefghijklmnopqrstuv?session_id={CHECKOUT_SESSION_ID}");
  });

  it("opens the card form inside the page when the publishable key is set", async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_live_x";
    sessionsCreate.mockResolvedValue({ id: "cs_test_2", client_secret: "secret" });
    await createOfferCheckout(offer);
    const params = sessionsCreate.mock.calls[0][0];
    expect(params.ui_mode).toBe("embedded");
    expect(params.return_url).toContain("session_id={CHECKOUT_SESSION_ID}");
    expect(params.success_url).toBeUndefined();
  });

  it("bills by invoice due in 14 days, and sends it", async () => {
    customersCreate.mockResolvedValue({ id: "cus_1" });
    subscriptionsCreate.mockResolvedValue({ id: "sub_1", latest_invoice: { id: "in_1", status: "draft" } });
    finalizeInvoice.mockResolvedValue({ id: "in_1", status: "open", hosted_invoice_url: "https://invoice.stripe.com/i/1" });
    sendInvoice.mockResolvedValue({});
    const result = await createOfferInvoice({ ...offer, stripeCustomerId: null }, { name: "ACB Commerce Ltd", address: "124 City Road\nLondon" });
    const sub = subscriptionsCreate.mock.calls[0][0];
    expect(sub).toMatchObject({ customer: "cus_1", collection_method: "send_invoice", days_until_due: 14 });
    expect(sub.items[0].price_data.unit_amount).toBe(140000);
    expect(sub.metadata.offerId).toBe("cmoffer1234567");
    expect(customersCreate.mock.calls[0][0]).toMatchObject({ email: "ann@livdor.com", name: "ACB Commerce Ltd" });
    expect(sendInvoice).toHaveBeenCalledWith("in_1");
    expect(result.invoiceUrl).toBe("https://invoice.stripe.com/i/1");
  });
});

describe("matching a payment to its offer", async () => {
  const updateMany = vi.fn().mockResolvedValue({ count: 1 });
  const { prisma } = await import("@/lib/prisma");
  Object.assign(prisma, { partnerOffer: { updateMany } });
  const { markOfferPaid } = await import("@/lib/partner-offer-payments");

  it("marks the offer paid by its id, with the Stripe ids", async () => {
    await markOfferPaid({ offerId: "cmoffer1234567", email: "someone@else.com", subscriptionId: "sub_1", customerId: "cus_1" });
    const call = updateMany.mock.calls.at(-1)![0];
    expect(call.where).toEqual({ id: "cmoffer1234567", paidAt: null });
    expect(call.data).toMatchObject({ stripeSubscriptionId: "sub_1", stripeCustomerId: "cus_1" });
  });

  it("falls back to the payer's email for an older payment link", async () => {
    await markOfferPaid({ offerId: null, email: "Ann@Livdor.com" });
    const call = updateMany.mock.calls.at(-1)![0];
    expect(call.where.OR).toEqual([{ email: "ann@livdor.com" }, { accountEmail: "ann@livdor.com" }]);
  });
});
