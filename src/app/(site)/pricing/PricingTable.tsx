"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/site/CheckoutButton";
import { CurrencyToggle } from "@/components/site/CurrencyToggle";
import { money, useCurrency, type Currency } from "@/components/site/useCurrency";
import { cn } from "@/lib/utils";
import { site } from "@/config/site";
import {
  FOUNDING_MEMBER_PLACES,
  freeListing,
  premiumBusiness,
  subscriptionTiers,
  type BillingInterval,
  type SubscriptionTier,
} from "@/config/subscriptions";

/** A tier's prices in the chosen currency. Falls back to pounds if a tier has no euro prices. */
function pricesFor(t: SubscriptionTier, currency: Currency) {
  if (currency === "eur" && t.eur) {
    return {
      currency: "eur" as const,
      price: t.eur.price,
      founding: t.eur.foundingPrice,
      annual: t.eur.annualPrice,
      foundingAnnual: t.eur.foundingAnnualPrice,
    };
  }
  return {
    currency: "gbp" as const,
    price: t.price,
    founding: t.foundingPrice,
    annual: t.annualPrice,
    foundingAnnual: t.foundingAnnualPrice,
  };
}

function FeatureList({ features, excludes = [] }: { features: string[]; excludes?: string[] }) {
  return (
    <ul className="flex flex-col gap-3 text-[15px]">
      {features.map((f) => (
        <li key={f} className="flex gap-3">
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{f}</span>
        </li>
      ))}
      {excludes.map((f) => (
        <li key={f} className="flex gap-3 text-muted-foreground">
          <Minus className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            <span className="sr-only">Not included: </span>
            {f}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PlanCard({
  tier,
  interval,
  currency,
  foundingOpen,
}: {
  tier: SubscriptionTier;
  interval: BillingInterval;
  currency: Currency;
  foundingOpen: boolean;
}) {
  const dark = !!tier.featured;
  const annual = interval === "year";
  const p = pricesFor(tier, currency);
  const foundingAmount = annual ? p.foundingAnnual : p.founding;
  const useFounding = foundingOpen && !!foundingAmount;
  const standard = annual ? p.annual : p.price;
  const shown = useFounding ? foundingAmount! : standard;
  const unit = annual ? "/yr" : "/mo";
  const soft = dark ? "text-paper/70" : "text-muted-foreground";

  return (
    <article
      id={tier.id}
      className={cn(
        "flex scroll-mt-28 flex-col gap-6 rounded-3xl border p-7",
        dark ? "border-ink bg-ink text-paper" : "border-rule bg-card"
      )}
    >
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className={cn("label", soft)}>{tier.name}</p>
          {dark && (
            <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium leading-none text-ink">
              Recommended for practitioners
            </span>
          )}
        </div>
        <p className="display text-5xl">
          {money(p.currency, shown)}
          <span className="text-base font-normal opacity-60">{unit}</span>
        </p>
        <p className={cn("text-sm", soft)}>
          {useFounding ? (
            <>
              Founding price, kept for as long as you stay.{" "}
              <s aria-label={`Standard price ${money(p.currency, standard)} ${annual ? "a year" : "a month"}`}>
                {money(p.currency, standard)}
              </s>{" "}
              once founding places have gone.
            </>
          ) : annual ? (
            `Two months free compared with ${money(p.currency, p.price * 12)} paid monthly.`
          ) : (
            "Billed monthly. Cancel anytime."
          )}
        </p>
      </header>
      <p className={cn("text-[15px] leading-relaxed", dark ? "text-paper/80" : "text-ink-2")}>{tier.audience}.</p>
      <FeatureList features={tier.features} />
      <div className="mt-auto pt-2">
        <CheckoutButton
          plan={tier.id}
          interval={interval}
          founding={useFounding}
          currency={p.currency}
          variant={dark ? "paper" : "outline"}
          errorTone={dark ? "ink" : "paper"}
          className="w-full"
        >
          {useFounding ? `Join at ${money(p.currency, shown)}` : `Choose ${tier.name}`}
        </CheckoutButton>
      </div>
    </article>
  );
}

export function PricingTable({
  foundingPlacesLeft,
  partnerPlacesLeft,
}: {
  /** Founding places for individual members still genuinely available. */
  foundingPlacesLeft: number;
  /** Founding Premium Business places still available. */
  partnerPlacesLeft: number;
}) {
  const [interval, setBilling] = useState<BillingInterval>("month");
  const [currency, setCurrency] = useCurrency();
  const annual = interval === "year";
  const foundingOpen = foundingPlacesLeft > 0;
  const individual = subscriptionTiers.filter((t) => t.id !== "business");
  const business = subscriptionTiers.find((t) => t.id === "business");
  const partnerFoundingOpen = partnerPlacesLeft > 0;

  return (
    <div className="flex flex-col gap-10">
      {/* Billing period and currency */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border border-rule bg-card p-1">
            {(
              [
                { id: "month", label: "Monthly" },
                { id: "year", label: "Annual" },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={interval === o.id}
                onClick={() => setBilling(o.id)}
                className={cn(
                  "h-10 rounded-full px-5 text-sm font-medium transition-colors",
                  interval === o.id ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <CurrencyToggle value={currency} onChange={setCurrency} />
        </div>
        <p className="text-center text-sm text-muted-foreground" aria-live="polite">
          {annual
            ? "Pay once a year and get two months free."
            : "Pay monthly and cancel whenever you like."}{" "}
          {foundingOpen && "Founding prices are kept for as long as you stay a member."}
        </p>
        {foundingOpen && (
          <p className="label text-center text-ink">
            {foundingPlacesLeft} of {FOUNDING_MEMBER_PLACES} founding places remaining
          </p>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {/* Free account */}
        <article id="free" className="flex scroll-mt-28 flex-col gap-6 rounded-3xl border border-rule bg-card p-7 md:col-span-2 xl:col-span-1">
          <header className="flex flex-col gap-3">
            <p className="label text-muted-foreground">{freeListing.name}</p>
            <p className="display text-5xl">Free</p>
            <p className="text-sm text-muted-foreground">No card needed. Your basic listing stays free for good.</p>
          </header>
          <p className="text-[15px] leading-relaxed text-ink-2">{freeListing.summary}</p>
          <FeatureList features={freeListing.features} excludes={freeListing.excludes} />
          <div className="mt-auto pt-2">
            <Button asChild size="lg" variant="outline" className="w-full">
              <Link href="/signup">
                Create a free account <ArrowRight />
              </Link>
            </Button>
          </div>
        </article>

        {individual.map((t) => (
          <PlanCard key={t.id} tier={t} interval={interval} currency={currency} foundingOpen={foundingOpen} />
        ))}
      </div>

      {/* For business */}
      <div id="for-business" className="flex scroll-mt-28 flex-col gap-6 border-t border-rule pt-14">
        <div className="flex max-w-2xl flex-col gap-3">
          <p className="label text-muted-foreground">For business</p>
          <h2 className="display text-4xl sm:text-5xl">
            Reach the practitioners who recommend,
            <br />
            <span className="text-fade">and give your team membership.</span>
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {business && (() => {
            const p = pricesFor(business, currency);
            const shown = annual ? p.annual : p.price;
            return (
              <article id="business" className="flex scroll-mt-28 flex-col gap-6 rounded-3xl border border-rule bg-card p-7">
                <header className="flex flex-col gap-3">
                  <p className="label text-muted-foreground">{business.name}</p>
                  <p className="display text-5xl">
                    {money(p.currency, shown)}
                    <span className="text-base font-normal opacity-60">{annual ? "/yr" : "/mo"}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {annual
                      ? `Two months free compared with ${money(p.currency, p.price * 12)} paid monthly.`
                      : "Billed monthly. Cancel anytime."}
                  </p>
                </header>
                <p className="text-[15px] leading-relaxed text-ink-2">{business.audience}.</p>
                <FeatureList features={business.features} />
                <p className="text-[15px] text-ink-2">
                  Need more than five seats?{" "}
                  <a href={`mailto:${site.contactEmail}?subject=Business%20seats`} className="text-ink underline underline-offset-4">
                    Talk to us
                  </a>{" "}
                  and we will set up the right number for your team.
                </p>
                <div className="mt-auto pt-2">
                  <CheckoutButton plan="business" interval={interval} currency={p.currency} variant="outline" className="w-full">
                    Choose {business.name}
                  </CheckoutButton>
                </div>
              </article>
            );
          })()}

          <article id="premium" className="flex scroll-mt-28 flex-col gap-6 rounded-3xl border border-ink bg-ink p-7 text-paper">
            <header className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <p className="label text-paper/70">{premiumBusiness.name}</p>
                <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium leading-none text-ink">
                  Join online
                </span>
              </div>
              <p className="display text-5xl">
                {money("gbp", partnerFoundingOpen ? premiumBusiness.foundingAnnualPrice : premiumBusiness.annualPrice)}
                <span className="text-base font-normal opacity-60">/yr</span>
              </p>
              <p className="text-sm text-paper/70">
                {partnerFoundingOpen ? (
                  <>
                    Founding partner price for the first {premiumBusiness.foundingPlaces}, kept while you stay.{" "}
                    <s aria-label={`Standard price ${money("gbp", premiumBusiness.annualPrice)} a year`}>
                      {money("gbp", premiumBusiness.annualPrice)}
                    </s>{" "}
                    a year after that.
                  </>
                ) : (
                  "Billed yearly, and your partner page goes live as soon as you join."
                )}
                {currency === "eur" && " Priced in pounds sterling."}
              </p>
              {partnerFoundingOpen && (
                <p className="label text-paper">
                  {partnerPlacesLeft} of {premiumBusiness.foundingPlaces} founding partner places remaining
                </p>
              )}
            </header>
            <p className="text-[15px] leading-relaxed text-paper/80">{premiumBusiness.audience}.</p>
            <FeatureList features={premiumBusiness.features} />
            <p className="text-sm text-paper/70">
              Everything you sponsor is clearly labelled and reviewed so that it teaches rather than sells, so members
              trust what they see from you.
            </p>
            <div className="mt-auto pt-2">
              <CheckoutButton plan="premium" interval="year" variant="paper" errorTone="ink" className="w-full">
                Join {premiumBusiness.name}
              </CheckoutButton>
            </div>
          </article>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">Prices include VAT where applicable.</p>
    </div>
  );
}
