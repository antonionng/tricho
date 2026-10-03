"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Quote = {
  signedIn: boolean;
  member: boolean;
  name: string | null;
  priceType: "member" | "guest";
  amountPence: number;
  maxQuantity: number;
  seatsLeft: number | null;
  hasTicket: boolean;
  onSale: boolean;
};

function money(pence: number) {
  return pence % 100 === 0 ? `£${pence / 100}` : `£${(pence / 100).toFixed(2)}`;
}

/**
 * "Buy a ticket" for an event sold on Trichollective. It asks the server what
 * this visitor pays (members signed in get the member price), then posts to the
 * checkout route and sends them to Stripe. Guests give a name and email here,
 * in the request body, never in a URL.
 */
export function BuyTicket({
  eventId,
  slug,
  memberPriceGBP,
  returnTo,
  compact = false,
}: {
  eventId: string;
  slug: string;
  memberPriceGBP: number;
  returnTo?: "members";
  compact?: boolean;
}) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/events/${eventId}/checkout`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((q: Quote) => live && setQuote(q))
      .catch(() => live && setLoadError(true));
    return () => {
      live = false;
    };
  }, [eventId]);

  async function buy(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, quantity, returnTo }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "We could not start the payment. Please try again in a moment.");
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not start the payment. Please try again in a moment.");
      setBusy(false);
    }
  }

  const note = (text: React.ReactNode, tone: "muted" | "positive" = "muted") => (
    <p className={cn("text-sm leading-relaxed", tone === "positive" ? "text-positive" : "text-muted-foreground")}>{text}</p>
  );

  if (loadError) return note("Tickets could not be loaded just now. Please refresh the page to try again.");
  if (!quote) {
    return (
      <Button size={compact ? "default" : "lg"} className={cn(!compact && "w-full")} disabled>
        Buy a ticket
      </Button>
    );
  }
  if (!quote.onSale) return null;
  if (quote.hasTicket && quote.member) {
    return (
      <p className="inline-flex items-center gap-1.5 text-sm font-medium text-positive">
        <Check className="h-4 w-4" aria-hidden /> You have a ticket for this event, and your confirmation is in your inbox.
      </p>
    );
  }
  if (quote.seatsLeft === 0) {
    return (
      <span className="inline-flex h-11 items-center rounded-full border border-rule px-5 text-sm text-muted-foreground">
        This event is sold out.
      </span>
    );
  }
  if (quote.amountPence <= 0) {
    return note(
      <>
        This event is free for members.{" "}
        <Link href="/members/events" className="underline underline-offset-4">
          Save your place from the events page
        </Link>
        .
      </>
    );
  }

  const max = Math.max(1, Math.min(quote.maxQuantity, quote.seatsLeft ?? quote.maxQuantity));
  const label = `Buy ${quantity > 1 ? `${quantity} tickets` : "a ticket"} for ${money(quote.amountPence * quantity)}`;
  const quantityPicker = max > 1 && (
    <label className="flex items-center gap-2 text-sm text-ink-2">
      Tickets
      <select
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        className="h-11 rounded-xl border border-input bg-card px-3 text-sm"
      >
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );

  if (quote.signedIn) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          {quantityPicker}
          <Button size={compact ? "default" : "lg"} className={cn(!compact && "w-full")} onClick={() => buy()} disabled={busy}>
            {busy ? "Opening secure payment…" : label} {!busy && <ArrowRight />}
          </Button>
        </div>
        {quote.member
          ? note("You pay the member price because you are signed in as a member. Payment is handled securely by Stripe.")
          : note(
              memberPriceGBP < quote.amountPence / 100
                ? `Members pay ${memberPriceGBP === 0 ? "nothing" : `£${memberPriceGBP}`} for this event. Payment is handled securely by Stripe.`
                : "Payment is handled securely by Stripe."
            )}
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={buy} className="flex flex-col gap-3">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="name" required maxLength={120} aria-label="Your full name" />
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email for your ticket"
        autoComplete="email"
        required
        aria-label="Email for your ticket"
      />
      {quantityPicker}
      <Button type="submit" size={compact ? "default" : "lg"} className={cn(!compact && "w-full")} disabled={busy}>
        {busy ? "Opening secure payment…" : label} {!busy && <ArrowRight />}
      </Button>
      {note(
        <>
          Payment is handled securely by Stripe, and your ticket is sent to the email above.{" "}
          {memberPriceGBP * 100 < quote.amountPence && (
            <>
              Members pay {memberPriceGBP === 0 ? "nothing" : `£${memberPriceGBP}`} when they{" "}
              <Link href={`/login?next=${encodeURIComponent(returnTo === "members" ? "/members/events" : `/events/${slug}`)}`} className="underline underline-offset-4">
                sign in first
              </Link>
              .
            </>
          )}
        </>
      )}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </form>
  );
}

/** The thank-you or cancelled message after Stripe sends the buyer back. */
export function TicketReturnBanner({ status }: { status: string | null | undefined }) {
  if (status === "success") {
    return (
      <div role="status" className="rounded-2xl border border-positive/30 bg-positive/10 p-4 text-sm leading-relaxed text-ink">
        Thank you for booking. Your payment is being confirmed, and your ticket and calendar link will arrive by email within a few minutes.
      </div>
    );
  }
  if (status === "cancelled") {
    return (
      <div role="status" className="rounded-2xl border border-rule bg-paper-2 p-4 text-sm leading-relaxed text-ink-2">
        Your payment was cancelled and you have not been charged. You can buy a ticket whenever you are ready.
      </div>
    );
  }
  return null;
}

/** Reads ?ticket= on statically rendered pages. Wrap in <Suspense>. */
export function TicketReturnNotice() {
  const params = useSearchParams();
  return <TicketReturnBanner status={params.get("ticket")} />;
}
