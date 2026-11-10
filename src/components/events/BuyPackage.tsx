"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { lineTotal, poundsText, priceText } from "@/lib/vat";

export type PackageCard = {
  id: string;
  name: string;
  pricePence: number;
  includes: string[];
  placesIncluded: number;
  /** "N left", "Sold out", "Sales closed" and so on, or null when there is nothing to say. */
  status: string | null;
  canBuy: boolean;
};

type Person = { name: string; email: string; dietary: string; accessNeeds: string };
const blank = (): Person => ({ name: "", email: "", dietary: "", accessNeeds: "" });


const textarea = "min-h-[88px] rounded-xl border border-input bg-card px-3 py-2 text-[15px] placeholder:text-muted-foreground";

/**
 * Exhibitor and sponsor packages on the event page. Each package has its own
 * button, separate from attendee tickets; choosing one opens the company form.
 * Company, contact and invoice details go to the checkout route in the request
 * body, never in a URL, and the buyer can name their places now or later.
 */
export function BuyPackage({
  eventId,
  slug,
  packages,
  excludesVat = false,
}: {
  eventId: string;
  slug: string;
  packages: PackageCard[];
  /** Prices are before VAT, and checkout adds UK VAT on top. */
  excludesVat?: boolean;
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [company, setCompany] = useState({ companyName: "", contactName: "", contactEmail: "", contactPhone: "", website: "", invoiceAddress: "", vatNumber: "" });
  const [people, setPeople] = useState<Person[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pkg = packages.find((p) => p.id === chosen) ?? null;
  const field = (key: keyof typeof company) => ({
    value: company[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCompany((c) => ({ ...c, [key]: e.target.value })),
  });
  const rows = pkg ? Array.from({ length: pkg.placesIncluded }, (_, i) => people[i] ?? blank()) : [];
  const setPerson = (i: number, patch: Partial<Person>) =>
    setPeople((list) => {
      const next = Array.from({ length: Math.max(list.length, rows.length) }, (_, j) => list[j] ?? blank());
      next[i] = { ...next[i], ...patch };
      return next;
    });

  async function buy(e: React.FormEvent) {
    e.preventDefault();
    if (!pkg) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketTypeId: pkg.id, exhibitor: company, attendees: rows.filter((p) => p.name.trim()) }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "We could not start the payment. Please try again in a moment.");
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not start the payment. Please try again in a moment.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((p) => (
          <li
            key={p.id}
            className={cn(
              "flex flex-col gap-4 rounded-3xl border bg-card p-6",
              p.id === chosen ? "border-ink" : "border-rule",
              !p.canBuy && "opacity-70"
            )}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-xl font-semibold text-ink">{p.name}</h3>
              <p className="text-right text-xl font-semibold text-ink">{priceText(p.pricePence, excludesVat)}</p>
            </div>
            <ul className="flex flex-1 flex-col gap-2 text-[15px] text-ink-2">
              {p.includes.map((line) => (
                <li key={line} className="flex gap-2">
                  <Check className="mt-1 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            {p.status && <p className="text-[13px] text-muted-foreground">{p.status}</p>}
            {p.canBuy ? (
              <Button
                type="button"
                variant={p.id === chosen ? "default" : "outline"}
                onClick={() => {
                  setChosen(p.id);
                  setError(null);
                  requestAnimationFrame(() => document.getElementById("book-package")?.scrollIntoView({ behavior: "smooth", block: "start" }));
                }}
              >
                Book {p.name}
              </Button>
            ) : (
              <span className="inline-flex h-11 items-center justify-center rounded-full border border-rule px-5 text-sm text-muted-foreground">
                {p.status ?? "Not on sale"}
              </span>
            )}
          </li>
        ))}
      </ul>

      {pkg && (
        <form id="book-package" onSubmit={buy} className="mx-auto flex w-full max-w-2xl scroll-mt-24 flex-col gap-4 rounded-3xl border border-rule bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold text-ink">
              Book the {pkg.name} package for {priceText(pkg.pricePence, excludesVat)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {excludesVat
                ? `UK VAT at 20% is added at checkout, so you pay ${poundsText(lineTotal(pkg.pricePence, 1, true).gross)} in total. `
                : "The price includes VAT. "}
              Stripe emails a VAT invoice made out to your company once you have paid, and you can add your VAT number there too.
            </p>
          </div>
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-sm text-ink-2">Your company</legend>
            <Input {...field("companyName")} placeholder="Company name" autoComplete="organization" required maxLength={120} aria-label="Company name" className="sm:col-span-2" />
            <Input {...field("contactName")} placeholder="Contact name" autoComplete="name" required maxLength={120} aria-label="Contact name" />
            <Input {...field("contactPhone")} type="tel" placeholder="Contact phone" autoComplete="tel" required maxLength={40} aria-label="Contact phone" />
            <Input {...field("contactEmail")} type="email" placeholder="Contact email" autoComplete="email" required maxLength={200} aria-label="Contact email" />
            <Input {...field("website")} placeholder="Website (optional)" autoComplete="url" maxLength={300} aria-label="Website" />
            <textarea
              {...field("invoiceAddress")}
              placeholder="Invoice address, including the postcode"
              autoComplete="street-address"
              required
              maxLength={500}
              aria-label="Invoice address"
              className={cn(textarea, "sm:col-span-2")}
            />
            <Input {...field("vatNumber")} placeholder="VAT number (optional)" maxLength={40} aria-label="VAT number" />
          </fieldset>

          {rows.length > 0 && (
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 text-sm text-ink-2">
                {rows.length === 1 ? "Your place" : `Your ${rows.length} places`}. Name them now, or leave them blank and name them later from the link in
                your confirmation email.
              </legend>
              {rows.map((p, i) => (
                <div key={i} className="grid gap-2 rounded-xl border border-rule p-3 sm:grid-cols-2">
                  <p className="text-sm font-medium text-ink sm:col-span-2">Place {i + 1}</p>
                  <Input value={p.name} onChange={(e) => setPerson(i, { name: e.target.value })} placeholder="Full name" maxLength={120} aria-label={`Full name, place ${i + 1}`} />
                  <Input
                    type="email"
                    value={p.email}
                    onChange={(e) => setPerson(i, { email: e.target.value })}
                    placeholder="Their email, or blank for the contact's"
                    aria-label={`Email, place ${i + 1}`}
                  />
                  <Input value={p.dietary} onChange={(e) => setPerson(i, { dietary: e.target.value })} placeholder="Dietary needs (optional)" maxLength={300} aria-label={`Dietary needs, place ${i + 1}`} />
                  <Input value={p.accessNeeds} onChange={(e) => setPerson(i, { accessNeeds: e.target.value })} placeholder="Access needs (optional)" maxLength={300} aria-label={`Access needs, place ${i + 1}`} />
                </div>
              ))}
            </fieldset>
          )}

          <Button type="submit" size="lg" disabled={busy}>
            {busy ? "Opening secure payment…" : `Pay ${poundsText(lineTotal(pkg.pricePence, 1, excludesVat).gross)} and book ${pkg.name}`} {!busy && <ArrowRight />}
          </Button>
          <p className="text-sm text-muted-foreground">
            After paying, you can name your places, upload your logo and send your booklet text from your exhibitor page.
          </p>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </form>
      )}

      <FindPackage slug={slug} />
    </div>
  );
}

/** A package holder enters the code from their confirmation email to open their exhibitor page. */
function FindPackage({ slug }: { slug: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const clean = code.toUpperCase().replace(/[^0-9A-Z]/g, "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (clean.length >= 8) router.push(`/events/${slug}/exhibitor/${clean}`);
      }}
      className="mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-3xl border border-dashed border-rule p-6"
    >
      <p className="text-[15px] text-ink">Already booked a package? Enter the code from your confirmation email to name your places, send your logo or add extra places.</p>
      <div className="flex flex-wrap gap-2">
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Your package code" aria-label="Your package code" className="max-w-xs" maxLength={40} />
        <Button type="submit" variant="outline" disabled={clean.length < 8}>
          Open my exhibitor page
        </Button>
      </div>
    </form>
  );
}

/** Reads ?package=cancelled after Stripe sends a buyer back. Wrap in <Suspense>. */
export function PackageReturnNotice() {
  const params = useSearchParams();
  if (params.get("package") !== "cancelled") return null;
  return (
    <div role="status" className="rounded-2xl border border-rule bg-paper-2 p-4 text-sm leading-relaxed text-ink-2">
      Your payment was cancelled and you have not been charged. You can book a package whenever you are ready.
    </div>
  );
}
