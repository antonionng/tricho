import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isDevOrDemo, isPreviewDemo } from "@/lib/env";
import { cookies } from "next/headers";
import { cleanEmail, SIGNIN_EMAIL_COOKIE, signinEmailCookieOptions } from "@/lib/signin-email";
import { EmailLinkForm, type EmailLinkState } from "@/components/auth/EmailLinkForm";

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
  mode: "signin" | "signup";
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
            await signIn("google", { redirectTo });
          }}
        >
          <Button type="submit" variant="outline" size="lg" className="w-full">
            {mode === "signup" ? "Sign up with Google" : "Continue with Google"}
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
            try {
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
            <Label htmlFor="dev-name">Name {mode === "signin" && "(optional)"}</Label>
            <Input id="dev-name" name="name" type="text" required={mode === "signup"} placeholder="Your name" className="h-11" />
          </div>
          {demo && (
            <div className="space-y-2">
              <Label htmlFor="dev-passcode">Preview passcode</Label>
              <Input id="dev-passcode" name="passcode" type="password" required className="h-11" />
            </div>
          )}
          <Button type="submit" size="lg" className="w-full">
            {mode === "signup" ? "Create my free account" : "Sign in"}
          </Button>
        </form>
      )}
    </div>
  );
}
