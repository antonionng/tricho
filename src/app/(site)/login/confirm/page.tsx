import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { SignInCodeForm } from "@/components/auth/SignInCodeForm";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { AUTH_CALLBACK_PATH, allowedAuthHosts, resolveSignInFromSearch } from "@/lib/signin-link";

export const metadata = pageMetadata({
  title: "Sign in to Trichollective",
  description: "Press the button, or type the code from your email, to finish signing in to Trichollective.",
  path: "/login/confirm",
  noindex: true,
});

/**
 * Where the sign-in email points. Loading this page spends nothing, so a mail
 * scanner that opens the link first can't use it up before the member does.
 */
export default async function ConfirmSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ link?: string; token?: string; email?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const signIn = resolveSignInFromSearch(params, allowedAuthHosts(host));

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <BrandMark size="md" sub />
          <h1 className="display text-5xl">
            {signIn ? "You are one step from signing in." : "Type the code from your email."}
          </h1>
          <p className="text-[15px] leading-relaxed text-ink-2">
            {signIn
              ? "Press the button below and you will be signed in to Trichollective on this device. If you are on a different phone from the one that asked for the link, type the code from the newest email instead."
              : "The button in the email may not have opened fully, which happens often on an iPhone. You can still sign in with the code in the newest email, or ask for a new link."}
          </p>
        </div>

        {signIn ? (
          <form method="get" action={AUTH_CALLBACK_PATH}>
            <input type="hidden" name="callbackUrl" value={signIn.callbackUrl} />
            <input type="hidden" name="token" value={signIn.token} />
            <input type="hidden" name="email" value={signIn.email} />
            <Button type="submit" size="lg" className="h-12 w-full text-base">
              Sign in <ArrowRight />
            </Button>
          </form>
        ) : null}

        <div className="space-y-5 rounded-3xl border border-rule bg-card p-6 md:p-8">
          <p className="text-[15px] font-semibold text-ink">
            {signIn ? "Or type the code from your email" : "Your sign-in code"}
          </p>
          <SignInCodeForm defaultEmail={signIn?.email ?? params.email} defaultCallbackUrl={signIn?.callbackUrl ?? params.callbackUrl} />
        </div>

        <Button asChild size="lg" variant="outline" className="h-12 w-full text-base">
          <Link href="/login">
            Send me a new link <ArrowRight />
          </Link>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Need help? Email{" "}
          <a href={`mailto:${site.contactEmail}`} className="text-ink underline underline-offset-4">
            {site.contactEmail}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
