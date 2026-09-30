import Link from "next/link";
import { Check } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { SignInOptions, safeNext } from "@/components/auth/SignInOptions";
import { FREE_LISTING_DAYS } from "@/config/subscriptions";
import { pageMetadata } from "@/lib/seo";
import { images } from "@/content/images";

export const metadata = pageMetadata({
  title: "Create a free account",
  description: `Create a free Trichollective account to add your founding directory listing for ${FREE_LISTING_DAYS} days, read Trichozette and follow the news for hair and scalp professionals.`,
  path: "/signup",
  og: { title: "Create a free account", sub: "and join the founding directory.", eyebrow: "Trichollective Online", img: images.ed12.src, variant: "photo" },
});

const FREE = [
  `A founding listing in the public directory, free for ${FREE_LISTING_DAYS} days`,
  "The opening features of every Trichozette edition, including four years in review",
  "News for practitioners, with a source for every story",
  "First notice of conferences, masterclasses and case rounds",
];

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-12 lg:px-10">
      <div className="flex flex-col gap-6 lg:col-span-6">
        <BrandMark size="md" sub />
        <h1 className="display text-5xl leading-[0.98] sm:text-6xl">
          Create a free account and join the founding directory.
        </h1>
        <p className="lede">
          It takes a minute and needs no card. You can become a member later, whenever you want peer review, CPD and the
          referral network.
        </p>
        <ul className="flex flex-col gap-3 border-t border-rule pt-6">
          {FREE.map((f) => (
            <li key={f} className="flex gap-3 text-[15px] text-ink-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0" /> {f}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-ink underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
      <div className="lg:col-span-5 lg:col-start-8">
        <SignInOptions mode="signup" redirectTo={safeNext(next, "/members/onboarding")} />
        <p className="mt-4 text-xs text-muted-foreground">
          By creating an account you agree to our <Link href="/terms" className="underline">terms</Link> and{" "}
          <Link href="/privacy" className="underline">privacy policy</Link>.
        </p>
      </div>
    </div>
  );
}
