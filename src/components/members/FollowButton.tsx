"use client";

import { useOptimistic, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { toggleFollow } from "@/app/members/people/actions";
import { cn } from "@/lib/utils";

export function FollowButton({
  userId,
  following,
  size = "sm",
  className,
}: {
  userId: string;
  following: boolean;
  size?: "sm" | "lg";
  className?: string;
}) {
  const [, startTransition] = useTransition();
  const [on, setOn] = useOptimistic(following, (s) => !s);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() =>
        startTransition(async () => {
          setOn(null);
          await toggleFollow(userId);
        })
      }
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.98]",
        size === "sm" ? "h-10 px-4 text-[13px]" : "h-12 px-6 text-[15px]",
        on ? "border-rule bg-paper-2 text-ink-2 hover:border-ink/30" : "border-ink bg-ink text-paper hover:bg-ink/85",
        className
      )}
    >
      {on ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {on ? "Following" : "Follow"}
    </button>
  );
}
