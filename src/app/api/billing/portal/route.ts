import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return new NextResponse("Stripe is not configured", { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user?.stripeCustomerId) {
    return NextResponse.redirect(new URL("/join", process.env.NEXT_PUBLIC_APP_URL));
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/members/billing`,
  });

  return NextResponse.redirect(portal.url, { status: 303 });
}
