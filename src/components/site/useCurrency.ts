"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Currency = "gbp" | "eur";

const STORAGE_KEY = "tricho:currency";
const EVENT = "tricho:currency";

/** Irish and continental European languages and regions default to euro. */
const EURO_LANGS = new Set([
  "ga", "fr", "de", "es", "it", "nl", "pt", "fi", "el", "et", "lv", "lt", "sk", "sl", "hr", "mt", "lb", "ca", "eu", "gl",
]);
const EURO_REGIONS = new Set([
  "IE", "FR", "DE", "ES", "IT", "NL", "PT", "BE", "AT", "FI", "GR", "LU", "EE", "LV", "LT", "SK", "SI", "HR", "MT", "CY",
]);

export function currencyForLanguage(tag: string | undefined | null): Currency {
  if (!tag) return "gbp";
  const [lang, region] = tag.replace("_", "-").split("-");
  if (region && EURO_REGIONS.has(region.toUpperCase())) return "eur";
  if (region && region.toUpperCase() === "GB") return "gbp";
  return EURO_LANGS.has(lang.toLowerCase()) ? "eur" : "gbp";
}

/** Kept in memory too, so the choice still sticks for this visit when storage is blocked. */
let chosen: Currency | null = null;

function read(): Currency {
  if (chosen) return chosen;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "gbp" || stored === "eur") return stored;
  } catch {
    // Storage blocked: fall through to the browser language.
  }
  return currencyForLanguage(navigator.language);
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The visitor's currency. Renders in pounds on the server, then settles on the browser's preference. */
export function useCurrency() {
  const currency = useSyncExternalStore(subscribe, read, () => "gbp" as Currency);
  const setCurrency = useCallback((next: Currency) => {
    chosen = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the in-memory choice still applies.
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [currency, setCurrency] as const;
}

export function symbolFor(currency: Currency) {
  return currency === "eur" ? "€" : "£";
}

/** Whole-currency amounts, with thousands separators: £3,500 or €1,150. */
export function money(currency: Currency, amount: number) {
  return `${symbolFor(currency)}${amount.toLocaleString("en-GB")}`;
}
