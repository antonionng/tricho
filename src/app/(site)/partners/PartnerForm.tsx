"use client";

import { useActionState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { partnerEnquiry, type EnquiryState } from "@/lib/actions/enquiry";

const interests = [
  "Trichozette",
  "Podcast",
  "Gathering",
  "Masterclass",
  "Product trial",
  "Featured perk",
  "Something else",
];

const controlClass =
  "w-full min-w-0 rounded-xl border border-input bg-card px-3.5 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm";

export function PartnerForm() {
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

  const values = state && !state.ok ? state.fields ?? {} : {};

  return (
    <form action={action} className="flex flex-col gap-5 rounded-3xl border border-rule bg-card p-6 md:p-10">
      {/* Honeypot */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="pe-website">Leave this empty</label>
        <input id="pe-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="pe-name">Your name</Label>
          <Input id="pe-name" name="name" required autoComplete="name" defaultValue={values.name} className="bg-paper" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pe-role">Your role</Label>
          <Input id="pe-role" name="role" autoComplete="organization-title" defaultValue={values.role} className="bg-paper" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pe-company">Company</Label>
          <Input id="pe-company" name="company" required autoComplete="organization" defaultValue={values.company} className="bg-paper" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pe-email">Work email</Label>
          <Input id="pe-email" name="email" type="email" required autoComplete="email" defaultValue={values.email} className="bg-paper" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pe-interest">Interested in</Label>
          <select
            id="pe-interest"
            name="interest"
            defaultValue={values.interest || interests[0]}
            className={`${controlClass} h-11 bg-paper`}
          >
            {interests.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pe-budget">
            Budget <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="pe-budget" name="budget" defaultValue={values.budget} className="bg-paper" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pe-message">What do you have in mind?</Label>
        <textarea
          id="pe-message"
          name="message"
          required
          rows={5}
          defaultValue={values.message}
          className={`${controlClass} bg-paper py-3`}
          placeholder="Tell us about your company, what you'd like to do and when."
        />
      </div>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">We reply to every enquiry by email.</p>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sending…" : "Send enquiry"}
          {!pending && <ArrowRight />}
        </Button>
      </div>
    </form>
  );
}
