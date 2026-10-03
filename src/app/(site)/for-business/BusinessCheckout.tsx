"use client";

import { useId, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyToggle } from "@/components/site/CurrencyToggle";
import { money, useCurrency } from "@/components/site/useCurrency";
import { tierById, type BillingInterval } from "@/config/subscriptions";
import { getSource } from "@/lib/source";
import { cn } from "@/lib/utils";

const controlClass =
  "w-full min-w-0 rounded-xl border border-input bg-paper px-3.5 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm";

/**
 * The Business price in the visitor's currency. The button opens a short form for the brand's
 * name, category and website, so the partner page can be prepared the moment payment goes
 * through; then it opens the secure checkout in the chosen currency.
 */
export function BusinessCheckout({
  categories,
  showToggle = true,
  showNote = true,
  size = "lg",
  align = "start",
  className,
}: {
  /** PARTNER_CATEGORIES, passed in from the server so this client file stays free of server code. */
  categories: readonly string[];
  showToggle?: boolean;
  showNote?: boolean;
  size?: "lg" | "xl";
  align?: "start" | "center";
  className?: string;
}) {
  const id = useId();
  const [currency, setCurrency] = useCurrency();
  const [open, setOpen] = useState(false);
  const [interval, setBillingInterval] = useState<BillingInterval>("month");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const business = tierById("business")!;
  const eur = currency === "eur" && business.eur;
  const monthly = eur ? business.eur!.price : business.price;
  const yearly = eur ? business.eur!.annualPrice : business.annualPrice;
  const c = eur ? "eur" : "gbp";

  async function start(form: FormData) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "business",
          interval,
          source: getSource(),
          currency: c,
          brandName: String(form.get("brandName") ?? ""),
          category: String(form.get("category") ?? ""),
          website: String(form.get("website") ?? ""),
        }),
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
    <div className={cn("flex w-full flex-col gap-3", align === "center" ? "items-center text-center" : "items-start", className)}>
      {showToggle && <CurrencyToggle value={currency} onChange={setCurrency} />}
      {!open ? (
        <Button type="button" size={size} onClick={() => setOpen(true)} aria-expanded={false} aria-controls={`${id}-form`}>
          Join Business for {money(c, monthly)} a month
          <ArrowRight />
        </Button>
      ) : (
        <form
          id={`${id}-form`}
          action={start}
          className="flex w-full flex-col gap-4 rounded-2xl border border-rule bg-paper-2 p-5 text-left"
        >
          <p className="text-[15px] leading-relaxed text-ink-2">
            Tell us who you are, and your partner page will be ready for you to finish as soon as you have paid.
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-brand`}>Brand or business name</Label>
            <Input id={`${id}-brand`} name="brandName" required minLength={2} maxLength={120} autoComplete="organization" className="bg-paper" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-category`}>What you make or offer</Label>
            <select id={`${id}-category`} name="category" required defaultValue="" className={`${controlClass} h-11`}>
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-website`}>
              Website <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input id={`${id}-website`} name="website" inputMode="url" autoComplete="url" maxLength={300} placeholder="yourbrand.com" className="bg-paper" />
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">How you would like to pay</legend>
            <label className="flex items-center gap-2 text-[15px]">
              <input type="radio" name="interval" checked={interval === "month"} onChange={() => setBillingInterval("month")} className="h-4 w-4 accent-ink" />
              {money(c, monthly)} a month
            </label>
            <label className="flex items-center gap-2 text-[15px]">
              <input type="radio" name="interval" checked={interval === "year"} onChange={() => setBillingInterval("year")} className="h-4 w-4 accent-ink" />
              {money(c, yearly)} a year, which gives you two months free
            </label>
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="submit" size={size} disabled={pending} aria-busy={pending}>
              {pending ? "Opening secure checkout…" : "Continue to secure payment"}
              {!pending && <ArrowRight />}
            </Button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink-2 underline underline-offset-4">
              Not now
            </button>
          </div>
        </form>
      )}
      {showNote && !open && (
        <p className="text-sm text-muted-foreground">
          Or {money(c, yearly)} a year, two months free. Cancel anytime. Prices include VAT where applicable.
        </p>
      )}
    </div>
  );
}

/** The Business headline price in the visitor's currency, so it always matches the checkout button. */
export function BusinessPrice() {
  const [currency] = useCurrency();
  const business = tierById("business")!;
  const eur = currency === "eur" && business.eur;
  const c = eur ? "eur" : "gbp";
  return (
    <>
      <p className="display text-5xl">
        {money(c, eur ? business.eur!.price : business.price)}
        <span className="text-base font-normal opacity-60">/mo</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Or {money(c, eur ? business.eur!.annualPrice : business.annualPrice)} a year, two months free.
      </p>
    </>
  );
}
