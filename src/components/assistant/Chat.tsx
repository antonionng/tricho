"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ArrowUpRight, Check, Copy, RotateCcw, Search, SquarePen, Square, Sparkles } from "lucide-react";
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

const DISCLAIMER = "Educational support only. It is not a diagnosis and does not replace your clinical judgement.";

function textOf(message: UIMessage) {
  return message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

/** Turns whatever the server sent back into one sentence a member can act on. */
function friendlyError(error: Error) {
  const msg = error.message || "";
  if (/not (configured|switched on)|AI_GATEWAY_API_KEY|unauthenticated|api key/i.test(msg)) {
    return "The Assistant can't reach its AI service right now, so it can't reply. Please try again later.";
  }
  if (/402|Professional plan/i.test(msg)) return "The Assistant is part of Professional membership.";
  if (/401|unauthorized/i.test(msg)) return "Your session has ended. Please sign in again to keep using the Assistant.";
  if (/rate|429|too many/i.test(msg)) return "The Assistant is busy right now. Please wait a moment and try again.";
  return "The Assistant couldn't finish that reply. Please try again.";
}

export function AssistantChat({
  initialPrompt,
  profession,
}: {
  initialPrompt?: string;
  profession?: ProfessionId | null;
}) {
  const { messages, sendMessage, status, stop, error, regenerate, setMessages, clearError } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pinned = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const started = useRef(false);

  const busy = status === "submitted" || status === "streaming";
  const empty = messages.length === 0;
  const suggestions = (profession && BY_PROFESSION[profession]) || DEFAULT_SUGGESTIONS;

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Follow the reply as it streams, unless the member has scrolled up to read.
  useEffect(() => {
    if (pinned.current) scrollToBottom(false);
  }, [messages, status, error, scrollToBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    pinned.current = atBottom;
    setShowJump(!atBottom);
  };

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    if (error) clearError();
    pinned.current = true;
    sendMessage({ text: value });
    setInput("");
    requestAnimationFrame(() => scrollToBottom());
  };

  const newConversation = () => {
    if (busy) stop();
    setMessages([]);
    clearError();
    setInput("");
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (initialPrompt && !started.current && messages.length === 0) {
      started.current = true;
      submit(initialPrompt);
    } else {
      inputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  const last = messages[messages.length - 1];
  const waiting = busy && (last?.role === "user" || (last?.role === "assistant" && !textOf(last) && !hasToolPart(last)));

  const composer = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(input);
      }}
      className="flex items-end gap-2 rounded-[1.75rem] border border-rule bg-card p-2 pl-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)] transition-colors focus-within:border-ink/40"
    >
      <label htmlFor="assistant-input" className="sr-only">
        Your question
      </label>
      <textarea
        id="assistant-input"
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit(input);
          }
        }}
        rows={1}
        placeholder={empty ? "Describe the case or ask a question" : "Ask a follow-up"}
        className="max-h-48 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground field-sizing-content"
      />
      {busy ? (
        <Button type="button" onClick={() => stop()} aria-label="Stop the reply" className="h-11 w-11 shrink-0 rounded-full p-0">
          <Square className="h-3.5 w-3.5 fill-current" />
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send"
          className="h-11 w-11 shrink-0 rounded-full p-0 disabled:bg-ink/15 disabled:text-ink/50 disabled:opacity-100"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </form>
  );

  if (empty) {
    return (
      <div className="flex h-[calc(100svh-3.5rem-6rem)] flex-col overflow-y-auto bg-paper lg:h-[calc(100svh-3.5rem)]">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
          <div className="space-y-3 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-ink text-paper">
              <Sparkles className="h-5 w-5" />
            </span>
            <h1 className="display text-[2rem] sm:text-[2.75rem]">How can I help with your practice today?</h1>
            <p className="mx-auto max-w-md text-[15px] leading-relaxed text-ink-2">
              Structure a consultation, think through referral routes or draft a client note.
            </p>
          </div>

          <div className="mt-8">{composer}</div>

          <div className="mt-6">
            <p className="label mb-2 px-1 text-muted-foreground">Try asking</p>
            <ul className="divide-y divide-rule overflow-hidden rounded-2xl border border-rule bg-card/60">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    onClick={() => submit(s)}
                    className="group flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-[15px] leading-snug text-ink-2 transition-colors hover:bg-card hover:text-ink"
                  >
                    <span>{s}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-mute transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">{DISCLAIMER}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100svh-3.5rem-6rem)] flex-col bg-paper lg:h-[calc(100svh-3.5rem)]">
      <div className="border-b border-rule">
        <div className="mx-auto flex h-12 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <p className="label inline-flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Assistant
          </p>
          <button
            onClick={newConversation}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
          >
            <SquarePen className="h-4 w-4" /> New conversation
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div ref={scrollRef} onScroll={onScroll} className="h-full overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6">
            {messages.map((message, i) =>
              message.role === "user" ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-md bg-ink px-4 py-3 text-[15px] leading-relaxed text-paper">
                    {textOf(message)}
                  </div>
                </div>
              ) : (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  streaming={busy && i === messages.length - 1}
                  canRetry={!busy && i === messages.length - 1}
                  onRetry={() => regenerate()}
                />
              )
            )}

            {waiting && (
              <div className="flex gap-3" aria-live="polite">
                <Avatar />
                <div className="flex items-center gap-1 pt-3" aria-label="The Assistant is thinking">
                  <Dot delay="0ms" />
                  <Dot delay="150ms" />
                  <Dot delay="300ms" />
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-3">
                <Avatar />
                <div className="flex-1 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3">
                  <p className="text-[15px] leading-relaxed text-destructive">{friendlyError(error)}</p>
                  <button
                    onClick={() => regenerate()}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline-offset-4 hover:underline"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Try again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showJump && (
          <button
            onClick={() => {
              pinned.current = true;
              scrollToBottom();
            }}
            aria-label="Jump to the latest message"
            className="absolute bottom-4 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-rule bg-card text-ink shadow-md transition-colors hover:bg-paper-2"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="bg-paper">
        <div className="mx-auto w-full max-w-3xl px-4 pt-2 pb-3 sm:px-6 lg:pb-4">
          {composer}
          <p className="mt-2 text-center text-[11px] text-muted-foreground">{DISCLAIMER}</p>
        </div>
      </div>
    </div>
  );
}

function hasToolPart(message: UIMessage) {
  return message.parts.some((p) => p.type.startsWith("tool-"));
}

function AssistantMessage({
  message,
  streaming,
  canRetry,
  onRetry,
}: {
  message: UIMessage;
  streaming: boolean;
  canRetry: boolean;
  onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const text = textOf(message);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="group flex gap-3">
      <Avatar />
      <div className="min-w-0 flex-1 pt-1">
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <div key={i} className="prose-chat">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} target={href?.startsWith("/") ? undefined : "_blank"} rel="noreferrer">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {part.text}
                </ReactMarkdown>
              </div>
            );
          }
          if (part.type === "tool-searchDirectory") {
            const done = "state" in part && part.state === "output-available";
            return (
              <p key={i} className="mb-3 inline-flex items-center gap-2 rounded-full bg-paper-2 px-3 py-1 text-xs text-ink-2">
                <Search className={`h-3.5 w-3.5 ${done ? "" : "animate-pulse"}`} />
                {done ? "Searched the directory" : "Searching the directory…"}
              </p>
            );
          }
          return null;
        })}

        {!streaming && text && (
          <div className="mt-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
            <IconButton label={copied ? "Copied" : "Copy"} onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </IconButton>
            {canRetry && (
              <IconButton label="Write a new reply" onClick={onRetry}>
                <RotateCcw className="h-4 w-4" />
              </IconButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-paper-2 hover:text-ink"
    >
      {children}
    </button>
  );
}

function Avatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-paper" aria-hidden>
      <Sparkles className="h-4 w-4" />
    </span>
  );
}

function Dot({ delay }: { delay: string }) {
  return <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mute" style={{ animationDelay: delay }} />;
}
