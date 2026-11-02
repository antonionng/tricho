"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { Page } from "@/content/gazette";
import { FREE_LISTING_DAYS, freeListing, subscriptionTiers, tierById } from "@/config/subscriptions";
import { Body, Kicker } from "./Prose";
import { Rise } from "./Parallax";
import { cn } from "@/lib/utils";

type Offer = Extract<Page, { kind: "cta" }>["offers"][number];

/** Plan facts come from the subscriptions config, so this page never shows an old price. */
function offerFor(kind: Offer, slug: string) {
  if (kind === "account") {
    return {
      label: "Free for every professional",
      title: "Create a free account and read every edition in full.",
      price: "Free, with a directory listing that stays free for as long as you like.",
      points: [
        "Read every edition of Trichozette in full, including the archive from 2023 to 2026",
        freeListing.features[0],
        freeListing.features[1],
      ],
      primary: { label: "Create a free account", href: `/signup?next=/trichozette/${slug}` },
      secondary: { label: "See what's included", href: "/pricing" },
      tone: "paper" as const,
    };
  }
  if (kind === "member") {
    const lowest = Math.min(...subscriptionTiers.filter((t) => t.id !== "business").map((t) => t.foundingPrice ?? t.price));
    const lowestEur = Math.min(...subscriptionTiers.filter((t) => t.id !== "business").map((t) => t.eur?.foundingPrice ?? t.eur?.price ?? Infinity));
    const community = tierById("community")!;
    return {
      label: "Membership",
      title: "Join as a member and keep the conversation going between events.",
      price: `From £${lowest} (€${lowestEur}) a month at the founding price, which you keep while you stay.`,
      // Benefits that only paid membership brings; Trichozette is free with an account.
      points: [community.features[2], community.features[0], community.features[3], community.features[4]],
      primary: { label: "Become a founding member", href: "/founding" },
      secondary: { label: "Compare plans", href: "/pricing" },
      tone: "ink" as const,
    };
  }
  const business = tierById("business")!;
  return {
    label: "For clinics, salons and brands",
    title: "List your clinic or brand where professionals look for referrals.",
    price: `Start with a free directory listing for ${FREE_LISTING_DAYS} days, or take a full business page from £${business.price} (€${business.eur?.price}) a month.`,
    points: [business.features[0], business.features[1], business.features[2]],
    primary: { label: "List your business", href: "/for-business#apply" },
    secondary: { label: `Get listed free for ${FREE_LISTING_DAYS} days`, href: "/directory/list" },
    tone: "stone" as const,
  };
}

/** Ways in: a free account, membership and a business page. Signed-in readers already have an account, so they skip that card. */
export function JoinCta({ page, index, slug, signedIn }: { page: Extract<Page, { kind: "cta" }>; index: number; slug: string; signedIn: boolean }) {
  const offers = page.offers.filter((o) => !(o === "account" && signedIn));
  return (
    <section id={`feature-${index}`} className="scroll-mt-14 bg-[#efeee9] px-5 py-24 sm:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-12">
          <Rise className="lg:col-span-5">
            <Kicker>{page.kicker}</Kicker>
            <h2 className="mag-didone mt-5 text-[52px] font-medium leading-[0.92] tracking-[-0.02em] sm:text-[80px]">{page.title}</h2>
            <p className="mag-didone mt-6 text-[22px] italic leading-[1.3] text-black/75">{page.intro}</p>
          </Rise>
          <div className="lg:col-span-6 lg:col-start-7">
            <Body blocks={page.blocks} wide />
          </div>
        </div>

        <div className="mt-16">
          <OfferCards offers={offers} slug={slug} />
        </div>
      </div>
    </section>
  );
}

/** The ways in, as cards. Used on the join page and inside the gate, where they sit on black (`onDark`). */
export function OfferCards({ offers, slug, onDark = false }: { offers: readonly Offer[]; slug: string; onDark?: boolean }) {
  const three = offers.length > 2;
  return (
    <div className={cn("grid gap-6", three ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
      {offers.map((kind, i) => {
        const o = offerFor(kind, slug);
        const dark = o.tone === "ink";
        return (
          <Rise key={kind} delay={i * 100}>
            <article
              className={cn(
                "flex h-full flex-col p-8",
                three ? "sm:p-10" : "sm:p-12",
                dark
                  ? cn("bg-[#0a0a0a] text-white", onDark && "border border-white/25 bg-[#141414]")
                  : o.tone === "stone"
                    ? "border border-black/25 bg-[#f6f5f1] text-black"
                    : "border border-black bg-[#fbfaf7] text-black"
              )}
            >
              <p className={cn("mag-caps text-[10px]", dark ? "text-white/60" : "text-black/55")}>{o.label}</p>
              <h3 className={cn("mag-didone mt-5 leading-[1.02]", three ? "text-[32px] sm:text-[36px]" : "text-[34px] sm:text-[44px]")}>{o.title}</h3>
              <p className={cn("mag-serif mt-5 text-[17px] italic leading-[1.5]", dark ? "text-white/75" : "text-black/70")}>{o.price}</p>
              <ul className={cn("mt-8 border-t", dark ? "border-white/20" : "border-black/15")}>
                {o.points.map((pt) => (
                  <li key={pt} className={cn("flex gap-3 border-b py-3.5 mag-serif text-[16px] leading-[1.5]", dark ? "border-white/15 text-white/85" : "border-black/10 text-black/85")}>
                    <Check className="mt-1 h-4 w-4 shrink-0" />
                    {pt}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-4 pt-10">
                <Link
                  href={o.primary.href}
                  className={cn(
                    "inline-flex h-14 items-center gap-2 rounded-full px-7 text-[15px] font-medium transition-opacity hover:opacity-90",
                    dark ? "bg-white text-black" : "bg-black text-white"
                  )}
                >
                  {o.primary.label} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={o.secondary.href} className="mag-caps text-[10px] underline underline-offset-4">
                  {o.secondary.label}
                </Link>
              </div>
            </article>
          </Rise>
        );
      })}
    </div>
  );
}
