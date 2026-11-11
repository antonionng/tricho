import Link from "next/link";
import { Check } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { SignInOptions, safeNext } from "@/components/auth/SignInOptions";
import { pageMetadata } from "@/lib/seo";
import { images } from "@/content/images";
import { HUB_LABEL, HUB_PATH } from "@/config/consumer";

export const metadata = pageMetadata({
  title: "Create a free account for your hair and scalp",
  description:
    "Create a free Trichollective account to save hair and scalp professionals, follow your enquiries and read guides written for the public by our editorial team.",
  path: "/signup/you",
  og: { title: "Create a free account", sub: "for your hair and scalp.", eyebrow: "Trichollective", img: images.hairDetail.src, variant: "photo" },
});

const FREE = [
  "Save professionals from the directory and come back to them when you are ready",
  "See every enquiry you send in one place, with where it has got to",
  "Read guides and articles written for the public and checked by our editorial team",
  "Stay anonymous to other people with a random alias, unless you choose to show your first name",
];

export default async function ConsumerSignupPage({ searchParams }: { searchParams: Promise<{ from?: string; next?: string }> }) {
  const { from, next } = await searchParams;
  const fromFind = from === "find";
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-12 lg:px-10">
      <div className="flex flex-col gap-6 lg:col-span-6">
        <BrandMark size="md" sub />
        <h1 className="display text-5xl leading-[0.98] sm:text-6xl">
          {fromFind ? "Create a free account to keep your next steps in one place." : "Create a free account for your hair and scalp."}
        </h1>
        <p className="lede">
          {HUB_LABEL} is free, needs no card and takes a minute to set up. It is for anyone looking after their own hair and scalp.
        </p>
        <ul className="flex flex-col gap-3 border-t border-rule pt-6">
          {FREE.map((f) => (
            <li key={f} className="flex gap-3 text-[15px] text-ink-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0" /> {f}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Are you a hair or scalp professional?{" "}
          <Link href="/signup" className="text-ink underline underline-offset-4">
            Create a professional account instead
          </Link>
          . Already have an account?{" "}
          <Link href="/login" className="text-ink underline underline-offset-4">
            Sign in
          </Link>
          .
        </p>
      </div>
      <div className="lg:col-span-5 lg:col-start-8">
        <SignInOptions mode="consumer" redirectTo={safeNext(next, HUB_PATH)} />
        <p className="mt-4 text-xs text-muted-foreground">
          By creating an account you agree to our <Link href="/terms" className="underline">terms</Link> and{" "}
          <Link href="/privacy" className="underline">privacy policy</Link>.
        </p>
      </div>
    </div>
  );
}
