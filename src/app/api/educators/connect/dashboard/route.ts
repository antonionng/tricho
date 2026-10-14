import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";

/** Opens the educator's own Stripe Express dashboard, where they see payouts and bank details. */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login?next=/members/educator", site.url), { status: 303 });
  const profile = await prisma.educatorProfile.findUnique({ where: { userId: session.user.id }, select: { stripeAccountId: true } });
  if (!profile?.stripeAccountId) return NextResponse.redirect(new URL("/members/educator#payouts", site.url), { status: 303 });
  try {
    const link = await stripe.accounts.createLoginLink(profile.stripeAccountId);
    return NextResponse.redirect(link.url, { status: 303 });
  } catch (error) {
    console.error("[EDUCATOR_CONNECT_DASHBOARD]", error);
    return NextResponse.redirect(new URL("/members/educator?error=connect#payouts", site.url), { status: 303 });
  }
}
