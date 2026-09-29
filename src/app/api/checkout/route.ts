import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Profession } from "@prisma/client";

const PROFESSIONS = new Set(["cosmetic", "clinical", "medical", "brand"]);

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const priceId = body.priceId as string | undefined;
    const profession = (body.profession as string | undefined) || "clinical";

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (!priceId) {
      return new NextResponse("Missing price", { status: 400 });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (PROFESSIONS.has(profession)) {
      await prisma.trichologistProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          profession: profession as Profession,
        },
        update: { profession: profession as Profession },
      });
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${appUrl}/members?welcome=1`,
      cancel_url: `${appUrl}/join?canceled=true`,
      metadata: {
        userId: user.id,
        profession,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[STRIPE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
