"use client";

import { CheckoutButton } from "@/components/site/CheckoutButton";
import { CurrencyToggle } from "@/components/site/CurrencyToggle";
import { money, useCurrency } from "@/components/site/useCurrency";
import { tierById } from "@/config/subscriptions";
import { cn } from "@/lib/utils";

/** The Business price in the visitor's currency, with a checkout button that charges in it. */
export function BusinessCheckout({
  showToggle = true,
  showNote = true,
  size = "lg",
  align = "start",
  className,
}: {
  showToggle?: boolean;
  showNote?: boolean;
  size?: "lg" | "xl";
  align?: "start" | "center";
  className?: string;
}) {
  const [currency, setCurrency] = useCurrency();
  const business = tierById("business")!;
  const eur = currency === "eur" && business.eur;
  const monthly = eur ? business.eur!.price : business.price;
  const yearly = eur ? business.eur!.annualPrice : business.annualPrice;
  const c = eur ? "eur" : "gbp";

  return (
    <div className={cn("flex flex-col gap-3", align === "center" ? "items-center text-center" : "items-start", className)}>
      {showToggle && <CurrencyToggle value={currency} onChange={setCurrency} />}
      <CheckoutButton
        plan="business"
        currency={c}
        size={size}
        wrapperClassName={align === "center" ? "items-center" : "items-start"}
      >
        Join Business for {money(c, monthly)} a month
      </CheckoutButton>
      {showNote && (
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
