import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { tierById, tierByPriceId } from "@/config/subscriptions";
import { alertOwners, deliverOnce } from "@/lib/mail/send";
import {
  formatMoney,
  membershipCancelledAlert,
  membershipEndedEmail,
  newMemberAlert,
  paymentFailedAlert,
  paymentFailedEmail,
  welcomeEmail,
} from "@/lib/mail/templates/billing";
import { enquiryToPractitionerEmail } from "@/lib/mail/templates/directory";

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

/** Billing sets the member's role, but never demotes an admin who also subscribes. */
const NOT_ADMIN = { role: { not: "admin" as const } };

/**
 * Claim a ref in the email log so an owner alert goes out once per Stripe
 * event, even though Stripe retries webhooks. False if already claimed.
 */
async function claimOnce(ref: string) {
  try {
    await prisma.emailLog.create({ data: { ref } });
    return true;
  } catch {
    return false;
  }
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
          ...(tier ? { plan: tier.id } : {}),
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
        if (tier) {
          await prisma.user.updateMany({
            where: { ...(session.metadata?.userId ? { id: session.metadata.userId } : { email }), ...NOT_ADMIN },
            data: { role: tier.grantsRole },
          });
        }

        // First-touch attribution: keep the first source we saw.
        if (session.metadata?.source && email) {
          await prisma.user.updateMany({
            where: { email, signupSource: null },
            data: { signupSource: session.metadata.source },
          });
        }

        // Paying with the email on a free listing claims it: full profile, enquiries delivered.
        let listingClaimed = false;
        let enquiriesReleased = 0;
        if (email && (tier?.id === "professional" || tier?.id === "business")) {
          const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
          if (user) {
            const claimed = await prisma.directoryListing.updateMany({
              where: { email, status: { in: ["listed", "pending"] } },
              data: { kind: "member", userId: user.id, status: "listed" },
            });
            const held = await prisma.enquiry.findMany({
              where: { listing: { email }, status: "new" },
              select: { id: true, name: true, email: true, message: true, listing: { select: { name: true, email: true } } },
            });
            await prisma.enquiry.updateMany({
              where: { id: { in: held.map((e) => e.id) } },
              data: { status: "forwarded" },
            });
            // Send each held enquiry on now, with replies going to the enquirer.
            for (const e of held) {
              const out = enquiryToPractitionerEmail({
                practitionerName: e.listing.name,
                enquirerName: e.name,
                enquirerEmail: e.email,
                message: e.message,
              });
              await deliverOnce(`enquiry-released:${e.id}`, e.listing.email, out.subject, out.content, {
                replyTo: e.email,
                tag: "enquiry",
              });
            }
            listingClaimed = claimed.count > 0;
            enquiriesReleased = held.length;
          }
        }

        // Welcome the payer and tell the owners, once per event.
        const payer = session.metadata?.userId
          ? await prisma.user.findUnique({ where: { id: session.metadata.userId }, select: { email: true, name: true } })
          : null;
        const to = (payer?.email || email).toLowerCase();
        const name = session.customer_details?.name || payer?.name || null;
        const founding = session.metadata?.founding === "1";
        if (to && tier) {
          const welcome = welcomeEmail({ name, plan: tier.name, founding, listingClaimed, enquiriesReleased });
          await deliverOnce(`stripe:${event.id}:welcome`, to, welcome.subject, welcome.content, { tag: "welcome-member" });
        }
        if (to && (await claimOnce(`stripe:${event.id}:owners`))) {
          await alertOwners(
            newMemberAlert({
              name,
              email: to,
              plan: tier?.name ?? `Unknown plan (${priceId ?? "no price"})`,
              interval: subscription.items.data[0]?.price.recurring?.interval ?? null,
              amount: formatMoney(session.amount_total, session.currency),
              founding,
              source: session.metadata?.source ?? null,
            })
          );
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
            ...(tier ? { plan: tier.id } : {}),
          },
        });
        if (tier) {
          await prisma.user.updateMany({
            where: { stripeSubscriptionId: subscription.id, ...NOT_ADMIN },
            data: { role: tier.grantsRole },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const member = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscription.id },
          select: { email: true, name: true, plan: true },
        });
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { stripeCurrentPeriodEnd: getPeriodEnd(subscription), plan: null },
        });
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id, ...NOT_ADMIN },
          data: { role: "individual" },
        });

        if (member?.email) {
          const plan =
            tierByPriceId(subscription.items?.data?.[0]?.price.id)?.name ?? tierById(member.plan)?.name ?? "Trichollective";
          const ended = membershipEndedEmail({ name: member.name, plan });
          await deliverOnce(`stripe:${event.id}:ended`, member.email, ended.subject, ended.content, { tag: "membership-ended" });
          if (await claimOnce(`stripe:${event.id}:owners`)) {
            await alertOwners(membershipCancelledAlert({ name: member.name, email: member.email, plan }));
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        // Emails only: the role and plan change when Stripe finally cancels (customer.subscription.deleted).
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | null;
          parent?: { subscription_details?: { subscription?: string } };
        };
        const subscriptionId = invoice.subscription ?? invoice.parent?.subscription_details?.subscription;
        if (!subscriptionId) break;
        const member = await prisma.user.findFirst({
          where: {
            OR: [
              { stripeSubscriptionId: subscriptionId },
              ...(typeof invoice.customer === "string" ? [{ stripeCustomerId: invoice.customer }] : []),
            ],
          },
          select: { email: true, name: true, plan: true, stripePriceId: true },
        });
        const to = (member?.email || invoice.customer_email || "").toLowerCase();
        if (!to) break;
        const name = member?.name || invoice.customer_name || null;
        const plan = tierByPriceId(member?.stripePriceId)?.name ?? tierById(member?.plan)?.name ?? "Trichollective";
        const amount = formatMoney(invoice.amount_due, invoice.currency);
        const nextAttempt = invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000) : null;
        const failed = paymentFailedEmail({ name, plan, amount, nextAttempt });
        await deliverOnce(`stripe:${event.id}:payment-failed`, to, failed.subject, failed.content, { tag: "payment-failed" });
        if (await claimOnce(`stripe:${event.id}:owners`)) {
          await alertOwners(paymentFailedAlert({ name, email: to, plan, amount, attempt: invoice.attempt_count ?? null }));
        }
        break;
      }
    }
  } catch (error) {
    console.error("[STRIPE_WEBHOOK_ERROR]", error);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
