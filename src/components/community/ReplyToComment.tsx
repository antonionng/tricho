"use client";

import { useState } from "react";
import { CornerDownRight } from "lucide-react";
import { CommentForm } from "@/components/community/CommentForm";

/** A "Reply" link under a comment that opens a reply box in place. */
export function ReplyToComment({ postId, parentId, name }: { postId: string; parentId: string; name: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] text-ink-2 hover:text-ink"
      >
        <CornerDownRight className="h-4 w-4 stroke-[1.6]" /> Reply
      </button>
    );
  }
  return (
    <div className="mt-2 w-full">
      <CommentForm postId={postId} parentId={parentId} replyingTo={name} onDone={() => setOpen(false)} />
    </div>
  );
}
