import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMembershipByEmail } from "@/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Whether the visitor on a public event page is signed in, and a member. The
 * event pages are cached for everyone, so this small call lets a member see
 * "Save your place" where a guest sees membership or guest tickets.
 */
export async function GET() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  const signedIn = !!session?.user?.id && !!email;
  const member = signedIn ? (await getMembershipByEmail(email)).isActive : false;
  return NextResponse.json({ signedIn, member }, { headers: { "Cache-Control": "no-store" } });
}
