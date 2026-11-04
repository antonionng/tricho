import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { disconnectAccount, syncConnectAccount } from "@/lib/educator-connect";

export const runtime = "nodejs";

/**
 * Events from educators' connected Stripe accounts. Stripe sends these to a
 * separate endpoint with its own signing secret (STRIPE_CONNECT_WEBHOOK_SECRET).
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!process.env.STRIPE_SECRET_KEY || !secret) return new NextResponse("Stripe Connect webhook is not configured", { status: 503 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), (await headers()).get("Stripe-Signature") as string, secret);
  } catch (error) {
    return new NextResponse(`Webhook Error: ${error instanceof Error ? error.message : "Unknown error"}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "account.updated":
        await syncConnectAccount(event.data.object as Stripe.Account);
        break;
      case "account.application.deauthorized":
        if (event.account) await disconnectAccount(event.account);
        break;
    }
  } catch (error) {
    console.error("[STRIPE_CONNECT_WEBHOOK]", error);
    return new NextResponse("Handler failed", { status: 500 });
  }
  return new NextResponse(null, { status: 200 });
}
