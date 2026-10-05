"use client";

import { useActionState } from "react";
import type { Job } from "@prisma/client";
import { Card, fieldClass } from "@/components/members/MemberPage";
import { SubmitButton } from "@/components/members/SubmitButton";
import { EMPLOYMENT, WORKPLACE } from "@/lib/jobs";
import { cn } from "@/lib/utils";
import { saveJob, type JobFormState } from "../actions";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

/** Posting a new role, or editing one. Shared by the new and edit pages. */
export function JobForm({ job }: { job?: Pick<Job, "id" | "title" | "employment" | "workplace" | "location" | "country" | "pay" | "summary" | "description" | "applyEmail" | "applyUrl"> }) {
  const [state, action] = useActionState<JobFormState, FormData>(saveJob, { attempt: 0 });
  // After a problem, the form shows what was typed rather than the saved role.
  const v = (key: keyof NonNullable<typeof job>) => state.values?.[key] ?? (job?.[key] as string | null | undefined) ?? undefined;
  return (
    <Card className="p-5 sm:p-6">
      {state.error && (
        <p className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <form key={state.attempt} action={action} className="flex flex-col gap-5">
        {job && <input type="hidden" name="id" value={job.id} />}
        <Field label="Job title">
          <input name="title" required maxLength={120} defaultValue={v("title")} placeholder="For example, Trichologist" className={cn(fieldClass, "h-12")} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Type of role">
            <select name="employment" required defaultValue={v("employment") ?? "full_time"} className={cn(fieldClass, "h-12")}>
              {Object.entries(EMPLOYMENT).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Where the work happens">
            <select name="workplace" required defaultValue={v("workplace") ?? "on_site"} className={cn(fieldClass, "h-12")}>
              {Object.entries(WORKPLACE).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Town or city">
            <input name="location" required maxLength={120} defaultValue={v("location")} placeholder="For example, Dublin 2" className={cn(fieldClass, "h-12")} />
          </Field>
          <Field label="Country">
            <input name="country" maxLength={80} defaultValue={v("country") ?? ""} placeholder="For example, Ireland" className={cn(fieldClass, "h-12")} />
          </Field>
        </div>

        <Field label="Pay" hint="Roles that show pay get more applications. Write it the way you'd say it.">
          <input name="pay" maxLength={120} defaultValue={v("pay") ?? ""} placeholder="For example, €32,000 to €38,000 a year, plus commission" className={cn(fieldClass, "h-12")} />
        </Field>

        <Field label="The role in one sentence" hint="This shows on the jobs board, under the title.">
          <input
            name="summary"
            required
            maxLength={240}
            defaultValue={v("summary")}
            placeholder="Lead consultations for shedding and scalp conditions in a busy city clinic."
            className={cn(fieldClass, "h-12")}
          />
        </Field>

        <Field label="About the role" hint="What the work involves, the training or experience you need, and what you offer. Leave a blank line between paragraphs.">
          <textarea name="description" required rows={10} maxLength={8000} defaultValue={v("description")} className={cn(fieldClass, "py-3")} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Apply by email" hint="Applications go straight to this address.">
            <input name="applyEmail" type="email" maxLength={160} defaultValue={v("applyEmail") ?? ""} placeholder="jobs@yourclinic.com" className={cn(fieldClass, "h-12")} />
          </Field>
          <Field label="Or apply through a link" hint="Your careers page or application form.">
            <input name="applyUrl" maxLength={500} defaultValue={v("applyUrl") ?? ""} placeholder="yourclinic.com/careers" className={cn(fieldClass, "h-12")} />
          </Field>
        </div>

        <SubmitButton pending={job ? "Saving…" : "Posting…"} className="self-start">
          {job ? "Save the role" : "Post the role"}
        </SubmitButton>
      </form>
    </Card>
  );
}
