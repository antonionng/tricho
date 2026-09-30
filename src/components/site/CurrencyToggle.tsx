"use client";

import { cn } from "@/lib/utils";
import type { Currency } from "./useCurrency";

export function CurrencyToggle({
  value,
  onChange,
  className,
}: {
  value: Currency;
  onChange: (next: Currency) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Currency"
      className={cn("inline-flex rounded-full border border-rule bg-card p-1", className)}
    >
      {(
        [
          { id: "gbp", label: "£", name: "Pounds sterling" },
          { id: "eur", label: "€", name: "Euro" },
        ] as const
      ).map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          aria-label={o.name}
          onClick={() => onChange(o.id)}
          className={cn(
            "h-10 min-w-12 rounded-full px-4 text-sm font-medium transition-colors",
            value === o.id ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
