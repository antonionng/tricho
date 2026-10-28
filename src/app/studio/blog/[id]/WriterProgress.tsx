"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle, Loader2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STEP_LABEL, STEP_ORDER, type WriterState } from "@/content/blog/writer";
import { cn } from "@/lib/utils";

/**
 * Drives the AI writer while a post is being written: asks the server to carry
 * on until the post is done, and refreshes so each step shows as it finishes.
 */
export function WriterProgress({ id, question, state, canEdit }: { id: string; question: string; state: WriterState | null; canEdit: boolean }) {
  const router = useRouter();
  const running = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const failed = state?.step === "failed";
  const [elapsed, setElapsed] = useState(0);

  const run = useCallback(async () => {
    if (running.current || !canEdit) return;
    running.current = true;
    setMessage(null);
    try {
      // Each request does as many steps as fit; keep going until the post is done or something fails.
      for (let i = 0; i < 8; i++) {
        const res = await fetch(`/studio/blog/${id}/generate`, { method: "POST" });
        const body = (await res.json().catch(() => null)) as { ok?: boolean; done?: boolean; message?: string } | null;
        router.refresh();
        if (!res.ok || !body?.ok) {
          setMessage(body?.message ?? "The writer stopped. Try again in a moment.");
          break;
        }
        if (body.done) break;
        if (/already working/.test(body.message ?? "")) await new Promise((r) => setTimeout(r, 5000));
      }
    } catch {
      setMessage("The connection dropped. The writer may still be working; this page keeps checking.");
    } finally {
      running.current = false;
      router.refresh();
    }
  }, [id, router, canEdit]);

  useEffect(() => {
    if (!failed) void run();
  }, [failed, run]);

  useEffect(() => {
    const refresh = setInterval(() => router.refresh(), 3000);
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      clearInterval(refresh);
      clearInterval(tick);
    };
  }, [router]);

  const current = failed ? state?.failedAt : state?.step;
  const at = current ? STEP_ORDER.indexOf(current) : 0;
  const steps = STEP_ORDER.filter((s) => s !== "done");

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6">
      <header className="space-y-3">
        <p className="label text-muted-foreground">The AI writer is working on</p>
        <h1 className="display text-4xl sm:text-5xl">{question}</h1>
        {state?.note && <p className="text-sm text-ink-2">Your note: {state.note}</p>}
      </header>

      <ol className="space-y-1 rounded-3xl border border-rule bg-card p-3">
        {steps.map((s, i) => {
          const done = i < at;
          const active = i === at;
          return (
            <li key={s} className={cn("flex items-center gap-3 rounded-2xl px-4 py-3", active && "bg-paper-2")}>
              <span className="grid h-6 w-6 shrink-0 place-items-center">
                {done ? (
                  <Check className="h-5 w-5 text-positive" />
                ) : active && failed ? (
                  <X className="h-5 w-5 text-destructive" />
                ) : active ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Circle className="h-4 w-4 text-rule" />
                )}
              </span>
              <span className={cn("text-[15px]", done || active ? "text-ink" : "text-muted-foreground")}>{STEP_LABEL[s]}</span>
            </li>
          );
        })}
      </ol>

      {state?.plan && (
        <section className="space-y-3">
          <h2 className="label text-muted-foreground">The plan</h2>
          <p className="text-[15px] text-ink-2">{state.plan.searchIntent}</p>
          <ul className="space-y-1 text-[15px]">
            {state.plan.outline.map((o) => (
              <li key={o.heading} className="border-l-2 border-rule pl-3">
                {o.heading}
              </li>
            ))}
          </ul>
        </section>
      )}

      {state?.research && (
        <section className="space-y-3">
          <h2 className="label text-muted-foreground">Sources read</h2>
          <ul className="space-y-2 text-sm">
            {state.research.map((r) => (
              <li key={r.url} className="flex items-start gap-2">
                {r.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-positive" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
                <span>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="underline decoration-mute underline-offset-2">
                    {r.label}
                  </a>
                  <span className="text-muted-foreground"> {r.ok ? `· ${Math.round(r.chars / 100) / 10}k characters` : `· ${r.error}`}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(failed || message) && (
        <div role="status" className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          <p>{state?.error ?? message}</p>
          {canEdit && (
            <Button variant="outline" onClick={() => void run()}>
              <RotateCcw /> Try again from where it stopped
            </Button>
          )}
        </div>
      )}

      {!failed && !message && (
        <p className="text-center text-sm text-muted-foreground">
          {elapsed < 240 ? "This usually takes two to four minutes. Keep this page open; if you leave, the writer carries on from the same step when you come back." : "Still going. Long posts with many sources take a little longer."}
        </p>
      )}
    </div>
  );
}
