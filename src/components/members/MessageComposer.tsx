"use client";

import { useActionState, useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { sendMessage } from "@/app/members/messages/actions";
import type { FormState } from "@/app/members/community/actions";
import { useFormStatus } from "react-dom";

function Send() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Send message"
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper transition-opacity disabled:opacity-40"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [state, action] = useActionState<FormState, FormData>(sendMessage, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  }, [state]);

  return (
    <form ref={ref} action={action} className="flex flex-col gap-1">
      <input type="hidden" name="conversationId" value={conversationId} />
      <div className="flex items-end gap-2 rounded-3xl border border-rule bg-card p-2 pl-4">
        <label htmlFor="message-body" className="sr-only">
          Message
        </label>
        <textarea
          id="message-body"
          name="body"
          rows={1}
          required
          placeholder="Write a message"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          className="max-h-40 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground field-sizing-content"
        />
        <Send />
      </div>
      {state?.error && <p className="px-3 text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
