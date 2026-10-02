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
      ...(askBrand ? { custom_fields: premiumCheckoutFields() } : {}),
      // Businesses need an address on their invoices.
      billing_address_collection: premium || body.plan === "business" ? "required" : "auto",
      success_url: `${site.url}/welcome?plan=${planId}`,
      cancel_url: premium || brand ? `${site.url}/for-business?cancelled=1` : `${site.url}/pricing?cancelled=1`,
      metadata: {
        plan: planId,
        founding: founding ? "1" : "0",
        ...(body.source ? { source: String(body.source).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) } : {}),
        ...(userId ? { userId } : {}),
        ...(brand ? brandMetadata(brand) : {}),
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("[CHECKOUT]", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
