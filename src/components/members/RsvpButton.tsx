"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleRsvp } from "@/app/members/events/actions";
import { cn } from "@/lib/utils";

export function RsvpButton({ eventId, going, full }: { eventId: string; going: boolean; full: boolean }) {
  const [, startTransition] = useTransition();
  const [on, setOn] = useOptimistic(going, (s) => !s);

  if (full && !on) {
    return (
      <span className="inline-flex h-11 items-center rounded-full border border-rule px-5 text-sm text-muted-foreground">
        Fully booked
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        aria-pressed={on}
        onClick={() =>
          startTransition(async () => {
            setOn(null);
            await toggleRsvp(eventId);
          })
        }
        className={cn(
          "inline-flex h-11 items-center gap-1.5 rounded-full border px-5 text-sm font-medium transition-colors active:scale-[0.98]",
          on ? "border-positive/30 bg-positive/10 text-positive" : "border-ink bg-ink text-paper hover:bg-ink/85"
        )}
      >
        {on && <Check className="h-4 w-4" />}
        {on ? "You're going" : "I'm going"}
      </button>
      {on && <span className="text-xs text-muted-foreground">Tap again if your plans change.</span>}
    </div>
  );
}
