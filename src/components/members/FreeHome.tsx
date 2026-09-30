import Link from "next/link";
import { ArrowRight, Check, Clock, ListChecks } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CheckoutButton } from "@/components/site/CheckoutButton";
import { Cover } from "@/components/gazette/Cover";
import { editions } from "@/content/gazette";
import { FREE_LISTING_DAYS, tierById } from "@/config/subscriptions";
import { Card, MemberPage, SectionLabel } from "./MemberPage";
import { firstName } from "@/lib/community";

const longDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** Home for signed-in people without a paid plan: their listing, what's free, and a clear way up. */
export async function FreeHome({ userId, email }: { userId: string; email: string }) {
  const [user, listing] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    email
      ? prisma.directoryListing.findFirst({
          where: { email: email.toLowerCase(), status: { in: ["pending", "listed", "invited"] } },
          orderBy: { createdAt: "desc" },
          select: { status: true, slug: true, freeUntil: true, kind: true },
        })
      : null,
  ]);
  const community = tierById("community")!;
  const pro = tierById("professional")!;
  const name = firstName(user?.name) || "there";

  return (
    <MemberPage>
      <header className="flex flex-col gap-3">
        <p className="label text-muted-foreground">Free account</p>
        <h1 className="display text-4xl sm:text-5xl">Welcome, {name}. Your free account is ready.</h1>
        <p className="max-w-2xl text-[16px] leading-relaxed text-ink-2">
          You can be found in the founding directory and read Trichozette today. Membership adds the Case Room, peer
          review, CPD and the referral network whenever you are ready.
        </p>
      </header>

      {/* Listing status */}
      <Card className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper-2">
            {listing?.status === "listed" ? <Check className="h-5 w-5" /> : listing?.status === "pending" ? <Clock className="h-5 w-5" /> : <ListChecks className="h-5 w-5" />}
          </span>
          <div>
            <p className="font-semibold">
              {!listing || listing.status === "invited"
                ? `Add your free founding listing, live for ${FREE_LISTING_DAYS} days.`
                : listing.status === "pending"
                  ? "Your founding listing is being checked by a person."
                  : listing.kind === "member"
                    ? "Your full directory profile is live."
                    : `Your founding listing is live${listing.freeUntil ? ` until ${longDate(listing.freeUntil)}` : ""}.`}
            </p>
            <p className="mt-1 text-sm text-ink-2">
              {!listing || listing.status === "invited"
                ? "People searching for a hair and scalp professional near them will be able to find you."
                : listing.status === "pending"
                  ? "We check every listing by hand, usually within two working days, and email you when it is live."
                  : "Upgrade to Professional to add your photo, services and website, and to receive enquiries directly."}
            </p>
          </div>
        </div>
        {!listing || listing.status === "invited" ? (
          <Link href="/directory/list" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-paper">
            Add my listing <ArrowRight className="h-4 w-4" />
          </Link>
        ) : listing.slug && listing.status === "listed" ? (
          <Link href={`/directory/p/${listing.slug}`} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-ink/20 px-5 text-sm font-medium">
            View my listing <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </Card>

      {/* Upgrade */}
      <SectionLabel className="mt-12">Become a founding member</SectionLabel>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <div>
            <p className="label text-muted-foreground">Community</p>
            <p className="display mt-2 text-4xl">
              £{community.foundingPrice}
              <span className="text-base font-normal text-muted-foreground"> a month, founding price</span>
            </p>
          </div>
          <ul className="flex flex-col gap-2 text-[15px] text-ink-2">
            {community.features.slice(0, 4).map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-1 h-4 w-4 shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <CheckoutButton plan="community" founding variant="outline" size="default" wrapperClassName="mt-auto">
            Join Community at £{community.foundingPrice} a month
          </CheckoutButton>
        </Card>
        <Card className="flex flex-col gap-4 bg-ink text-paper">
          <div>
            <p className="label text-paper/60">Professional</p>
            <p className="display mt-2 text-4xl">
              £{pro.foundingPrice}
              <span className="text-base font-normal text-paper/60"> a month, founding price</span>
            </p>
          </div>
          <ul className="flex flex-col gap-2 text-[15px] text-paper/80">
            {pro.features.slice(0, 5).map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-1 h-4 w-4 shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <CheckoutButton plan="professional" founding variant="paper" size="default" errorTone="ink" wrapperClassName="mt-auto">
            Join Professional at £{pro.foundingPrice} a month
          </CheckoutButton>
        </Card>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Founding members keep their founding price for as long as they stay. You can cancel at any time.</p>

      {/* Free reading */}
      <SectionLabel className="mt-12">Free to read with your account</SectionLabel>
      <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {editions.slice(0, 4).map((e) => (
          <li key={e.slug}>
            <Link href={`/trichozette/${e.slug}`} className="group block">
              <Cover edition={e} sizes="(min-width:640px) 22vw, 45vw" />
              <p className="mt-2 text-sm font-semibold leading-snug">{e.title}</p>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link href="/news" className="underline underline-offset-4">Latest news for practitioners</Link>
        <Link href="/guides" className="underline underline-offset-4">Guides to share with clients</Link>
        <Link href="/events" className="underline underline-offset-4">Upcoming conferences and masterclasses</Link>
      </div>
    </MemberPage>
  );
}
