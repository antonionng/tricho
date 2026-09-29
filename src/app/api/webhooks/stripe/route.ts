import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { tierByPriceId } from "@/config/subscriptions";

/** Period end moved onto subscription items in newer Stripe API versions. */
function getPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const item = subscription.items?.data?.[0] as
    | (Stripe.SubscriptionItem & { current_period_end?: number })
    | undefined;
  const ts =
    item?.current_period_end ??
    (subscription as unknown as { current_period_end?: number }).current_period_end;
  return ts ? new Date(ts * 1000) : null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.metadata?.userId) {
          return new NextResponse("User id is required", { status: 400 });
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const priceId = subscription.items.data[0]?.price.id;
        const tier = tierByPriceId(priceId);

        await prisma.user.update({
          where: { id: session.metadata.userId },
          data: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: getPeriodEnd(subscription),
            ...(tier ? { role: tier.grantsRole } : {}),
          },
        });
        break;
      }

      case "invoice.payment_succeeded":
      case "customer.subscription.updated": {
        let subscriptionId: string | undefined;
        if (event.type === "invoice.payment_succeeded") {
          const invoice = event.data.object as Stripe.Invoice & {
            subscription?: string;
            parent?: { subscription_details?: { subscription?: string } };
          };
          subscriptionId =
            invoice.subscription ??
            invoice.parent?.subscription_details?.subscription;
        } else {
          subscriptionId = (event.data.object as Stripe.Subscription).id;
        }

        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const tier = tierByPriceId(priceId);

        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: getPeriodEnd(subscription),
            ...(tier ? { role: tier.grantsRole } : {}),
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripeCurrentPeriodEnd: getPeriodEnd(subscription),
            role: "individual",
          },
        });
        break;
      }
    }
  } catch (error) {
    console.error("[STRIPE_WEBHOOK_ERROR]", error);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
