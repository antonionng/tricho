"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { sendEnquiry, type EnquiryState } from "@/lib/actions/enquiry-public";
import { Button } from "@/components/ui/button";
import { shortName } from "@/lib/names";
import { useListingVisitor } from "@/components/directory/ListingVisitor";
import { HUB_LABEL } from "@/config/consumer";

export function EnquiryForm({ listingId, name }: { listingId: string; name: string }) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(sendEnquiry, null);
  // A signed-in consumer gets their details filled in, and the enquiry is linked to their account.
  const visitor = useListingVisitor();
  const consumer = visitor?.consumer ? visitor : null;
  const who = shortName(name, "they");
  const Who = who.charAt(0).toUpperCase() + who.slice(1);

  if (state?.ok) {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-2xl bg-positive/10 p-5 text-[15px] text-positive">
        <p className="flex gap-3">
          <Check className="mt-0.5 h-5 w-5 shrink-0" /> {state.message}
        </p>
        {consumer && (
          <Link href="/hub/enquiries" className="text-sm text-ink underline underline-offset-4">
            Follow it in {HUB_LABEL.toLowerCase()}
          </Link>
        )}
      </div>
    );
  }

  const field = "w-full rounded-xl border border-input bg-card px-3.5 text-base outline-none focus:border-ink";
  return (
    // Remounted once the visitor is known, so the filled-in details appear.
    <form key={consumer ? "consumer" : "visitor"} action={action} className="flex flex-col gap-4">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Your name</span>
        <input name="name" required autoComplete="name" defaultValue={consumer?.name ?? ""} className={`${field} h-11`} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Your email</span>
        {consumer?.email ? (
          <input value={consumer.email} readOnly aria-readonly className={`${field} h-11 bg-paper-2 text-ink-2`} />
        ) : (
          <input name="email" type="email" required autoComplete="email" className={`${field} h-11`} />
        )}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">How can {who} help?</span>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="A short note about what you'd like help with and when suits you."
          className={`${field} py-3 resize-y`}
        />
      </label>
      <p className="rounded-xl border border-rule p-3 text-sm leading-relaxed text-ink-2">
        {consumer
          ? `${Who} will see your real name and email address, not your alias, so they can reply to you. The enquiry will also appear in ${HUB_LABEL.toLowerCase()}.`
          : `${Who} will see your name and email address so they can reply to you.`}
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Please don&apos;t include detailed medical information. If you have sudden or painful hair loss, see your GP first.
      </p>
      {state && !state.ok && <p className="text-sm text-destructive">{state.message}</p>}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send enquiry"}
      </Button>
    </form>
  );
}
