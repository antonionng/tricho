import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { site } from "@/config/site";
import { checkoutTermsText } from "@/lib/legal";
import { getMembershipByEmail } from "@/lib/subscription";
import { courseBySlug } from "@/content/courses";
import { CHECKOUT_EXPIRES_MINUTES, coursePrice, enrolFree } from "@/lib/courses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A place on a course. The place belongs to an account, so the buyer must be
 * signed in. Active members pay the member price and everyone else the full
 * price; when that is £0 the place is given straight away with no checkout.
 *  - GET says what this visitor would pay and whether they already have a place.
 *  - POST starts a one-off Stripe Checkout payment, or enrols them if free.
 */

type Params = { params: Promise<{ slug: string }> };

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function buyer() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!session?.user?.id || !email) return null;
  const membership = await getMembershipByEmail(email);
  return { userId: session.user.id, email, isMember: membership.isActive };
}

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const course = courseBySlug(slug);
  if (!course) return error("We couldn't find that course.", 404);
  const who = await buyer();
  const price = coursePrice(course, !!who?.isMember);
  const enrolment = who
    ? await prisma.courseEnrolment.findUnique({
        where: { userId_courseSlug: { userId: who.userId, courseSlug: slug } },
        select: { status: true },
      })
    : null;
  return NextResponse.json(
    {
      signedIn: !!who,
      member: !!who?.isMember,
      open: course.status === "open",
      amountPence: price.amountPence,
      priceType: price.priceType,
      enrolled: enrolment?.status === "active",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const course = courseBySlug(slug);
    if (!course) return error("We couldn't find that course.", 404);
    if (course.status !== "open") return error("This course hasn't opened yet. Register your interest and we'll tell you the day it does.", 400);

    const who = await buyer();
    if (!who) return error("Please sign in so we can keep your place and your progress.", 401);

    const learn = `/members/courses/${course.slug}`;
    const existing = await prisma.courseEnrolment.findUnique({
      where: { userId_courseSlug: { userId: who.userId, courseSlug: course.slug } },
    });
    if (existing?.status === "active") return NextResponse.json({ url: learn });

    const price = coursePrice(course, who.isMember);
    if (price.amountPence === 0) {
      await enrolFree(who.userId, course);
      return NextResponse.json({ url: `${learn}?enrolled=1` });
    }

    if (!process.env.STRIPE_SECRET_KEY) return error("Payments are not switched on yet. Please try again shortly.", 503);

    // One row per person per course: a lapsed or refunded checkout is reused.
    const enrolment = await prisma.courseEnrolment.upsert({
      where: { userId_courseSlug: { userId: who.userId, courseSlug: course.slug } },
      create: { userId: who.userId, courseSlug: course.slug, status: "pending", priceType: price.priceType, amount: price.amountPence, currency: "gbp" },
      update: { status: "pending", priceType: price.priceType, amount: price.amountPence, currency: "gbp", stripeSessionId: null, stripePaymentIntentId: null },
      select: { id: true },
    });

    const metadata = { kind: "course", enrolmentId: enrolment.id, courseSlug: course.slug };
    try {
      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "gbp",
              unit_amount: price.amountPence,
              // Course prices include VAT, like the membership prices.
              tax_behavior: "inclusive",
              product_data: {
                name: `Online course: ${course.title}`.slice(0, 250),
                description: price.priceType === "member" ? "Member price, with a certificate of completion" : "With a certificate of completion",
              },
            },
          },
        ],
        customer_email: who.email,
        locale: "en-GB",
        custom_text: checkoutTermsText("course"),
        expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRES_MINUTES * 60,
        metadata,
        payment_intent_data: { metadata, description: `Online course: ${course.title}`.slice(0, 250) },
        success_url: `${site.url}${learn}?enrolled=1`,
        cancel_url: `${site.url}/courses/${course.slug}?checkout=cancelled#enrol`,
      });
      await prisma.courseEnrolment.update({ where: { id: enrolment.id }, data: { stripeSessionId: checkout.id } });
      return NextResponse.json({ url: checkout.url });
    } catch (stripeError) {
      await prisma.courseEnrolment.updateMany({ where: { id: enrolment.id, status: "pending" }, data: { status: "cancelled" } }).catch(() => null);
      throw stripeError;
    }
  } catch (err) {
    console.error("[COURSE_CHECKOUT]", err);
    return error("We could not start the payment. Please try again in a moment.", 500);
  }
}
