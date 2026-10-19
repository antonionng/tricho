import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { safeCallbackLink } from "@/lib/signin-link";

export const metadata = pageMetadata({
  title: "Sign in to Trichollective",
  description: "Press the button to finish signing in to Trichollective.",
  path: "/login/confirm",
  noindex: true,
});

/**
 * Where the sign-in email points. Loading this page spends nothing, so a mail
 * scanner that opens the link first can't use it up before the member does.
 */
export default async function ConfirmSignInPage({ searchParams }: { searchParams: Promise<{ link?: string }> }) {
  const host = (await headers()).get("host");
  const safe = safeCallbackLink((await searchParams).link, host ? [host] : []);
  // A plain GET form straight to Auth.js. A server action redirect would make Next.js
  // fetch the link on the server first, which spends the token before the browser arrives.
  const target = safe ? new URL(safe) : null;

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <BrandMark size="md" sub />
          <h1 className="display text-5xl">
            {target ? "You are one step from signing in." : "This sign-in link isn't complete."}
          </h1>
          <p className="text-[15px] leading-relaxed text-ink-2">
            {target
              ? "Press the button below and you will be signed in to Trichollective on this device."
              : "Part of the link may have been cut off. Ask for a new one and press the button in the newest email."}
          </p>
        </div>
        {target ? (
          <form method="get" action={`${target.origin}${target.pathname}`}>
            {[...target.searchParams].map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <Button type="submit" size="lg" className="h-12 w-full text-base">
              Sign in <ArrowRight />
            </Button>
          </form>
        ) : (
          <Button asChild size="lg" className="h-12 w-full text-base">
            <Link href="/login">
              Send me a new link <ArrowRight />
            </Link>
          </Button>
        )}
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
