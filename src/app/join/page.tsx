"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { subscriptionTiers } from "@/config/subscriptions";
import { Check } from "lucide-react";

export default function JoinPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubscribe = async (tierId: string, priceId: string | undefined) => {
    setError(null);
    if (!priceId) {
      setError(
        "This plan isn't connected to Stripe yet. Add the price ID to your environment to enable checkout."
      );
      return;
    }
    try {
      setLoading(tierId);
      const response = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId }),
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Could not start checkout. Please try again.");
      }
    } catch {
      setError("Could not start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#D1D0CB] py-24 px-4">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <span className="tricho-caps text-black/40">Membership</span>
          <h1 className="text-5xl md:text-7xl tricho-title uppercase tracking-tighter">
            Join the Collective
          </h1>
          <p className="font-sans font-medium text-black/60">
            One membership for every hair & scalp professional. Plus partnership tiers
            for brands and exhibitors.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-12 border border-black/20 bg-white/50 p-4 text-sm text-center font-sans">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {subscriptionTiers.map((tier) => {
            const featured = tier.featured;
            return (
              <div
                key={tier.id}
                className={
                  featured
                    ? "p-10 bg-black text-[#D1D0CB] lg:scale-105 shadow-2xl flex flex-col"
                    : "p-10 border border-black/10 bg-white/30 flex flex-col"
                }
              >
                <div className="space-y-2 mb-8">
                  {featured && (
                    <span className="tricho-caps text-[10px] bg-[#D1D0CB] text-black px-2 py-1 w-fit inline-block">
                      Most Popular
                    </span>
                  )}
                  <h3 className="tricho-caps text-lg">{tier.name}</h3>
                  <p className="text-4xl font-sans font-black">
                    £{tier.price}
                    <span className="text-base font-medium opacity-60">
                      /{tier.interval}
                    </span>
                  </p>
                  {tier.tagline && (
                    <p
                      className={`font-sans text-xs ${featured ? "opacity-60" : "text-black/50"}`}
                    >
                      {tier.tagline}
                    </p>
                  )}
                </div>

                <ul className="space-y-3 flex-grow mb-10">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-sans">
                      <Check
                        className={`h-4 w-4 mt-0.5 shrink-0 ${featured ? "text-[#D1D0CB]" : "text-black"}`}
                      />
                      <span className={featured ? "opacity-90" : "text-black/70"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => onSubscribe(tier.id, tier.stripePriceId)}
                  disabled={loading !== null}
                  className={
                    featured
                      ? "tricho-caps w-full rounded-none bg-[#D1D0CB] text-black hover:bg-white h-14"
                      : "tricho-caps w-full rounded-none bg-black text-[#D1D0CB] hover:bg-black/80 h-14"
                  }
                >
                  {loading === tier.id ? "Loading…" : `Choose ${tier.name}`}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
