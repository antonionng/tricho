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
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-background">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 max-w-3xl py-10 space-y-6">
          {messages.length === 0 && (
            <div className="space-y-8 pt-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-primary inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Tricho-AI
                </p>
                <h1 className="tricho-title text-4xl">
                  Clinical decision support
                </h1>
                <p className="text-muted-foreground max-w-xl leading-relaxed">
                  Structure consults, surface red flags, and draft notes. Educational support —
                  not a diagnosis.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="text-left p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/30 transition-colors text-sm text-foreground/80"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {message.role === "user" ? "You" : "Tricho-AI"}
              </span>
              <div
                className={
                  message.role === "user"
                    ? "rounded-2xl bg-primary text-primary-foreground p-4 text-sm leading-relaxed whitespace-pre-wrap"
                    : "rounded-2xl border border-border/50 bg-card p-4 text-sm leading-relaxed whitespace-pre-wrap shadow-sm"
                }
              >
                {message.parts.map((part, i) =>
                  part.type === "text" ? <span key={i}>{part.text}</span> : null
                )}
              </div>
            </div>
          ))}

          {status === "submitted" && (
            <p className="text-sm text-muted-foreground animate-pulse">Thinking…</p>
          )}

          {error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error.message?.includes("not configured")
                ? "Tricho-AI isn't connected yet. Add an AI Gateway key to enable live responses."
                : "Something went wrong. Please try again."}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/50 bg-background">
        <div className="container mx-auto px-4 max-w-3xl py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex items-end gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              rows={1}
              placeholder="Describe the case or ask a clinical question…"
              className="flex-1 resize-none bg-transparent outline-none text-sm py-2 px-1 max-h-40"
            />
            {busy ? (
              <Button
                type="button"
                onClick={() => stop()}
                className="rounded-2xl h-10 w-10 p-0 shrink-0"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!input.trim()}
                className="rounded-2xl h-10 w-10 p-0 shrink-0 disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </form>
          <p className="text-[11px] text-muted-foreground mt-3 text-center">
            Educational decision support only — not a diagnosis or a substitute for clinical
            judgement.
          </p>
        </div>
      </div>
    </div>
  );
}
