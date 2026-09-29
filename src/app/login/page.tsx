import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
const resendEnabled = !!process.env.AUTH_RESEND_KEY;
const devEnabled = process.env.NODE_ENV !== "production";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const redirectTo = next || "/members";

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <p className="text-sm font-medium text-primary uppercase tracking-wide">
            Member access
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">Welcome back to the collective.</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-5 shadow-sm">
          {googleEnabled && (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo });
              }}
            >
              <Button
                type="submit"
                variant="outline"
                className="w-full rounded-full h-11"
              >
                Continue with Google
              </Button>
            </form>
          )}

          {resendEnabled && (
            <form
              action={async (formData: FormData) => {
                "use server";
                await signIn("resend", {
                  email: String(formData.get("email")),
                  redirectTo,
                });
              }}
              className="space-y-3"
            >
              <Label htmlFor="email">Email a magic link</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@practice.com"
                className="h-11 rounded-xl"
              />
              <Button type="submit" className="w-full rounded-full h-11">
                Send magic link
              </Button>
            </form>
          )}

          {devEnabled && (
            <form
              action={async (formData: FormData) => {
                "use server";
                await signIn("dev", {
                  email: String(formData.get("email")),
                  name: String(formData.get("name") || ""),
                  redirectTo,
                });
              }}
              className="space-y-3 border-t border-border/40 pt-5"
            >
              <p className="text-xs text-muted-foreground">Dev login (local only)</p>
              <div className="space-y-2">
                <Label htmlFor="dev-email">Email</Label>
                <Input
                  id="dev-email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dev-name">Name (optional)</Label>
                <Input
                  id="dev-name"
                  name="name"
                  type="text"
                  placeholder="Dr Jane Doe"
                  className="h-11 rounded-xl"
                />
              </div>
              <Button type="submit" className="w-full rounded-full h-11">
                Enter
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Not a member yet?{" "}
          <Link href="/join" className="text-primary hover:underline">
            View membership
          </Link>{" "}
          or{" "}
          <Link href="/directory/list" className="text-primary hover:underline">
            list for free
          </Link>
        </p>
      </div>
    </div>
  );
}
