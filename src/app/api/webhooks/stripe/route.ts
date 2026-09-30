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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return new NextResponse("Stripe webhook is not configured", { status: 503 });
  }

  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const priceId = subscription.items.data[0]?.price.id;
        const tier = tierByPriceId(priceId);
        const email = (
          session.customer_details?.email ||
          session.customer_email ||
          ""
        ).toLowerCase();

        const data = {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: priceId,
          stripeCurrentPeriodEnd: getPeriodEnd(subscription),
          isFounding: session.metadata?.founding === "1" || undefined,
          ...(tier ? { role: tier.grantsRole, plan: tier.id } : {}),
        };

        if (session.metadata?.userId) {
          await prisma.user.update({ where: { id: session.metadata.userId }, data });
        } else if (email) {
          // Paid before creating an account: the account is created here and
          // they sign in later with the same email.
          await prisma.user.upsert({
            where: { email },
            update: data,
            create: { email, name: session.customer_details?.name ?? null, ...data },
          });
        } else {
          return new NextResponse("No user or email on session", { status: 400 });
        }

        // Paying with the email on a free listing claims it: full profile, enquiries delivered.
        if (email && (tier?.id === "professional" || tier?.id === "business")) {
          const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
          if (user) {
            await prisma.directoryListing.updateMany({
              where: { email, status: { in: ["listed", "pending"] } },
              data: { kind: "member", userId: user.id, status: "listed" },
            });
            await prisma.enquiry.updateMany({
              where: { listing: { email }, status: "new" },
              data: { status: "forwarded" },
            });
          }
        }
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
            ...(tier ? { role: tier.grantsRole, plan: tier.id } : {}),
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
            plan: null,
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
