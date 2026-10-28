import "server-only";
import type Stripe from "stripe";
import type { PartnerOffer } from "@prisma/client";
import { stripe } from "@/lib/stripe";
import { premiumBusiness } from "@/config/subscriptions";
import { checkoutTermsText } from "@/lib/legal";
import { site } from "@/config/site";
import { offerPath, offerStripeMetadata, offerUnitAmount } from "@/lib/partner-offers";

/**
 * Stripe charges built from a Premium offer, so the team never has to make a payment link by hand.
 * Every charge sits on the same Premium Business product as the listed prices.
 */

let productId: string | null = null;

/** Stripe needs a due date on an invoice; the page only opens once it is paid. */
export const INVOICE_DAYS = 7;

/** The Premium Business product, read from its listed price, or created once if there is none. */
export async function premiumProductId() {
  if (productId) return productId;
  const priceId = premiumBusiness.stripePriceId || premiumBusiness.stripeFoundingPriceId;
  if (priceId) {
    const price = await stripe.prices.retrieve(priceId);
    productId = typeof price.product === "string" ? price.product : price.product.id;
    return productId;
  }
  const found = await stripe.products.search({ query: "metadata['tier']:'premium' AND active:'true'", limit: 1 });
  productId = found.data[0]?.id ?? (await stripe.products.create({ name: "Trichollective Premium Business", metadata: { tier: "premium" } })).id;
  return productId;
}

type Offer = Pick<PartnerOffer, "id" | "token" | "businessName" | "priceGBP" | "interval" | "isFounding" | "accountEmail" | "email">;

function priceData(offer: Offer, product: string) {
  return {
    currency: "gbp",
    product,
    unit_amount: offerUnitAmount(offer),
    recurring: { interval: offer.interval === "month" ? ("month" as const) : ("year" as const) },
    tax_behavior: "inclusive" as const,
  };
}

/** True when the card form can sit inside the page; otherwise payment opens Stripe's own page. */
export function embeddedCheckoutAvailable() {
  return !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}

/**
 * Card: a Checkout session for the offer. Embedded inside the onboarding page when the publishable
 * key is set, or Stripe's hosted page otherwise. Both come back to the same page when paid.
 */
export async function createOfferCheckout(offer: Offer) {
  const metadata = offerStripeMetadata(offer);
  const back = `${site.url}${offerPath(offer.token)}`;
  const session = await stripe.checkout.sessions.create({
    ...(embeddedCheckoutAvailable()
      ? { ui_mode: "embedded" as const, return_url: `${back}?session_id={CHECKOUT_SESSION_ID}#welcome` }
      : { success_url: `${back}?session_id={CHECKOUT_SESSION_ID}#welcome`, cancel_url: `${back}#payment` }),
    mode: "subscription",
    line_items: [{ quantity: 1, price_data: priceData(offer, await premiumProductId()) }],
    customer_email: offer.accountEmail ?? offer.email,
    billing_address_collection: "required",
    locale: "en-GB",
    custom_text: checkoutTermsText("partner"),
    metadata,
    subscription_data: { metadata, description: `Premium Business partnership: ${offer.businessName}`.slice(0, 250) },
  });
  return session;
}

/**
 * Invoice: a customer and a yearly subscription billed by invoice, which Stripe emails at once,
 * payable by card or bank transfer. The partner page opens when it is paid.
 */
export async function createOfferInvoice(
  offer: Offer & { stripeCustomerId: string | null },
  billing: { name: string; address: string }
) {
  const metadata = offerStripeMetadata(offer);
  const email = offer.accountEmail ?? offer.email;
  const customerId =
    offer.stripeCustomerId ??
    (
      await stripe.customers.create({
        email,
        name: billing.name,
        address: { line1: billing.address.split(/\r?\n|,/)[0]?.trim().slice(0, 200) || billing.address.slice(0, 200) },
        description: `${offer.businessName} (Premium partner)`,
        metadata,
      })
    ).id;
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    collection_method: "send_invoice",
    days_until_due: INVOICE_DAYS,
    items: [{ price_data: priceData(offer, await premiumProductId()) }],
    description: `Premium Business partnership: ${offer.businessName}`.slice(0, 250),
    metadata,
    expand: ["latest_invoice"],
  });
  let invoice = subscription.latest_invoice as Stripe.Invoice | null;
  // A new invoice starts as a draft; finalise and send it so the hosted page and email exist.
  if (invoice?.id && invoice.status === "draft") {
    invoice = await stripe.invoices.finalizeInvoice(invoice.id);
    await stripe.invoices.sendInvoice(invoice.id!).catch((error) => console.error("[OFFER_INVOICE_SEND]", error));
  }
  return { customerId, subscription, invoiceUrl: invoice?.hosted_invoice_url ?? null };
}
