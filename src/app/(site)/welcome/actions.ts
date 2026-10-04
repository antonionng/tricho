"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { paidCheckout, SIGNIN_EMAIL_COOKIE, signinEmailCookieOptions } from "@/lib/signin-email";

/** Only same-site paths, so the form can't be used to send people elsewhere. */
function safePath(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/login";
}

/**
 * Remember the email paid with (read from Stripe, never from the form) so the
 * sign-in page can fill it in, then go to sign in.
 */
export async function continueToSignIn(sessionId: string | null, signInPath: string) {
  if (sessionId) {
    const paid = await paidCheckout(sessionId);
    if (paid?.email) (await cookies()).set(SIGNIN_EMAIL_COOKIE, paid.email, signinEmailCookieOptions);
  }
  redirect(safePath(signInPath));
}
