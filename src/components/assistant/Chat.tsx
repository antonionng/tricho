"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Square, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "Diffuse thinning over 6 months, normal scalp — how should I structure the consult?",
  "What red flags would push me to refer a patchy hair loss case urgently?",
  "Draft a client-education summary for telogen effluvium.",
  "Which baseline bloods are reasonable for unexplained shedding?",
];

export function AssistantChat() {
  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const busy = status === "submitted" || status === "streaming";

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    sendMessage({ text: value });
    setInput("");
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-[#D1D0CB]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 max-w-3xl py-12 space-y-8">
          {messages.length === 0 && (
            <div className="space-y-10 pt-8">
              <div className="space-y-4">
                <span className="tricho-caps text-black/40 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" /> Clinical Intelligence
                </span>
                <h1 className="text-5xl md:text-6xl tricho-title uppercase tracking-tighter">
                  Tricho-AI
                </h1>
                <p className="font-sans font-medium text-black/60 max-w-xl">
                  Your clinical decision-support assistant. Structure consults, surface
                  red flags, and draft client summaries. Educational support — not a
                  diagnosis.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="text-left p-4 border border-black/10 bg-white/40 hover:bg-white/70 transition-colors text-sm font-sans font-medium text-black/70"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <span className="tricho-caps text-[10px] text-black/40">
                {message.role === "user" ? "You" : "Tricho-AI"}
              </span>
              <div
                className={
                  message.role === "user"
                    ? "bg-black text-[#D1D0CB] p-5 font-sans text-sm leading-relaxed whitespace-pre-wrap"
                    : "bg-white/50 border border-black/10 p-5 font-sans text-sm leading-relaxed whitespace-pre-wrap"
                }
              >
                {message.parts.map((part, i) =>
                  part.type === "text" ? <span key={i}>{part.text}</span> : null
                )}
              </div>
            </div>
          ))}

          {status === "submitted" && (
            <div className="tricho-caps text-[10px] text-black/40 animate-pulse">
              Tricho-AI is thinking…
            </div>
          )}

          {error && (
            <div className="border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">
              {error.message?.includes("not configured")
                ? "Tricho-AI isn't connected yet. Add an AI Gateway key to enable live responses."
                : "Something went wrong. Please try again."}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-black/10 bg-[#D1D0CB]">
        <div className="container mx-auto px-4 max-w-3xl py-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex items-end gap-3 bg-white/60 border border-black/15 p-3"
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
              className="flex-1 resize-none bg-transparent outline-none text-sm font-sans py-2 px-1 max-h-40"
            />
            {busy ? (
              <Button
                type="button"
                onClick={() => stop()}
                className="rounded-none bg-black text-[#D1D0CB] h-10 w-10 p-0 shrink-0"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!input.trim()}
                className="rounded-none bg-black text-[#D1D0CB] h-10 w-10 p-0 shrink-0 disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </form>
          <p className="tricho-caps text-[9px] text-black/30 mt-3 text-center">
            Tricho-AI provides educational decision support only — not a diagnosis or a
            substitute for clinical judgement.
          </p>
        </div>
      </div>
    </div>
  );
}
