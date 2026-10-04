import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";

export const metadata = pageMetadata({
  title: "We couldn't sign you in",
  description: "Something stopped you signing in to Trichollective.",
  path: "/login/error",
  noindex: true,
});

/** Calm explanations for the error codes Auth.js sends to this page. */
const MESSAGES: Record<string, { title: string; body: string }> = {
  Verification: {
    title: "This sign-in link has expired or has already been used.",
    body: "Each link works once and lasts for 24 hours. Ask for a new link below and use the newest email we send you.",
  },
  AccessDenied: {
    title: "This account can't sign in at the moment.",
    body: `If you think this is a mistake, please email ${site.contactEmail} and a person will look into it for you.`,
  },
  Configuration: {
    title: "Sign-in isn't working on our side at the moment.",
    body: "This is a problem with our setup, not with your account. Please try again in a few minutes.",
  },
  Default: {
    title: "We couldn't sign you in just now.",
    body: "Please go back and try again. If it keeps happening, email us and a person will help you in.",
  },
};

export default async function SignInErrorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = MESSAGES[error ?? ""] ?? MESSAGES.Default;
  const expired = error === "Verification";

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <BrandMark size="md" sub />
          <h1 className="display text-4xl leading-tight">{message.title}</h1>
          <p className="text-[15px] leading-relaxed text-ink-2">{message.body}</p>
        </div>
        <Button asChild size="lg" className="h-12 w-full text-base">
          <Link href="/login">
            {expired ? "Send me a new link" : "Back to sign in"} <ArrowRight />
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
