import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { syncStoreSubscription } from "@/lib/mobile/store";

/**
 * RevenueCat tells us when an app subscription starts, renews, changes or ends.
 * The body only says who; the subscriber is then read back from RevenueCat.
 */
export async function POST(req: Request) {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  const given = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return new NextResponse("Unauthorised", { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as {
    event?: { type?: string; app_user_id?: string; original_app_user_id?: string; transferred_to?: string[] };
  } | null;
  const event = payload?.event;
  if (!event) return new NextResponse("No event", { status: 400 });
  if (event.type === "TEST") return NextResponse.json({ ok: true });

  // A transfer moves a receipt to another account, so both sides need updating.
  const ids = new Set([event.app_user_id, event.original_app_user_id, ...(event.transferred_to ?? [])]);
  const userIds = [...ids].filter((id): id is string => !!id && !id.startsWith("$RCAnonymousID"));

  try {
    await Promise.all(userIds.map((id) => syncStoreSubscription(id)));
  } catch (error) {
    console.error("[revenuecat]", event.type, error);
    // RevenueCat retries on a failure.
    return new NextResponse("Sync failed", { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
