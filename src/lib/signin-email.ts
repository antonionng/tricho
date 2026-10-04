import { stripe } from "@/lib/stripe";

/**
 * After paying, /welcome remembers the email used at checkout for half an hour so
 * the sign-in page can fill it in. It lives in an httpOnly cookie, never in a URL.
 */
export const SIGNIN_EMAIL_COOKIE = "tc_signin_email";
export const SIGNIN_EMAIL_MAX_AGE = 30 * 60;

export const signinEmailCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SIGNIN_EMAIL_MAX_AGE,
};

/** Stripe Checkout Session ids look like cs_test_… or cs_live_… */
export function isCheckoutSessionId(id: unknown): id is string {
  return typeof id === "string" && /^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id);
}

/** A plausible email address, lowercased, or null. */
export function cleanEmail(v: unknown) {
  if (typeof v !== "string") return null;
  const e = v.trim().toLowerCase();
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

/** The email and plan from a completed checkout, or null if it can't be read. */
export async function paidCheckout(sessionId: unknown): Promise<{ email: string | null; plan: string | null } | null> {
  if (!isCheckoutSessionId(sessionId) || !process.env.STRIPE_SECRET_KEY) return null;
  try {
    const s = await stripe.checkout.sessions.retrieve(sessionId);
    if (s.status !== "complete") return null;
    return {
      email: cleanEmail(s.customer_details?.email ?? s.customer_email),
      plan: typeof s.metadata?.plan === "string" ? s.metadata.plan : null,
    };
  } catch (error) {
    console.error("[WELCOME_SESSION]", error);
    return null;
  }
}
