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

/** How long after paying the welcome page may sign someone in without an email link. */
export const CHECKOUT_SIGNIN_WINDOW_S = 60 * 60;

type CheckoutLike = {
  status: string | null;
  payment_status: string;
  mode: string;
  created: number;
};

/** Whether a checkout may be used to sign its payer straight in. Pure, so it can be tested. */
export function checkoutSignInAllowed(s: CheckoutLike, nowS = Math.floor(Date.now() / 1000)) {
  return (
    s.status === "complete" &&
    (s.payment_status === "paid" || s.payment_status === "no_payment_required") &&
    s.mode === "subscription" &&
    nowS - s.created >= 0 &&
    nowS - s.created <= CHECKOUT_SIGNIN_WINDOW_S
  );
}

/**
 * The account to sign in after a just-completed checkout, or null. Only the
 * browser Stripe returned to knows the session id; it works once and only for
 * an hour, after which the email link is the way in.
 */
export async function checkoutSignInUser(sessionId: unknown) {
  if (!isCheckoutSessionId(sessionId) || !process.env.STRIPE_SECRET_KEY) return null;
  try {
    const s = await stripe.checkout.sessions.retrieve(sessionId);
    if (!checkoutSignInAllowed(s)) return null;
    const email = cleanEmail(s.customer_details?.email ?? s.customer_email);
    if (!email) return null;

    const { prisma } = await import("@/lib/prisma");
    // One use per checkout: the unique ref on EmailLog is the claim.
    const claimed = await prisma.emailLog
      .create({ data: { ref: `checkout-signin:${s.id}`, to: email } })
      .then(() => true)
      .catch(() => false);
    if (!claimed) return null;

    const select = { id: true, email: true, name: true, image: true, accessStatus: true } as const;
    const byId = typeof s.metadata?.userId === "string" ? await prisma.user.findUnique({ where: { id: s.metadata.userId }, select }) : null;
    // The webhook normally creates the account first; if it hasn't yet, create it now and the webhook fills in the plan.
    const user =
      byId ??
      (await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, name: s.customer_details?.name ?? null, emailVerified: new Date() },
        select,
      }));
    if (user.accessStatus === "banned") return null;
    return { id: user.id, email: user.email, name: user.name, image: user.image };
  } catch (error) {
    console.error("[CHECKOUT_SIGNIN]", error);
    return null;
  }
}
