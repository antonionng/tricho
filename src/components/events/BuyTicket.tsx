"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { lineTotal, poundsText, priceText } from "@/lib/vat";

type TypeQuote = {
  id: string;
  name: string;
  description: string;
  /** What this visitor pays for one. */
  amountPence: number;
  pricePence: number;
  memberPricePence: number | null;
  membersOnly: boolean;
  maxPerOrder: number;
  state: "on_sale" | "not_yet" | "closed" | "sold_out" | "members_only";
  left: number | null;
};

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
  /** Ticket types, when the event sells them. Empty for flat pricing. */
  types?: TypeQuote[];
  /** In person: each place needs a named attendee. */
  inPerson?: boolean;
  email?: string | null;
  /** Prices are before VAT, and checkout adds UK VAT at 20% on top. */
  pricesExcludeVat?: boolean;
};

type Person = { name: string; email: string; dietary: string; accessNeeds: string; isBuyer: boolean };
const blankPerson = (isBuyer: boolean): Person => ({ name: "", email: "", dietary: "", accessNeeds: "", isBuyer });


/**
 * "Buy a ticket" for an event sold on Trichollective. It asks the server what
 * this visitor pays (members signed in get the member price), then posts to the
 * checkout route and sends them to Stripe. Guests give a name and email here,
 * in the request body, never in a URL. When the event sells ticket types, the
 * buyer picks one first and can buy up to that type's limit. For an in-person
 * event the buyer names each place (with "this is me" for their own), and the
 * names go in the request body too.
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
  const [typeId, setTypeId] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([blankPerson(true)]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/events/${eventId}/checkout`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((q: Quote) => {
        if (!live) return;
        setQuote(q);
        setTypeId(q.types?.find((t) => t.state === "on_sale")?.id ?? null);
      })
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
        body: JSON.stringify({
          name,
          email,
          quantity: count,
          returnTo,
          ...(typeId ? { ticketTypeId: typeId } : {}),
          ...(quote?.inPerson ? { attendees: rows.map((p) => (p.isBuyer ? { ...p, name: buyerName || p.name, email: buyerEmail } : p)) } : {}),
        }),
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
  const types = quote.types ?? [];
  const selected = types.find((t) => t.id === typeId) ?? null;
  if (types.length > 0 && !types.some((t) => t.state === "on_sale")) {
    const membersOnly = types.some((t) => t.state === "members_only");
    return note(
      membersOnly ? (
        <>
          The tickets on sale now are for members.{" "}
          <Link href={`/login?next=${encodeURIComponent(returnTo === "members" ? "/members/events" : `/events/${slug}`)}`} className="underline underline-offset-4">
            Sign in
          </Link>{" "}
          to buy one.
        </>
      ) : (
        "No tickets are on sale right now."
      )
    );
  }
  if (quote.hasTicket && quote.member && types.length === 0) {
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
  if (types.length === 0 && quote.amountPence <= 0) {
    return (
      <div className="flex flex-col gap-2">
        <Button asChild size={compact ? "default" : "lg"} className={cn(!compact && "w-full")}>
          <Link href={`/members/events/${slug}`}>
            Save your place <ArrowRight />
          </Link>
        </Button>
        {note("This event is part of your membership. Say you are going and the joining details are sent to you.")}
      </div>
    );
  }

  const unitPence = selected ? selected.amountPence : quote.amountPence;
  const max = selected
    ? Math.max(1, Math.min(selected.maxPerOrder, selected.left ?? selected.maxPerOrder))
    : Math.max(1, Math.min(quote.maxQuantity, quote.seatsLeft ?? quote.maxQuantity));
  const count = Math.min(quantity, max);
  const buyerName = quote.signedIn ? (quote.name ?? "") : name;
  const buyerEmail = quote.signedIn ? (quote.email ?? "") : email;
  const exVat = !!quote.pricesExcludeVat;
  const total = lineTotal(unitPence, count, exVat);
  const label = `Buy ${count > 1 ? `${count} tickets` : "a ticket"} for ${poundsText(total.gross)}`;
  const vatNote = exVat ? note(`${priceText(total.net, true)} is ${poundsText(total.gross)} with UK VAT at 20%, and you receive a VAT invoice.`) : null;
  const typePicker = types.length > 0 && (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm text-ink-2">Ticket type</legend>
      {types
        .filter((t) => t.state === "on_sale" || t.state === "members_only")
        .map((t) => (
          <label
            key={t.id}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm",
              t.id === typeId ? "border-ink" : "border-input",
              t.state !== "on_sale" && "opacity-60"
            )}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="ticketType"
                value={t.id}
                checked={t.id === typeId}
                disabled={t.state !== "on_sale"}
                onChange={() => {
                  setTypeId(t.id);
                  setQuantity(1);
                }}
                className="h-4 w-4 accent-ink"
              />
              {t.name}
              {t.state === "members_only" && <span className="text-muted-foreground">(members only)</span>}
            </span>
            <span className="font-medium">{priceText(t.amountPence, exVat)}</span>
          </label>
        ))}
    </fieldset>
  );
  const rows = Array.from({ length: count }, (_, i) => people[i] ?? blankPerson(false));
  const setPerson = (i: number, patch: Partial<Person>) =>
    setPeople((list) => {
      const next = Array.from({ length: Math.max(list.length, count) }, (_, j) => list[j] ?? blankPerson(false));
      if (patch.isBuyer) next.forEach((p, j) => j !== i && (p.isBuyer = false));
      next[i] = { ...next[i], ...patch };
      return next;
    });
  const attendeeFields = quote.inPerson && (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm text-ink-2">
        {count === 1 ? "Who is the ticket for?" : "Who is coming? Each person is sent their own e-ticket."}
      </legend>
      {rows.map((p, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-xl border border-rule p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-ink">{count === 1 ? "Attendee" : `Place ${i + 1}`}</p>
            <label className="flex items-center gap-2 text-sm text-ink-2">
              <input type="checkbox" checked={p.isBuyer} onChange={(e) => setPerson(i, { isBuyer: e.target.checked })} className="h-4 w-4 accent-ink" />
              This is me
            </label>
          </div>
          {p.isBuyer && !buyerName && quote.signedIn && (
            <Input value={p.name} onChange={(e) => setPerson(i, { name: e.target.value })} placeholder="Your full name" required maxLength={120} aria-label="Your full name" />
          )}
          {!p.isBuyer && (
            <>
              <Input value={p.name} onChange={(e) => setPerson(i, { name: e.target.value })} placeholder="Full name" required maxLength={120} aria-label={`Full name, place ${i + 1}`} />
              <Input
                type="email"
                value={p.email}
                onChange={(e) => setPerson(i, { email: e.target.value })}
                placeholder="Their email, or leave blank to receive it yourself"
                aria-label={`Email, place ${i + 1}`}
              />
            </>
          )}
          <Input value={p.dietary} onChange={(e) => setPerson(i, { dietary: e.target.value })} placeholder="Dietary needs (optional)" maxLength={300} aria-label={`Dietary needs, place ${i + 1}`} />
          <Input
            value={p.accessNeeds}
            onChange={(e) => setPerson(i, { accessNeeds: e.target.value })}
            placeholder="Access needs (optional)"
            maxLength={300}
            aria-label={`Access needs, place ${i + 1}`}
          />
        </div>
      ))}
    </fieldset>
  );
  const quantityPicker = max > 1 && (
    <label className="flex items-center gap-2 text-sm text-ink-2">
      Tickets
      <select
        value={count}
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
      <form onSubmit={buy} className="flex flex-col gap-2">
        {typePicker}
        {quote.inPerson && quantityPicker}
        {attendeeFields}
        <div className="flex flex-wrap items-center gap-3">
          {!quote.inPerson && quantityPicker}
          <Button type="submit" size={compact ? "default" : "lg"} className={cn(!compact && "w-full")} disabled={busy}>
            {busy ? "Opening secure payment…" : label} {!busy && <ArrowRight />}
          </Button>
        </div>
        {quote.member
          ? note("You pay the member price because you are signed in as a member. Payment is handled securely by Stripe.")
          : note(
              types.length === 0 && memberPriceGBP < quote.amountPence / 100
                ? `Members pay ${memberPriceGBP === 0 ? "nothing" : `£${memberPriceGBP}`} for this event. Payment is handled securely by Stripe.`
                : "Payment is handled securely by Stripe."
            )}
        {vatNote}
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      </form>
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
      {typePicker}
      {quantityPicker}
      {attendeeFields}
      <Button type="submit" size={compact ? "default" : "lg"} className={cn(!compact && "w-full")} disabled={busy}>
        {busy ? "Opening secure payment…" : label} {!busy && <ArrowRight />}
      </Button>
      {note(
        <>
          Payment is handled securely by Stripe, and your ticket is sent to the email above.{" "}
          {(selected
            ? types.some((t) => t.membersOnly || (t.memberPricePence != null && t.memberPricePence < t.pricePence))
            : memberPriceGBP * 100 < quote.amountPence) && (
            <>
              {selected ? "Members pay less" : <>Members pay {memberPriceGBP === 0 ? "nothing" : `£${memberPriceGBP}`}</>} when they{" "}
              <Link href={`/login?next=${encodeURIComponent(returnTo === "members" ? "/members/events" : `/events/${slug}`)}`} className="underline underline-offset-4">
                sign in first
              </Link>
              .
            </>
          )}
        </>
      )}
      {vatNote}
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
