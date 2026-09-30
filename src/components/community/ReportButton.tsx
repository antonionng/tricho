"use client";

import { useActionState, useState } from "react";
import { Flag } from "lucide-react";
import { reportPost, type FormState } from "@/app/members/community/actions";
import { SubmitButton } from "@/components/members/SubmitButton";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/members/MemberPage";
import { cn } from "@/lib/utils";

const REASONS = [
  { id: "identifying", label: "Could identify a client" },
  { id: "unsafe", label: "Unsafe or misleading advice" },
  { id: "promotion", label: "Advertising or self-promotion" },
  { id: "unkind", label: "Unkind or disrespectful" },
  { id: "other", label: "Something else" },
];

export function ReportButton({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(reportPost, null);

  if (state?.ok) {
    return (
      <p className="text-sm text-ink-2" role="status">
        {state.message}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground hover:bg-paper-2 hover:text-ink"
      >
        <Flag className="h-4 w-4 stroke-[1.6]" /> Report
      </button>
    );
  }

  return (
    <form action={action} className="w-full rounded-2xl border border-rule bg-paper-2 p-4">
      <input type="hidden" name="postId" value={postId} />
      <fieldset>
        <legend className="text-sm font-medium">What is the problem with this post?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {REASONS.map((r) => (
            <label key={r.id} className="flex items-center gap-2.5 rounded-xl border border-rule bg-card px-3 py-2.5 text-sm">
              <input type="radio" name="reason" value={r.id} required className="accent-[var(--ink)]" />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>
      <textarea
        name="detail"
        rows={2}
        maxLength={600}
        placeholder="Anything else we should know (optional)"
        className={cn(fieldClass, "mt-3 resize-y bg-card py-2.5 text-sm")}
      />
      {state?.error && <p className="mt-2 text-sm text-destructive">{state.error}</p>}
      <p className="mt-2 text-xs text-muted-foreground">Reports are private. The author is not told who made them.</p>
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <SubmitButton size="default" pending="Sending…">
          Send report
        </SubmitButton>
      </div>
    </form>
  );
}
