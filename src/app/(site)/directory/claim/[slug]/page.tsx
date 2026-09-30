import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Container } from "@/components/site/primitives";
import { CheckoutButton } from "@/components/site/CheckoutButton";
import { Button } from "@/components/ui/button";
import { listingBySlug, isClaimed } from "@/lib/directory";
import { tierById } from "@/config/subscriptions";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return pageMetadata({
    title: "Claim your listing",
    description: "Claim your Trichollective directory listing to add your photo, services and website and receive enquiries.",
    path: `/directory/claim/${(await params).slug}`,
    noindex: true,
  });
}

export default async function ClaimPage({ params }: { params: Promise<{ slug: string }> }) {
  const listing = await listingBySlug((await params).slug);
  if (!listing) notFound();
  const pro = tierById("professional")!;

  if (isClaimed(listing)) {
    return (
      <Container size="narrow" className="py-24 text-center">
        <h1 className="display text-5xl">This listing is already claimed.</h1>
        <p className="lede mt-4">If you think that&apos;s a mistake, please get in touch and we&apos;ll sort it out.</p>
        <Button asChild className="mt-8"><Link href={`/directory/p/${listing.slug}`}>Back to the listing</Link></Button>
      </Container>
    );
  }

  return (
    <Container size="narrow" className="py-20 md:py-28">
      <p className="label text-muted-foreground">Claim your listing</p>
      <h1 className="display mt-5 text-5xl md:text-6xl">
        {listing.name},
        <br />
        <span className="text-fade">claim your listing and receive enquiries directly.</span>
      </h1>
      <p className="lede mt-6">
        Claiming turns your founding listing into a full profile, keeps you in the directory beyond your
        free 90 days, and delivers any enquiries that are already waiting for you.
      </p>
      <ul className="mt-10 flex flex-col gap-4 border-y border-rule py-8">
        {[
          "Add your photo, a headline, your services and your website",
          "Receive enquiries from the public straight to your inbox",
          "Keep your founding badge for as long as you stay",
          "Join the community, the Case Room and the referral network",
        ].map((t) => (
          <li key={t} className="flex gap-3 text-[16px] text-ink-2">
            <Check className="mt-0.5 h-5 w-5 shrink-0" /> {t}
          </li>
        ))}
      </ul>
      <div className="mt-10 rounded-3xl border border-rule bg-card p-6 md:p-8">
        <p className="text-[15px] text-ink-2">
          Pay with <strong className="text-ink">the same email address you used for your listing</strong>, and
          it is claimed automatically.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <CheckoutButton plan="professional" founding size="lg">
            Claim with Professional · £{pro.foundingPrice ?? pro.price}/month
          </CheckoutButton>
          <Link href="/pricing" className="text-sm underline underline-offset-4">Compare plans</Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Founding price, kept while you stay. Cancel anytime.</p>
      </div>
    </Container>
  );
}
