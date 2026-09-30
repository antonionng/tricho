import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isDevOrDemo, isPreviewDemo } from "@/lib/env";

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
export function SignInOptions({ redirectTo, mode }: { redirectTo: string; mode: "signin" | "signup" }) {
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
        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("resend", { email: String(formData.get("email")), redirectTo });
          }}
          className="space-y-3"
        >
          <Label htmlFor="email">Email address</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@practice.com" className="h-11" />
          <Button type="submit" size="lg" className="w-full">
            {mode === "signup" ? "Email me a link to create my account" : "Email me a sign-in link"}
          </Button>
          <p className="text-xs text-muted-foreground">No password to remember. We send a one-time link to your inbox.</p>
        </form>
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
            <Input id="dev-email" name="email" type="email" required placeholder="you@example.com" className="h-11" />
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
