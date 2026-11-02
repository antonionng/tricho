import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_CALLBACK_PATH, safeReturnPath } from "@/lib/signin-link";

/**
 * A plain GET form to Auth.js. A server action redirect would fetch the callback
 * on the server first, which spends the token before the browser arrives.
 */
export function SignInCodeForm({
  defaultEmail,
  defaultCallbackUrl = "/members",
  submitLabel = "Sign in with the code",
}: {
  defaultEmail?: string;
  defaultCallbackUrl?: string;
  submitLabel?: string;
}) {
  return (
    <form method="get" action={AUTH_CALLBACK_PATH} className="space-y-3">
      <input type="hidden" name="callbackUrl" value={safeReturnPath(defaultCallbackUrl)} />
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email address</Label>
        <Input
          id="signin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          defaultValue={defaultEmail}
          placeholder="you@practice.com"
          className="h-12 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-code">Sign-in code</Label>
        <Input
          id="signin-code"
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          maxLength={32}
          placeholder="123456"
          className="h-12 text-center text-lg tracking-[0.28em]"
        />
      </div>
      <Button type="submit" size="lg" className="h-12 w-full text-base">
        {submitLabel}
      </Button>
    </form>
  );
}
