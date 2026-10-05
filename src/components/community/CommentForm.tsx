"use client";

import { useActionState, useEffect, useRef } from "react";
import { createComment, type FormState } from "@/app/members/community/actions";
import { SubmitButton } from "@/components/members/SubmitButton";
import { fieldClass } from "@/components/members/MemberPage";
import { cn } from "@/lib/utils";

export function CommentForm({
  postId,
  parentId,
  replyingTo,
  onDone,
}: {
  postId: string;
  /** Set when answering a particular comment. */
  parentId?: string;
  replyingTo?: string;
  onDone?: () => void;
}) {
  const [state, action] = useActionState<FormState, FormData>(createComment, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state?.ok) return;
    ref.current?.reset();
    onDone?.();
  }, [state, onDone]);
  const fieldId = parentId ? `reply-${parentId}` : "reply-body";

  return (
    <form
      ref={ref}
      action={action}
      id={parentId ? undefined : "reply"}
      className={cn("scroll-mt-24 rounded-2xl border border-rule bg-card", parentId ? "p-3" : "p-4 sm:p-5")}
    >
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <label htmlFor={fieldId} className="label text-muted-foreground">
        {replyingTo ? `Reply to ${replyingTo}` : "Your reply"}
      </label>
      <textarea
        id={fieldId}
        autoFocus={!!parentId}
        name="content"
        required
        minLength={2}
        rows={parentId ? 2 : 3}
        placeholder="Add something useful: an experience, a question or a reference."
        className={cn(fieldClass, "mt-2 resize-y py-3 leading-relaxed")}
      />
      {state?.error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <div className="mt-3 flex justify-end">
        <SubmitButton pending="Replying…">Reply</SubmitButton>
      </div>
    </form>
  );
}
