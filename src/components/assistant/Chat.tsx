"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Square, Sparkles } from "lucide-react";
import type { ProfessionId } from "@/config/rooms";

const BY_PROFESSION: Record<string, string[]> = {
  cosmetic: [
    "Client has traction from tight styles — what should I ask before referring?",
    "How do I explain shedding with telogen timing without diagnosing?",
    "When is salon shedding a referral rather than a styling problem?",
  ],
  clinical: [
    "Diffuse thinning over 6 months, normal scalp — how should I structure the consult?",
    "What red flags would push me to refer a patchy hair loss case urgently?",
    "Draft a client-education summary for telogen effluvium.",
  ],
  medical: [
    "What should a useful trichology referral letter include?",
    "Which baseline bloods are reasonable for unexplained shedding?",
    "Paediatric patchy loss — what belongs with dermatology urgently?",
  ],
  brand: [
    "How should I present a product education session without overclaiming?",
  ],
};

const DEFAULT_SUGGESTIONS = [
  "Diffuse thinning over 6 months, normal scalp — how should I structure the consult?",
  "What red flags would push me to refer a patchy hair loss case urgently?",
  "Draft a client-education summary for telogen effluvium.",
];

export function AssistantChat({
  initialPrompt,
  profession,
}: {
  initialPrompt?: string;
  profession?: ProfessionId | null;
}) {
  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const busy = status === "submitted" || status === "streaming";
  const suggestions =
    (profession && BY_PROFESSION[profession]) || DEFAULT_SUGGESTIONS;

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    sendMessage({ text: value });
    setInput("");
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    );
  };

  useEffect(() => {
    if (initialPrompt && !started.current && messages.length === 0) {
      started.current = true;
      submit(initialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  return (
    <div className="flex h-[calc(100svh-3.5rem-6rem)] flex-col bg-paper lg:h-[calc(100svh-3.5rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {messages.length === 0 && (
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="label inline-flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" /> Assistant
                </p>
                <h1 className="display text-[2.5rem] sm:text-5xl">How can I help with your practice today?</h1>
                <p className="max-w-xl text-[15px] leading-relaxed text-ink-2">
                  Structure a consultation, think through referral routes or draft a note. This is educational support,
                  not a diagnosis.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-2xl border border-rule bg-card p-4 text-left text-[15px] leading-snug text-ink-2 transition-colors hover:border-ink/30 hover:text-ink"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <span className="label text-muted-foreground">{message.role === "user" ? "You" : "Assistant"}</span>
              <div
                className={
                  message.role === "user"
                    ? "whitespace-pre-wrap rounded-3xl rounded-tr-lg bg-ink p-4 text-[15px] leading-relaxed text-paper"
                    : "whitespace-pre-wrap rounded-3xl rounded-tl-lg border border-rule bg-card p-4 text-[15px] leading-relaxed text-ink"
                }
              >
                {message.parts.map((part, i) =>
                  part.type === "text" ? <span key={i}>{part.text}</span> : null
                )}
              </div>
            </div>
          ))}

          {status === "submitted" && (
            <p className="animate-pulse text-sm text-muted-foreground">Thinking…</p>
          )}

          {error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error.message?.includes("not configured")
                ? "The Assistant isn't connected yet, so it can't reply. Please try again later."
                : "Something went wrong. Please try again."}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-rule bg-paper">
        <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6 lg:px-10 lg:py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex items-end gap-2 rounded-3xl border border-rule bg-card p-2 pl-4 focus-within:border-ink/40"
          >
            <label htmlFor="assistant-input" className="sr-only">
              Your question
            </label>
            <textarea
              id="assistant-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              rows={1}
              placeholder="Describe the case or ask a question"
              className="max-h-40 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-[15px] outline-none placeholder:text-muted-foreground field-sizing-content"
            />
            {busy ? (
              <Button
                type="button"
                onClick={() => stop()}
                aria-label="Stop"
                className="h-11 w-11 shrink-0 p-0"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send"
                className="h-11 w-11 shrink-0 p-0 disabled:opacity-30"
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            )}
          </form>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Educational support only. It is not a diagnosis and does not replace your clinical judgement.
          </p>
        </div>
      </div>
    </div>
  );
}
