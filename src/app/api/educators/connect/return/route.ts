import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { site } from "@/config/site";
import { syncConnectAccount } from "@/lib/educator-connect";

export const dynamic = "force-dynamic";

/** Back from Stripe's onboarding: read the account straight away rather than waiting for the webhook. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login?next=/members/educator", site.url));
  const profile = await prisma.educatorProfile.findUnique({ where: { userId: session.user.id }, select: { stripeAccountId: true } });
  if (profile?.stripeAccountId) {
    const account = await stripe.accounts.retrieve(profile.stripeAccountId).catch(() => null);
    if (account) await syncConnectAccount(account);
  }
  return NextResponse.redirect(new URL("/members/educator?connected=1#payouts", site.url));
}
