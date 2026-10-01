"use client";

import { useActionState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { partnerEnquiry, type EnquiryState } from "@/lib/actions/enquiry";

const controlClass =
  "w-full min-w-0 rounded-xl border border-input bg-paper px-3.5 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm";

const tiers = [
  { id: "premium", label: "Premium Business" },
  { id: "business", label: "Business" },
  { id: "unsure", label: "Not sure yet" },
];

/**
 * Partner application. Posts to partnerEnquiry with form=application, which
 * files a Draft in the Studio inbox for the team to review by hand.
 */
export function PartnerApplicationForm({
  categories,
  defaultTier = "premium",
}: {
  categories: readonly string[];
  defaultTier?: "premium" | "business" | "unsure";
}) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(partnerEnquiry, null);

  if (state?.ok) {
    return (
      <div role="status" className="flex flex-col gap-4 rounded-3xl border border-rule bg-card p-8 md:p-10">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-paper">
          <Check className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="display text-3xl">Thank you.</h3>
        <p className="text-[15px] leading-relaxed text-ink-2">{state.message}</p>
      </div>
    );
  }

  const values = state && !state.ok ? (state.fields ?? {}) : {};

  return (
    <form action={action} className="relative flex flex-col gap-5 rounded-3xl border border-rule bg-card p-6 md:p-10">
      <input type="hidden" name="form" value="application" />
      {/* Honeypot: people never see or fill this in. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="pa-hp">Leave this empty</label>
        <input id="pa-hp" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="pa-company">Company</Label>
          <Input id="pa-company" name="company" required autoComplete="organization" defaultValue={values.company} className="bg-paper" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pa-url">
            Website <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="pa-url" name="companyUrl" inputMode="url" autoComplete="url" placeholder="yourcompany.com" defaultValue={values.companyUrl} className="bg-paper" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pa-name">Contact name</Label>
          <Input id="pa-name" name="name" required autoComplete="name" defaultValue={values.name} className="bg-paper" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pa-email">Work email</Label>
          <Input id="pa-email" name="email" type="email" required autoComplete="email" defaultValue={values.email} className="bg-paper" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pa-category">Product category</Label>
          <select id="pa-category" name="category" required defaultValue={values.category || ""} className={`${controlClass} h-11`}>
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pa-tier">The tier you are interested in</Label>
          <select id="pa-tier" name="tier" defaultValue={values.tier || defaultTier} className={`${controlClass} h-11`}>
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pa-sells">What do you sell?</Label>
        <textarea
          id="pa-sells"
          name="sells"
          required
          rows={3}
          defaultValue={values.sells}
          className={`${controlClass} py-3`}
          placeholder="For example, a scalp camera for consultations, or a professional range of scalp treatments sold through salons."
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pa-message">
          Anything else we should know? <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <textarea
          id="pa-message"
          name="message"
          rows={3}
          defaultValue={values.message}
          className={`${controlClass} py-3`}
          placeholder="Who you would most like to reach, and anything you would like to do with members."
        />
      </div>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">We read every application ourselves and reply by email.</p>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sending…" : "Send application"}
          {!pending && <ArrowRight />}
        </Button>
      </div>
    </form>
  );
}
