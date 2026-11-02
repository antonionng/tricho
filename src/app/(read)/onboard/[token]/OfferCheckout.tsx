"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CreditCard } from "lucide-react";
import { loadStripe, type StripeEmbeddedCheckout } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { startOfferCheckout } from "./actions";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

/**
 * Pay by card. With the publishable key set, Stripe's card form opens right here in the page;
 * without it, the button goes to Stripe's own secure page and comes back here when paid.
 */
export function OfferCheckout({ token, label, disabled }: { token: string; label: string; disabled?: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "open" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const mount = useRef<HTMLDivElement>(null);
  const checkout = useRef<StripeEmbeddedCheckout | null>(null);

  useEffect(() => () => checkout.current?.destroy(), []);

  async function start() {
    setState("loading");
    setError(null);
    const result = await startOfferCheckout(token);
    if ("error" in result) {
      setError(result.error);
      setState("error");
      return;
    }
    if ("url" in result) {
      window.location.assign(result.url);
      return;
    }
    const stripe = publishableKey ? await loadStripe(publishableKey) : null;
    if (!stripe || !mount.current) {
      setError("The card form could not load. Please refresh the page, or ask us for an invoice.");
      setState("error");
      return;
    }
    checkout.current = await stripe.initEmbeddedCheckout({ clientSecret: result.clientSecret });
    checkout.current.mount(mount.current);
    setState("open");
  }

  return (
    <div className="flex flex-col gap-4">
      {state !== "open" && (
        <Button
          type="button"
          size="xl"
          onClick={start}
          disabled={disabled || state === "loading"}
          className="h-14 w-full text-base sm:w-auto sm:self-start"
        >
          <CreditCard /> {state === "loading" ? "Opening secure payment" : label} <ArrowRight />
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div ref={mount} className={state === "open" ? "overflow-hidden rounded-2xl border border-rule bg-white" : "hidden"} />
    </div>
  );
}
