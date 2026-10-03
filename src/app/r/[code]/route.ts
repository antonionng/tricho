import { NextResponse } from "next/server";
import { site } from "@/config/site";
import { REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE, findReferrer } from "@/lib/referrals";

/**
 * A member's share link, e.g. /r/AOIFE-7K2. A valid code is remembered for 30 days and the
 * visitor lands on the pricing page, which shows who invited them. Only the code is ever in the URL.
 */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const base = new URL(req.url).origin || site.url;
  const referrer = await findReferrer(decodeURIComponent(code)).catch(() => null);
  if (!referrer) return NextResponse.redirect(new URL("/pricing", base));

  const res = NextResponse.redirect(new URL(`/pricing?ref=${encodeURIComponent(referrer.code)}`, base));
  res.cookies.set(REFERRAL_COOKIE, referrer.code, {
    httpOnly: true,
    sameSite: "lax",
    secure: base.startsWith("https://"),
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
