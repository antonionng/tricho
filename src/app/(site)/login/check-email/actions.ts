"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { cleanEmail, SIGNIN_EMAIL_COOKIE, signinEmailCookieOptions } from "@/lib/signin-email";

/** Send the sign-in link again to the address remembered in the short-lived cookie. */
export async function resendSignInLink() {
  const jar = await cookies();
  const email = cleanEmail(jar.get(SIGNIN_EMAIL_COOKIE)?.value);
  if (!email) redirect("/login");
  let ok = true;
  try {
    const url = await signIn("resend", { email, redirectTo: "/members", redirect: false });
    if (typeof url === "string" && url.includes("error=")) ok = false;
    else jar.set(SIGNIN_EMAIL_COOKIE, email, signinEmailCookieOptions);
  } catch (error) {
    console.error("[SIGN_IN_RESEND]", error);
    ok = false;
  }
  redirect(ok ? "/login/check-email?resent=1" : "/login/check-email?resent=0");
}

/** Forget the remembered address and start again. */
export async function startWithDifferentEmail() {
  (await cookies()).delete(SIGNIN_EMAIL_COOKIE);
  redirect("/login");
}
