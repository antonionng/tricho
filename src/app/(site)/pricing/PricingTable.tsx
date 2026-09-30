"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/site/CheckoutButton";
import { cn } from "@/lib/utils";
import {
  FREE_LISTING_DAYS,
  freeListing,
  subscriptionTiers,
  type BillingInterval,
} from "@/config/subscriptions";

export function PricingTable() {
  const [interval, setBilling] = useState<BillingInterval>("month");
  const annual = interval === "year";

  return (
    <div className="flex flex-col gap-10">
      {/* Monthly / annual toggle */}
      <div className="flex flex-col items-center gap-3">
        <div
          role="radiogroup"
          aria-label="Billing period"
          className="inline-flex rounded-full border border-rule bg-card p-1"
        >
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
        <p className="text-center text-sm text-muted-foreground" aria-live="polite">
          {annual
            ? "Pay once a year and get two months free. Founding prices are monthly only."
            : "Founding prices are kept for as long as you stay a member."}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {/* Founding listing */}
        <article className="flex flex-col gap-6 rounded-3xl border border-rule bg-card p-7">
          <header className="flex flex-col gap-3">
            <p className="label text-muted-foreground">{freeListing.name}</p>
            <p className="display text-5xl">Free</p>
            <p className="text-sm text-muted-foreground">For your first {FREE_LISTING_DAYS} days</p>
          </header>
          <p className="text-[15px] leading-relaxed text-ink-2">{freeListing.summary}</p>
          <ul className="flex flex-col gap-3 text-[15px]">
            {freeListing.features.map((f) => (
              <li key={f} className="flex gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{f}</span>
              </li>
            ))}
            {freeListing.excludes.map((f) => (
              <li key={f} className="flex gap-3 text-muted-foreground">
                <Minus className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  <span className="sr-only">Not included: </span>
                  {f}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-2">
            <Button asChild size="lg" variant="outline" className="w-full">
              <Link href="/directory/list">
                List free for {FREE_LISTING_DAYS} days <ArrowRight />
              </Link>
            </Button>
          </div>
        </article>

        {subscriptionTiers.map((t) => {
          const dark = !!t.featured;
          const useFounding = !annual && !!t.foundingPrice;
          return (
            <article
              key={t.id}
              id={t.id}
              className={cn(
                "flex scroll-mt-28 flex-col gap-6 rounded-3xl border p-7",
                dark ? "border-ink bg-ink text-paper" : "border-rule bg-card"
              )}
            >
              <header className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className={cn("label", dark ? "text-paper/70" : "text-muted-foreground")}>{t.name}</p>
                  {dark && (
                    <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium leading-none text-ink">
                      Recommended for practitioners
                    </span>
                  )}
                </div>
                {annual ? (
                  <>
                    <p className="display text-5xl">
                      £{t.annualPrice}
                      <span className="text-base font-normal opacity-60">/yr</span>
                    </p>
                    <p className={cn("text-sm", dark ? "text-paper/70" : "text-muted-foreground")}>
                      Two months free. £{t.price * 12} if paid monthly.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="display text-5xl">
                      £{t.foundingPrice ?? t.price}
                      <span className="text-base font-normal opacity-60">/mo</span>
                    </p>
                    <p className={cn("text-sm", dark ? "text-paper/70" : "text-muted-foreground")}>
                      {t.foundingPrice ? (
                        <>
                          Founding price.{" "}
                          <s aria-label={`Standard price £${t.price} a month`}>£{t.price}</s> after founding
                          places go.
                        </>
                      ) : (
                        "Billed monthly. Cancel anytime."
                      )}
                    </p>
                  </>
                )}
              </header>
              <p className={cn("text-[15px] leading-relaxed", dark ? "text-paper/80" : "text-ink-2")}>
                {t.audience}.
              </p>
              <ul className="flex flex-col gap-3 text-[15px]">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-2">
                <CheckoutButton
                  plan={t.id}
                  interval={interval}
                  founding={useFounding}
                  variant={dark ? "paper" : "outline"}
                  errorTone={dark ? "ink" : "paper"}
                  className="w-full"
                >
                  {useFounding ? `Join at £${t.foundingPrice}` : `Choose ${t.name}`}
                </CheckoutButton>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
