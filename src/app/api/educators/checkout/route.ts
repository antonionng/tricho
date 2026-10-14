import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { site } from "@/config/site";
import { educatorMembership } from "@/config/subscriptions";
import { checkoutTermsText } from "@/lib/legal";
import { EDUCATOR_TERMS_VERSION } from "@/content/educator-terms";
import { educatorCheckoutMetadata } from "@/lib/educators";
import { hasEducatorAccess } from "@/lib/educator-rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Starts the yearly Educator membership. The buyer signs in first, because the
 * membership, their courses and their payouts all belong to one account. It is
 * a subscription of its own, in pounds, with its own Stripe customer, so it
 * never touches a member plan they already pay for.
 */
export async function POST() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const email = session?.user?.email?.toLowerCase();
    if (!userId || !email) return NextResponse.json({ error: "Please sign in first, so your courses and earnings are kept in your account." }, { status: 401 });

    const existing = await prisma.educatorProfile.findUnique({ where: { userId }, select: { status: true, currentPeriodEnd: true } });
    if (existing && hasEducatorAccess(existing)) return NextResponse.json({ url: "/members/educator" });
    if (existing?.status === "suspended") return NextResponse.json({ error: "Your Educator membership is suspended. Please contact the team." }, { status: 409 });

    const priceId = educatorMembership.stripePriceId;
    if (!process.env.STRIPE_SECRET_KEY || !priceId) {
      return NextResponse.json({ error: "Educator membership isn't open for payments yet. Please try again shortly." }, { status: 503 });
    }

    const metadata = educatorCheckoutMetadata(userId, EDUCATOR_TERMS_VERSION);
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      locale: "en-GB",
      custom_text: checkoutTermsText("educator"),
      metadata,
      subscription_data: { metadata, description: `${site.name} ${educatorMembership.name} membership` },
      success_url: `${site.url}/members/educator?joined=1`,
      cancel_url: `${site.url}/educators?checkout=cancelled`,
    });
    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("[EDUCATOR_CHECKOUT]", error);
    return NextResponse.json({ error: "We could not start the payment. Please try again in a moment." }, { status: 500 });
  }
}
