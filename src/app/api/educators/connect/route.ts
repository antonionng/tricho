import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { site } from "@/config/site";
import { ensureConnectAccount, onboardingLink } from "@/lib/educator-connect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sends an educator to Stripe to set up (or finish setting up) the account their share is paid into. */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login?next=/members/educator", site.url), { status: 303 });
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.redirect(new URL("/members/educator?error=payments", site.url), { status: 303 });
  const profile = await prisma.educatorProfile.findUnique({ where: { userId: session.user.id }, select: { id: true, status: true, stripeAccountId: true, displayName: true } });
  if (!profile || profile.status === "rejected" || profile.status === "suspended") return NextResponse.redirect(new URL("/members/educator", site.url), { status: 303 });
  try {
    const accountId = await ensureConnectAccount(profile, session.user.email ?? null);
    return NextResponse.redirect(await onboardingLink(accountId), { status: 303 });
  } catch (error) {
    console.error("[EDUCATOR_CONNECT]", error);
    return NextResponse.redirect(new URL("/members/educator?error=connect#payouts", site.url), { status: 303 });
  }
}
