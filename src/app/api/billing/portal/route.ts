import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { site } from "@/config/site";
import { syncMembershipFromStripe } from "@/lib/stripe-sync";
import { resolveMembership } from "@/lib/subscription";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", site.url));
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return new NextResponse("Stripe is not configured", { status: 503 });
  }

  let user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  // A payment the webhook missed: link the paying Stripe customer first. The account may hold an
  // empty customer from a second checkout attempt, so this checks the membership, not the id.
  if ((!user || !resolveMembership(user).isActive) && (await syncMembershipFromStripe(session.user.email, { fresh: true }))) {
    user = await prisma.user.findUnique({ where: { email: session.user.email } });
  }
  if (!user?.stripeCustomerId) {
    return NextResponse.redirect(new URL("/pricing", site.url));
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${site.url}/members/billing`,
  });

  return NextResponse.redirect(portal.url, { status: 303 });
}
