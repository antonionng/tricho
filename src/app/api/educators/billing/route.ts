import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { site } from "@/config/site";

/** Opens Stripe's billing page for the Educator membership, which has its own Stripe customer. */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login?next=/members/educator", site.url), { status: 303 });
  if (!process.env.STRIPE_SECRET_KEY) return new NextResponse("Stripe is not configured", { status: 503 });
  const profile = await prisma.educatorProfile.findUnique({ where: { userId: session.user.id }, select: { stripeCustomerId: true } });
  if (!profile?.stripeCustomerId) return NextResponse.redirect(new URL("/educators", site.url), { status: 303 });
  const portal = await stripe.billingPortal.sessions.create({ customer: profile.stripeCustomerId, return_url: `${site.url}/members/educator` });
  return NextResponse.redirect(portal.url, { status: 303 });
}
