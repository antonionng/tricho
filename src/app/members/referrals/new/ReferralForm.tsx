"use client";

import { useActionState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/members/MemberPage";
import { CONTEXT_MAX, REASON_MAX, SUMMARY_MAX, SUMMARY_MIN } from "@/lib/client-referrals";
import { cn } from "@/lib/utils";
import { createReferral, type ReferralFormState } from "../actions";

export function ReferralForm({ toId, toName }: { toId: string; toName: string }) {
  const [state, action, pending] = useActionState<ReferralFormState, FormData>(createReferral, null);
  const v = state?.values;
  // Remount the fields with the returned values after each submit, so nothing typed is lost.
  const key = v ? `${v.summary.length}:${v.reason.length}:${v.clientContext.length}:${state?.findings?.length ?? 0}` : "empty";

  return (
    <form action={action} className="flex flex-col gap-5" key={key}>
      <input type="hidden" name="to" value={toId} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">What is the client&apos;s concern?</span>
        <textarea
          name="summary"
          required
          minLength={SUMMARY_MIN}
          maxLength={SUMMARY_MAX}
          rows={7}
          defaultValue={v?.summary ?? ""}
          placeholder="For example: diffuse shedding for about six months, starting after a period of illness. Bloods from her GP showed low ferritin. She would like a trichologist's assessment and a treatment plan."
          className={cn(fieldClass, "resize-y py-3")}
        />
        <span className="text-xs text-muted-foreground">
          Describe the concern, how long it has been going on and anything already tried, in {SUMMARY_MIN} to {SUMMARY_MAX.toLocaleString("en-GB")} characters.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Why are you referring the client to {toName}? (optional)</span>
        <input
          name="reason"
          maxLength={REASON_MAX}
          defaultValue={v?.reason ?? ""}
          placeholder="For example: she needs a scalp biopsy, which is outside my scope."
          className={cn(fieldClass, "h-12")}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Non-identifying context (optional)</span>
        <input
          name="clientContext"
          maxLength={CONTEXT_MAX}
          defaultValue={v?.clientContext ?? ""}
          placeholder="For example: woman in her 40s, Dublin area"
          className={cn(fieldClass, "h-12")}
        />
        <span className="text-xs text-muted-foreground">An age range and a general area are enough. Never include a name, date of birth or contact details.</span>
      </label>

      {state?.findings && state.findings.length > 0 && (
        <div
          role="alert"
          className={cn(
            "flex gap-3 rounded-2xl border p-4 text-sm",
            state.needsConfirm ? "border-rule bg-paper-2 text-ink" : "border-destructive/30 bg-destructive/5 text-destructive"
          )}
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div className="flex flex-col gap-2">
            <p className="font-medium">
              {state.needsConfirm
                ? "Your referral may contain details that could identify the client. Please check it before you send it."
                : "Your referral contains contact details, so it has not been sent."}
            </p>
            <ul className="list-disc space-y-1 pl-4">
              {state.findings.map((f) => (
                <li key={f.kind}>{f.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {state?.needsConfirm && (
        <label className="flex items-start gap-3">
          <input type="checkbox" name="confirm" value="yes" required className="mt-1 h-5 w-5 shrink-0 accent-ink" />
          <span className="text-[15px]">I have checked this referral, and nothing in it identifies the client.</span>
        </label>
      )}

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? "Sending…" : `Send the referral to ${toName}`}
      </Button>
    </form>
  );
}
