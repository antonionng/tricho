"use client";

import { useOptimistic, useTransition } from "react";
import { ThumbsUp } from "lucide-react";
import { toggleCommentUseful, toggleUseful } from "@/app/members/community/actions";
import { cn } from "@/lib/utils";

export function UsefulButton({
  postId,
  commentId,
  count,
  reacted,
  size = "sm",
}: {
  postId?: string;
  /** Marks a comment as useful instead of a post. */
  commentId?: string;
  count: number;
  reacted: boolean;
  size?: "xs" | "sm" | "lg";
}) {
  const [, startTransition] = useTransition();
  const [state, setState] = useOptimistic({ count, reacted }, (s) => ({
    reacted: !s.reacted,
    count: s.count + (s.reacted ? -1 : 1),
  }));

  return (
    <button
      type="button"
      aria-pressed={state.reacted}
      onClick={() =>
        startTransition(async () => {
          setState(null);
          if (commentId) await toggleCommentUseful(commentId);
          else if (postId) await toggleUseful(postId);
        })
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border text-[13px] transition-colors",
        { xs: "h-8 px-2.5", sm: "h-10 px-3", lg: "h-11 px-4 text-sm" }[size],
        state.reacted ? "border-ink bg-ink text-paper" : "border-rule text-ink-2 hover:border-ink/40"
      )}
    >
      <ThumbsUp className="h-4 w-4 stroke-[1.6]" />
      Useful{state.count > 0 ? ` · ${state.count}` : ""}
    </button>
  );
}
