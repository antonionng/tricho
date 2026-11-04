import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { site } from "@/config/site";
import { checkoutTermsText } from "@/lib/legal";
import { buildCheckoutMetadata, buildLineItemName, canPayQuote } from "@/lib/course-build";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** How long the educator has to finish paying before the checkout lapses. */
const CHECKOUT_EXPIRES_MINUTES = 60;

const back = (problem: string) => NextResponse.redirect(`${site.url}/members/educator?error=${problem}#tailored`, 303);

/**
 * "Accept and pay" on a course-build quote. A plain form post from the
 * educator dashboard: it starts a one-off Stripe Checkout for the quoted fee,
 * VAT included like every other price on the site, and sends them to it.
 * The webhook (handleCourseBuildWebhook) records the payment and starts the work.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const email = session?.user?.email?.toLowerCase();
    if (!userId || !email) return NextResponse.redirect(`${site.url}/login?next=${encodeURIComponent("/members/educator#tailored")}`, 303);

    const form = await req.formData().catch(() => null);
    const requestId = String(form?.get("requestId") ?? "").slice(0, 40);
    const request = requestId
      ? await prisma.courseRequest.findFirst({
          where: { id: requestId, educator: { userId } },
          select: { id: true, title: true, tier: true, quoteStatus: true, quoteAmount: true, stripeCheckoutSessionId: true, educator: { select: { status: true } } },
        })
      : null;
    if (!request) return back("quote");
    if (request.quoteStatus === "paid" || request.quoteStatus === "waived") return NextResponse.redirect(`${site.url}/members/educator#tailored`, 303);
    if (!canPayQuote(request) || request.quoteAmount === null) return back("quote");
    if (request.educator.status === "rejected" || request.educator.status === "suspended") return back("status");
    if (!process.env.STRIPE_SECRET_KEY) return back("payments");

    // Close a checkout they opened earlier, so the same quote can't be paid twice.
    if (request.stripeCheckoutSessionId) {
      await stripe.checkout.sessions.expire(request.stripeCheckoutSessionId).catch(() => null);
    }

    const metadata = buildCheckoutMetadata(request.id, userId);
    const name = buildLineItemName(request.tier, request.title);
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: request.quoteAmount,
            // Prices on the site include VAT.
            tax_behavior: "inclusive",
            product_data: { name, description: "Built with you by the Trichollective team, and sold under your name" },
          },
        },
      ],
      customer_email: email,
      locale: "en-GB",
      custom_text: checkoutTermsText("course_build"),
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRES_MINUTES * 60,
      metadata,
      payment_intent_data: { metadata, description: name },
      success_url: `${site.url}/members/educator?saved=build-paid#tailored`,
      cancel_url: `${site.url}/members/educator#tailored`,
    });
    await prisma.courseRequest.update({ where: { id: request.id }, data: { stripeCheckoutSessionId: checkout.id } });
    if (!checkout.url) return back("payments");
    return NextResponse.redirect(checkout.url, 303);
  } catch (error) {
    console.error("[COURSE_BUILD_CHECKOUT]", error);
    return back("payment");
  }
}
