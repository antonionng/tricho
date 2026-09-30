import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/brand/BrandMark";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { isDevOrDemo, isPreviewDemo } from "@/lib/env";

export const metadata = pageMetadata({
  title: "Sign in",
  description: "Sign in to your Trichollective community.",
  path: "/login",
  noindex: true,
});

const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
const resendEnabled = !!process.env.AUTH_RESEND_KEY;
const devEnabled = isDevOrDemo();
const demo = isPreviewDemo();

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const redirectTo = next || "/members";

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <BrandMark size="md" sub />
          <h1 className="display text-5xl">Welcome back to the collective.</h1>
          <p className="text-[15px] text-ink-2">
            Sign in with the email address you joined with. If you paid before creating an account, use
            the email from your receipt.
          </p>
        </div>

        <div className="rounded-3xl border border-rule bg-card p-6 md:p-8 space-y-5">
          {googleEnabled && (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo });
              }}
            >
              <Button type="submit" variant="outline" size="lg" className="w-full">
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
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@practice.com"
                className="h-11"
              />
              <Button type="submit" size="lg" className="w-full">
                Email me a sign-in link
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
              className="space-y-3 border-t border-rule pt-5"
            >
              <p className="text-xs text-muted-foreground">{demo ? "Preview access: enter your email to explore everything, including the Studio." : "Dev login (local only)"}</p>
              <div className="space-y-2">
                <Label htmlFor="dev-email">Email</Label>
                <Input
                  id="dev-email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dev-name">Name (optional)</Label>
                <Input
                  id="dev-name"
                  name="name"
                  type="text"
                  placeholder="Dr Jane Doe"
                  className="h-11"
                />
              </div>
              <Button type="submit" size="lg" className="w-full">
                Enter
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Not a member yet?{" "}
          <Link href="/pricing" className="text-ink underline underline-offset-4">
            See membership
          </Link>{" "}
          or{" "}
          <Link href="/directory/list" className="text-ink underline underline-offset-4">
            add a free listing
          </Link>
        </p>
      </div>
    </div>
  );
}
