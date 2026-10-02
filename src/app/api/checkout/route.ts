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
import { foundingMemberPlacesLeft, foundingPartnerPlacesLeft } from "@/lib/founding";
import { premiumCheckoutFields } from "@/lib/partners";

/**
 * Start a subscription checkout. Signing in first is optional: people can pay
 * straight away and the webhook creates their account from the checkout email.
 * Premium Business is yearly, in pounds, and asks for the brand's details so the
 * webhook can put their partner page live.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      plan?: string;
      interval?: BillingInterval;
      founding?: boolean;
      source?: string | null;
      currency?: "gbp" | "eur";
    };
    const premium = body.plan === "premium";
    const tier = tierById(premium ? "business" : body.plan);
    if (!tier) {
      return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
    }
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

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (user) {
        userId = user.id;
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

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      ...(customer ? { customer } : {}),
      allow_promotion_codes: true,
      // Prices carry EUR currency options; charge in the currency the visitor chose on /pricing.
      ...(body.currency === "eur" && !premium ? { currency: "eur" } : {}),
      ...(premium ? { custom_fields: premiumCheckoutFields() } : {}),
      billing_address_collection: premium ? "required" : "auto",
      success_url: `${site.url}/welcome?plan=${planId}`,
      cancel_url: premium ? `${site.url}/for-business?cancelled=1` : `${site.url}/pricing?cancelled=1`,
      metadata: {
        plan: planId,
        founding: founding ? "1" : "0",
        ...(body.source ? { source: String(body.source).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) } : {}),
        ...(userId ? { userId } : {}),
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("[CHECKOUT]", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
