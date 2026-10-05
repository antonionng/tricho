"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
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

/**
 * Sign the payer straight in from the welcome page and take them to set up
 * their profile. If that isn't possible (an old or reused link), fall back to
 * the email sign-in with their address filled in.
 */
export async function continueAfterCheckout(sessionId: string, redirectTo: string, fallbackPath: string) {
  try {
    await signIn("checkout", { sessionId, redirectTo: safePath(redirectTo) });
  } catch (error) {
    if (!(error instanceof AuthError)) throw error; // the success redirect is thrown too
  }
  await continueToSignIn(sessionId, fallbackPath);
}
