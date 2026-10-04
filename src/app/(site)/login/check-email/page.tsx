import { cookies } from "next/headers";
import { MailCheck } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { cleanEmail, SIGNIN_EMAIL_COOKIE } from "@/lib/signin-email";
import { resendSignInLink, startWithDifferentEmail } from "./actions";

export const metadata = pageMetadata({
  title: "Check your email",
  description: "We have sent you a link to sign in to Trichollective.",
  path: "/login/check-email",
  noindex: true,
});

/** Where Auth.js sends people after they ask for a sign-in link. */
export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ resent?: string }> }) {
  const { resent } = await searchParams;
  // The address comes from a short-lived httpOnly cookie, never from the URL.
  const email = cleanEmail((await cookies()).get(SIGNIN_EMAIL_COOKIE)?.value);

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <BrandMark size="md" sub />
          <h1 className="display text-5xl">Check your email.</h1>
          <p className="text-[15px] leading-relaxed text-ink-2">
            {email ? (
              <>
                We have sent a sign-in link to <strong className="block break-all font-semibold text-ink sm:inline">{email}</strong>.
              </>
            ) : (
              "We have sent a sign-in link to your email address."
            )}{" "}
            Open your email app and tap the link to sign in.
          </p>
        </div>

        <div className="space-y-5 rounded-3xl border border-rule bg-card p-6 md:p-8">
          <MailCheck className="h-7 w-7 stroke-[1.5]" aria-hidden />
          {resent === "1" && (
            <p role="status" className="rounded-2xl bg-paper-2 px-4 py-3 text-[15px] text-ink">
              We have sent a new link. Please use the newest email, because each link works only once.
            </p>
          )}
          {resent === "0" && (
            <p role="alert" className="text-[15px] text-destructive">
              We couldn&apos;t send another link just now. Please wait a moment and try again.
            </p>
          )}
          <ul className="space-y-3 text-[15px] leading-relaxed text-ink-2">
            <li>The link works once and expires after 24 hours, so there is no password to remember.</li>
            <li>If it has not arrived within a couple of minutes, please check your spam, junk or promotions folder.</li>
            <li>Open the link on this device if you can, so you go straight into your account.</li>
          </ul>
          <div className="flex flex-col gap-3 pt-1">
            {email && (
              <form action={resendSignInLink}>
                <Button type="submit" variant="outline" size="lg" className="h-12 w-full text-base">
                  Send the link again
                </Button>
              </form>
            )}
            <form action={startWithDifferentEmail}>
              <Button type="submit" variant="outline" size="lg" className="h-12 w-full text-base">
                Use a different email
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Still having trouble? Email{" "}
          <a href={`mailto:${site.contactEmail}`} className="text-ink underline underline-offset-4">
            {site.contactEmail}
          </a>{" "}
          and a person will help you in.
        </p>
      </div>
    </div>
  );
}
