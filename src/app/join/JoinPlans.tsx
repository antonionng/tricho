"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import type { SubscriptionTier } from "@/config/subscriptions";
import { PROFESSIONS } from "@/config/rooms";

type PublicTier = Pick<
  SubscriptionTier,
  "id" | "name" | "price" | "interval" | "featured" | "tagline" | "features" | "stripePriceId"
>;

export function JoinPlans({ tiers }: { tiers: PublicTier[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profession, setProfession] = useState("clinical");

  const onSubscribe = async (tierId: string, priceId: string | undefined) => {
    setError(null);
    if (!priceId) {
      setError(
        "This plan is not connected to Stripe yet. Add price IDs in your environment, or use Dev Login locally to explore the portal."
      );
      return;
    }
    try {
      setLoading(tierId);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, profession }),
      });
      if (response.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(`/join?tier=${tierId}`)}`;
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (response.status === 503) {
        setError(
          data.error ||
            "Stripe is not configured yet. Add STRIPE_SECRET_KEY to enable checkout."
        );
        return;
      }
      if (!response.ok) {
        setError("Could not start checkout. Please try again.");
        return;
      }
      if (data.url) window.location.href = data.url;
      else setError("Could not start checkout. Please try again.");
    } catch {
      setError("Could not start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto mb-10 rounded-3xl border border-black/10 bg-card/80 p-5 space-y-3">
        <label className="text-sm font-medium">I am joining as</label>
        <select
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
          className="w-full h-11 rounded-xl border border-border/60 bg-background px-3 text-sm"
        >
          {PROFESSIONS.filter((p) => p.id !== "brand").map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} — {p.blurb}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          This chooses your home room and Tricho-AI prompts. It does not change the £12 price.{" "}
          Only want to be found?{" "}
          <Link href="/directory/list" className="text-primary hover:underline">
            List for free
          </Link>
        </p>
      </div>

      {error && (
        <p className="max-w-2xl mx-auto mb-8 rounded-xl border border-border bg-card px-4 py-3 text-sm text-center">
          {error}
        </p>
      )}

      <div id="business" className="grid md:grid-cols-3 gap-5 items-start">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={
              tier.featured
                ? "rounded-3xl bg-primary text-primary-foreground p-8 flex flex-col md:scale-[1.02]"
                : "rounded-3xl border border-black/10 bg-card/80 p-8 flex flex-col"
            }
          >
            {tier.featured && (
              <span className="text-xs font-medium bg-primary-foreground/15 rounded-2xl px-3 py-1 w-fit mb-3">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-semibold">{tier.name}</h3>
            <p className="mt-2 text-3xl font-semibold">
              £{tier.price}
              <span className="text-sm font-normal opacity-70">/{tier.interval}</span>
            </p>
            {tier.tagline && (
              <p className={`text-sm mt-2 ${tier.featured ? "opacity-80" : "text-muted-foreground"}`}>
                {tier.tagline}
              </p>
            )}
            <ul className="mt-6 space-y-3 flex-grow">
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm">
                  <Check className="h-4 w-4 mt-0.5 shrink-0" />
                  <span className={tier.featured ? "opacity-95" : "text-foreground/80"}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              onClick={() => onSubscribe(tier.id, tier.stripePriceId)}
              disabled={loading !== null}
              className={
                tier.featured
                  ? "mt-8 rounded-2xl h-12 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                  : "mt-8 rounded-2xl h-12"
              }
            >
              {loading === tier.id ? "Loading…" : `Choose ${tier.name}`}
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
