import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isDevOrDemo, isPreviewDemo } from "@/lib/env";
import { cookies } from "next/headers";
import { cleanEmail, SIGNIN_EMAIL_COOKIE, signinEmailCookieOptions } from "@/lib/signin-email";
import { EmailLinkForm, type EmailLinkState } from "@/components/auth/EmailLinkForm";
import {
  clearPendingSignup,
  consumerSignupFromForm,
  savePendingConsumerSignup,
  savePendingSignup,
  signupDetailsFromForm,
} from "@/lib/signup-details";
import { ACCOUNT_TYPE_COOKIE, accountTypeCookieOptions } from "@/lib/account-cookie";

const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
const resendEnabled = !!process.env.AUTH_RESEND_KEY;

/** Only same-site paths, so a crafted link can't send people elsewhere after sign-in. */
export function safeNext(next: string | undefined, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/**
 * Every way to get in. Signing in for the first time creates the account, so the same
 * options serve both "sign in" and "create a free account".
 */
export function SignInOptions({
  redirectTo,
  mode,
  defaultEmail,
}: {
  redirectTo: string;
  /** "consumer" creates a free account for a member of the public, in /hub. */
  mode: "signin" | "signup" | "consumer";
  /** The email paid with, from the short-lived tc_signin_email cookie set on /welcome. */
  defaultEmail?: string;
}) {
  const devEnabled = isDevOrDemo();
  const demo = isPreviewDemo();
  const nothing = !googleEnabled && !resendEnabled && !devEnabled;

  return (
    <div className="space-y-5 rounded-3xl border border-rule bg-card p-6 md:p-8">
      {nothing && (
        <p className="text-sm text-ink-2">
          Sign-in is being switched on. Please try again shortly, or email us and we&apos;ll help you in.
        </p>
      )}

      {googleEnabled && (
        <form
          action={async () => {
            "use server";
            // Google creates the account on its own, so this browser's choice tells it to make a consumer account.
            const store = await cookies();
            if (mode === "consumer") store.set(ACCOUNT_TYPE_COOKIE, "consumer", accountTypeCookieOptions);
            else store.delete(ACCOUNT_TYPE_COOKIE);
            await signIn("google", { redirectTo });
          }}
        >
          <Button type="submit" variant="outline" size="lg" className="w-full">
            {mode === "signin" ? "Continue with Google" : "Sign up with Google"}
          </Button>
        </form>
      )}

      {resendEnabled && (
        <EmailLinkForm
          mode={mode}
          defaultEmail={defaultEmail}
          action={async (_prev: EmailLinkState, formData: FormData): Promise<EmailLinkState> => {
            "use server";
            const email = cleanEmail(formData.get("email"));
            if (!email) return { sent: null, error: "Please enter a valid email address." };
            const signup = mode === "signup" ? signupDetailsFromForm(formData) : null;
            if (signup && !signup.ok) return { sent: null, error: signup.error };
            const consumer = mode === "consumer" ? consumerSignupFromForm(formData) : null;
            if (consumer && !consumer.ok) return { sent: null, error: consumer.error };
            try {
              // Held until the link creates the account. A plain sign-in clears anything someone else typed for this email.
              if (signup?.ok) await savePendingSignup(email, signup.details);
              else if (consumer?.ok) await savePendingConsumerSignup(email, consumer.details);
              else await clearPendingSignup(email);
              const url = await signIn("resend", { email, redirectTo, redirect: false });
              if (typeof url === "string" && url.includes("error=")) throw new Error(url);
              // Remembered briefly (httpOnly, never in a URL) so /login/check-email can show it and resend.
              (await cookies()).set(SIGNIN_EMAIL_COOKIE, email, signinEmailCookieOptions);
              return { sent: email, error: null };
            } catch (error) {
              console.error("[SIGN_IN_LINK]", error);
              return { sent: null, error: "We couldn't send the link just now. Please try again in a moment." };
            }
          }}
        />
      )}

      {devEnabled && (
        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("dev", {
              email: String(formData.get("email")),
              name: String(formData.get("name") || ""),
              passcode: String(formData.get("passcode") || ""),
              accountType: mode === "consumer" ? "consumer" : "",
              redirectTo,
            });
          }}
          className={resendEnabled || googleEnabled ? "space-y-3 border-t border-rule pt-5" : "space-y-3"}
        >
          <p className="text-xs text-muted-foreground">
            {demo ? "Preview access. Enter the preview passcode you were given." : "Local development sign-in."}
          </p>
          <div className="space-y-2">
            <Label htmlFor="dev-email">Email</Label>
            <Input id="dev-email" name="email" type="email" required defaultValue={defaultEmail} placeholder="you@example.com" className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dev-name">Name {mode !== "signup" && "(optional)"}</Label>
            <Input id="dev-name" name="name" type="text" required={mode === "signup"} placeholder="Your name" className="h-11" />
          </div>
          {demo && (
            <div className="space-y-2">
              <Label htmlFor="dev-passcode">Preview passcode</Label>
              <Input id="dev-passcode" name="passcode" type="password" required className="h-11" />
            </div>
          )}
          <Button type="submit" size="lg" className="w-full">
            {mode === "signin" ? "Sign in" : "Create my free account"}
          </Button>
        </form>
      )}
    </div>
  );
}
