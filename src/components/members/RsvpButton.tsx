"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleRsvp } from "@/app/members/events/actions";
import { cn } from "@/lib/utils";

export function RsvpButton({ eventId, going, full }: { eventId: string; going: boolean; full: boolean }) {
  const [pending, startTransition] = useTransition();
  const [on, setOn] = useOptimistic(going, (s) => !s);
  const [error, setError] = useState<string | null>(null);

  if (full && !on) {
    return (
      <span className="inline-flex h-11 items-center rounded-full border border-rule px-5 text-sm text-muted-foreground">
        Fully booked
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={on}
          aria-busy={pending}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              setOn(null);
              try {
                const result = await toggleRsvp(eventId);
                if (!result.ok) setError(result.error ?? "We could not update your place. Please try again.");
              } catch {
                setError("We could not update your place. Please check your connection and try again.");
              }
            })
          }
          className={cn(
            "inline-flex h-11 items-center gap-1.5 rounded-full border px-5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.98] disabled:opacity-70",
            on ? "border-positive/30 bg-positive/10 text-positive" : "border-ink bg-ink text-paper hover:bg-ink/85"
          )}
        >
          {on && <Check className="h-4 w-4" />}
          {on ? "You're going" : "I'm going"}
        </button>
        {on && !error && <span className="text-xs text-muted-foreground">Tap again if your plans change.</span>}
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
