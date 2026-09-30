"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BillingInterval, PlanId } from "@/config/subscriptions";
import { getSource } from "@/lib/source";

/**
 * Starts a Stripe checkout for a plan. No sign-in needed: the webhook creates
 * the account from the email used at checkout.
 */
export function CheckoutButton({
  plan,
  interval = "month",
  founding = false,
  children,
  variant = "default",
  size = "lg",
  className,
  wrapperClassName,
  errorTone = "paper",
}: {
  plan: PlanId;
  interval?: BillingInterval;
  founding?: boolean;
  children: React.ReactNode;
  variant?: "default" | "outline" | "paper";
  size?: "default" | "lg" | "xl";
  className?: string;
  wrapperClassName?: string;
  /** Use "ink" when the button sits on a dark background. */
  errorTone?: "paper" | "ink";
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval, founding, source: getSource() }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("We couldn't reach the payment page. Please check your connection and try again.");
    }
    setPending(false);
  }

  return (
    <div className={cn("flex flex-col gap-2", wrapperClassName)}>
      <Button
        type="button"
        onClick={start}
        disabled={pending}
        aria-busy={pending}
        variant={variant}
        size={size}
        className={className}
      >
        {pending ? "Opening secure checkout…" : children}
        {!pending && <ArrowRight />}
      </Button>
      {error && (
        <p
          role="alert"
          className={cn("text-sm", errorTone === "ink" ? "text-paper/80" : "text-destructive")}
        >
          {error}
        </p>
      )}
    </div>
  );
}
