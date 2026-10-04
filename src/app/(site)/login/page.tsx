import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { SignInOptions, safeNext } from "@/components/auth/SignInOptions";
import { pageMetadata } from "@/lib/seo";
import { cookies } from "next/headers";
import { cleanEmail, SIGNIN_EMAIL_COOKIE } from "@/lib/signin-email";

export const metadata = pageMetadata({
  title: "Sign in",
  description: "Sign in to your Trichollective account.",
  path: "/login",
  noindex: true,
});

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Set on /welcome after paying, so the email paid with is already filled in.
  const paidEmail = cleanEmail((await cookies()).get(SIGNIN_EMAIL_COOKIE)?.value) ?? undefined;
  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <BrandMark size="md" sub />
          <h1 className="display text-5xl">{paidEmail ? "Sign in to set up your profile." : "Welcome back to the collective."}</h1>
          <p className="text-[15px] text-ink-2">
            {paidEmail
              ? "Thank you for joining. We have filled in the email address you paid with, so you only need to send yourself the link."
              : "Sign in with the email address you joined with. If you paid before creating an account, use the email from your receipt."}
          </p>
        </div>
        <SignInOptions mode="signin" redirectTo={safeNext(next, "/members")} defaultEmail={paidEmail} />
        <p className="text-center text-sm text-muted-foreground">
          New to Trichollective?{" "}
          <Link href="/signup" className="text-ink underline underline-offset-4">
            Create a free account
          </Link>
        </p>
      </div>
    </div>
  );
}
