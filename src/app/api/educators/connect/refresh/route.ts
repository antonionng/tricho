import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { site } from "@/config/site";
import { onboardingLink } from "@/lib/educator-connect";

export const dynamic = "force-dynamic";

/** Stripe sends educators here when an onboarding link has expired: make a fresh one. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login?next=/members/educator", site.url));
  const profile = await prisma.educatorProfile.findUnique({ where: { userId: session.user.id }, select: { stripeAccountId: true } });
  if (!profile?.stripeAccountId) return NextResponse.redirect(new URL("/members/educator#payouts", site.url));
  try {
    return NextResponse.redirect(await onboardingLink(profile.stripeAccountId));
  } catch (error) {
    console.error("[EDUCATOR_CONNECT_REFRESH]", error);
    return NextResponse.redirect(new URL("/members/educator?error=connect#payouts", site.url));
  }
}
