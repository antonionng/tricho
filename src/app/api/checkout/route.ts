import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import {
  premiumPriceIdFor,
  priceIdFor,
  tierById,
  type BillingInterval,
} from "@/config/subscriptions";
import { site } from "@/config/site";
import { cleanSource } from "@/lib/source";
import { checkoutTermsText } from "@/lib/legal";
import { cookies } from "next/headers";
import { REFERRAL_COOKIE, referralForCheckout } from "@/lib/referrals";
import { foundingMemberPlacesLeft, foundingPartnerPlacesLeft } from "@/lib/founding";
import { brandMetadata, businessCheckoutDetails, premiumCheckoutFields, type BrandAnswers } from "@/lib/partners";

/**
 * Start a subscription checkout. Signing in first is optional: people can pay
 * straight away and the webhook creates their account from the checkout email.
 * Premium Business is yearly, in pounds, and asks for the brand's details so the
 * webhook can put their partner page live. The Business plan sends the brand's name,
 * category and website from a short form on /for-business, checked here and passed to
 * Stripe as metadata; when it is bought from elsewhere (pricing, founding), Stripe asks.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      plan?: string;
      interval?: BillingInterval;
      founding?: boolean;
      source?: string | null;
      currency?: "gbp" | "eur";
      /** A colleague's invitation code, from ?ref= on the page. The tc_ref cookie is the fallback. */
      ref?: unknown;
      brandName?: unknown;
      category?: unknown;
      website?: unknown;
    };
    const premium = body.plan === "premium";
    const tier = tierById(premium ? "business" : body.plan);
    if (!tier) {
      return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
    }
    // The Business short form: checked by us, never put in a URL.
    let brand: BrandAnswers | null = null;
    if (body.plan === "business" && body.brandName !== undefined) {
      const details = businessCheckoutDetails(body);
      if (!details.ok) return NextResponse.json({ error: details.error }, { status: 400 });
      brand = details.value;
    }
    const askBrand = premium || (body.plan === "business" && !brand);

    const interval: BillingInterval = premium || body.interval === "year" ? "year" : "month";
    // The founding price is only offered while founding places genuinely remain.
    const founding = premium
      ? (await foundingPartnerPlacesLeft()) > 0
      : !!body.founding && !!tier.foundingPrice && (await foundingMemberPlacesLeft()) > 0;
    const priceId = premium ? premiumPriceIdFor(founding) : priceIdFor(tier, interval, founding);
    const planId = premium ? "premium" : tier.id;

    if (!process.env.STRIPE_SECRET_KEY || !priceId) {
      return NextResponse.json(
        { error: "Payments are not switched on yet. Please try again shortly." },
        { status: 503 }
      );
    }

    const session = await auth();
    let customer: string | undefined;
    let userId: string | undefined;
    let buyer: { id: string; email: string | null; stripeCustomerId: string | null; hasPaidBefore: boolean } | null = null;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (user) {
        userId = user.id;
        buyer = {
          id: user.id,
          email: user.email,
          stripeCustomerId: user.stripeCustomerId,
          hasPaidBefore: !!(user.stripeSubscriptionId || user.stripeCurrentPeriodEnd),
        };
        customer = user.stripeCustomerId ?? undefined;
        if (!customer) {
          const created = await stripe.customers.create({
            email: session.user.email,
            name: session.user.name || undefined,
          });
          customer = created.id;
          await prisma.user.update({
            where: { id: user.id },
            data: { stripeCustomerId: customer },
          });
        }
      }
    }

    // Stripe holds each customer to one currency once they have paid. Membership prices come in pounds
    // and euro, so a member who already pays in one is charged in it. Premium is in pounds only, so a
    // member who pays in euro starts Premium as a new Stripe customer with the same email; the webhook
    // still links it to their account through the userId in the metadata.
    let currency: "gbp" | "eur" = body.currency === "eur" && !premium ? "eur" : "gbp";
    let customerEmail: string | undefined;
    if (customer) {
      const existing = await stripe.customers.retrieve(customer).catch(() => null);
      const held = existing && !existing.deleted ? existing.currency : null;
      if (held && held !== currency) {
        if (!premium && (held === "gbp" || held === "eur")) {
          currency = held;
        } else {
          customerEmail = buyer?.email ?? session?.user?.email ?? undefined;
          customer = undefined;
        }
      }
    }

    // Invited by a colleague: half of one month off the first invoice. Never blocks the checkout.
    const referral = await referralForCheckout({
      code: typeof body.ref === "string" && body.ref ? body.ref : (await cookies()).get(REFERRAL_COOKIE)?.value,
      plan: planId,
      founding,
      currency,
      buyer,
    }).catch((error) => {
      console.error("[CHECKOUT_REFERRAL]", error);
      return null;
    });

    const source = body.source ? cleanSource(String(body.source)) : null;
    // People who scanned the event QR code go back to the event page if they change their mind.
    const eventSource = source === "ireland" || source === "dublin";

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      ...(customer ? { customer } : customerEmail ? { customer_email: customerEmail } : {}),
      // Stripe allows either a discount or promotion codes on a session, not both.
      ...(referral ? { discounts: [{ coupon: referral.coupon }] } : { allow_promotion_codes: true }),
      // Prices carry EUR currency options. Always name the currency, or Stripe picks one from the
      // visitor's location and someone who saw pounds on our page is asked to pay in euro.
      currency,
      ...(askBrand ? { custom_fields: premiumCheckoutFields() } : {}),
      // Businesses need an address on their invoices.
      billing_address_collection: premium || body.plan === "business" ? "required" : "auto",
      // Buyers agree to the terms, and to membership starting at once, before they pay.
      custom_text: checkoutTermsText("membership"),
      // Stripe fills in the session id, so /welcome can read the email paid with (never put in a URL).
      success_url: `${site.url}/welcome?plan=${planId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        premium || brand
          ? `${site.url}/for-business?cancelled=1`
          : eventSource
            ? `${site.url}/ireland?cancelled=1`
            : `${site.url}/pricing?cancelled=1`,
      metadata: {
        plan: planId,
        founding: founding ? "1" : "0",
        ...(source ? { source } : {}),
        ...(userId ? { userId } : {}),
        ...(brand ? brandMetadata(brand) : {}),
        ...(referral ? referral.metadata : {}),
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("[CHECKOUT]", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
