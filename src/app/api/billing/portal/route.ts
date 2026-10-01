import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { site } from "@/config/site";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", site.url));
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return new NextResponse("Stripe is not configured", { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user?.stripeCustomerId) {
    return NextResponse.redirect(new URL("/pricing", site.url));
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${site.url}/members/billing`,
  });

  return NextResponse.redirect(portal.url, { status: 303 });
}
