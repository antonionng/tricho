import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import {
  priceIdFor,
  tierById,
  type BillingInterval,
} from "@/config/subscriptions";
import { site } from "@/config/site";

/**
 * Start a subscription checkout. Signing in first is optional: people can pay
 * straight away and the webhook creates their account from the checkout email.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      plan?: string;
      interval?: BillingInterval;
      founding?: boolean;
      source?: string | null;
    };
    const tier = tierById(body.plan);
    if (!tier) {
      return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
    }
    const interval: BillingInterval = body.interval === "year" ? "year" : "month";
    const founding = !!body.founding && !!tier.foundingPrice;
    const priceId = priceIdFor(tier, interval, founding);

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
      billing_address_collection: "auto",
      success_url: `${site.url}/welcome?plan=${tier.id}`,
      cancel_url: `${site.url}/pricing?cancelled=1`,
      metadata: {
        plan: tier.id,
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
