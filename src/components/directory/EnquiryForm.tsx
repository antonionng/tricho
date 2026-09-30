"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { sendEnquiry, type EnquiryState } from "@/lib/actions/enquiry-public";
import { Button } from "@/components/ui/button";

export function EnquiryForm({ listingId, name }: { listingId: string; name: string }) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(sendEnquiry, null);

  if (state?.ok) {
    return (
      <p role="status" className="flex gap-3 rounded-2xl bg-positive/10 p-5 text-[15px] text-positive">
        <Check className="mt-0.5 h-5 w-5 shrink-0" /> {state.message}
      </p>
    );
  }

  const field = "w-full rounded-xl border border-input bg-card px-3.5 text-base outline-none focus:border-ink";
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Your name</span>
        <input name="name" required autoComplete="name" className={`${field} h-11`} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Your email</span>
        <input name="email" type="email" required autoComplete="email" className={`${field} h-11`} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">How can {name.split(" ")[0]} help?</span>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="A short note about what you'd like help with and when suits you."
          className={`${field} py-3 resize-y`}
        />
      </label>
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
