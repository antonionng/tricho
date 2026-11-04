"use client";

import { useActionState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendCourseBuildEnquiry, type CourseBuildEnquiryState } from "@/lib/actions/course-build-enquiry";

const controlClass =
  "w-full min-w-0 rounded-xl border border-input bg-paper px-3.5 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm";

/** A short enquiry about the course build service, for people who aren't Educators yet. */
export function CourseBuildEnquiryForm() {
  const [state, action, pending] = useActionState<CourseBuildEnquiryState, FormData>(sendCourseBuildEnquiry, null);

  if (state?.ok) {
    return (
      <div role="status" className="flex flex-col gap-4 rounded-3xl border border-rule bg-card p-8">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-paper">
          <Check className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-[15px] leading-relaxed text-ink-2">{state.message}</p>
      </div>
    );
  }

  const values = state && !state.ok ? (state.fields ?? {}) : {};

  return (
    <form action={action} className="relative flex flex-col gap-5 rounded-3xl border border-rule bg-card p-6 md:p-8">
      {/* Honeypot: people never see or fill this in. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="cb-hp">Leave this empty</label>
        <input id="cb-hp" name="company_site" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cb-name">Your name</Label>
          <Input id="cb-name" name="name" required autoComplete="name" defaultValue={values.name} className="bg-paper" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cb-email">Email</Label>
          <Input id="cb-email" name="email" type="email" required autoComplete="email" defaultValue={values.email} className="bg-paper" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cb-topic">What would the course teach, and who is it for?</Label>
        <textarea id="cb-topic" name="topic" required minLength={10} rows={4} defaultValue={values.topic} className={`${controlClass} py-3`} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cb-material">What do you have already? (optional)</Label>
        <Input id="cb-material" name="material" defaultValue={values.material} placeholder="For example, slides from a talk, clinic handouts or a recorded webinar" className="bg-paper" />
      </div>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Karley or a member of the team replies within three working days.</p>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sending…" : "Send your enquiry"}
          {!pending && <ArrowRight />}
        </Button>
      </div>
    </form>
  );
}
