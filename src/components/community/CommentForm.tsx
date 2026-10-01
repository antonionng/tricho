"use client";

import { useActionState, useEffect, useRef } from "react";
import { createComment, type FormState } from "@/app/members/community/actions";
import { SubmitButton } from "@/components/members/SubmitButton";
import { fieldClass } from "@/components/members/MemberPage";
import { cn } from "@/lib/utils";

export function CommentForm({ postId }: { postId: string }) {
  const [state, action] = useActionState<FormState, FormData>(createComment, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} id="reply" className="scroll-mt-24 rounded-2xl border border-rule bg-card p-4 sm:p-5">
      <input type="hidden" name="postId" value={postId} />
      <label htmlFor="reply-body" className="label text-muted-foreground">
        Your reply
      </label>
      <textarea
        id="reply-body"
        name="content"
        required
        minLength={2}
        rows={3}
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
