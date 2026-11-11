"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Person = { name: string; email: string; dietary: string; accessNeeds: string };
const blank = (): Person => ({ name: "", email: "", dietary: "", accessNeeds: "" });

function money(pence: number) {
  return pence % 100 === 0 ? `£${(pence / 100).toLocaleString("en-GB")}` : `£${(pence / 100).toFixed(2)}`;
}

/**
 * Extra places for a package holder. The package code and every name go to the
 * checkout route in the request body, and the buyer is sent to Stripe.
 */
export function BuyExtras({
  eventId,
  packageCode,
  addon,
  left,
}: {
  eventId: string;
  packageCode: string;
  addon: { id: string; name: string; pricePence: number };
  left: number;
}) {
  const [count, setCount] = useState(1);
  const [people, setPeople] = useState<Person[]>([blank()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rows = Array.from({ length: count }, (_, i) => people[i] ?? blank());
  const set = (i: number, patch: Partial<Person>) =>
    setPeople((list) => {
      const next = Array.from({ length: Math.max(list.length, count) }, (_, j) => list[j] ?? blank());
      next[i] = { ...next[i], ...patch };
      return next;
    });

  async function buy(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketTypeId: addon.id, packageCode, quantity: count, attendees: rows }),
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
    <form onSubmit={buy} className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm text-ink-2">
        Extra places
        <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="h-11 rounded-xl border border-input bg-card px-3 text-sm">
          {Array.from({ length: left }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      {rows.map((p, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-xl border border-rule p-3">
          <p className="text-sm font-medium text-ink">Extra place {i + 1}</p>
          <Input value={p.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="Full name" required maxLength={120} aria-label={`Full name, extra place ${i + 1}`} />
          <Input
            type="email"
            value={p.email}
            onChange={(e) => set(i, { email: e.target.value })}
            placeholder="Their email, or leave blank to receive the e-ticket yourself"
            aria-label={`Email, extra place ${i + 1}`}
          />
          <Input value={p.dietary} onChange={(e) => set(i, { dietary: e.target.value })} placeholder="Dietary needs (optional)" maxLength={300} aria-label={`Dietary needs, extra place ${i + 1}`} />
          <Input value={p.accessNeeds} onChange={(e) => set(i, { accessNeeds: e.target.value })} placeholder="Access needs (optional)" maxLength={300} aria-label={`Access needs, extra place ${i + 1}`} />
        </div>
      ))}
      <div>
        <Button type="submit" disabled={busy}>
          {busy ? "Opening secure payment…" : `Pay ${money(addon.pricePence * count)} for ${count === 1 ? "one extra place" : `${count} extra places`}`}
          {!busy && <ArrowRight />}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Stripe emails an invoice in your company&apos;s name once you have paid.</p>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
