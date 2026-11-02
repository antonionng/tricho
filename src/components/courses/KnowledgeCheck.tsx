"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitCheck, type CheckResult } from "@/app/members/courses/[slug]/actions";

type Q = { id: string; prompt: string; options: string[] };

/**
 * The questions at the end of a lesson. Each answer gets its explanation
 * straight away, and answering them completes the lesson.
 */
export function KnowledgeCheck({
  slug,
  lessonSlug,
  questions,
  done,
  nextHref,
  nextLabel,
}: {
  slug: string;
  lessonSlug: string;
  questions: Q[];
  done: boolean;
  nextHref: string;
  nextLabel: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Extract<CheckResult, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const answered = questions.every((q) => answers[q.id] != null);

  function submit() {
    setError(null);
    start(async () => {
      const res = await submitCheck(slug, lessonSlug, answers);
      if (!res.ok) return setError(res.error);
      setResult(res);
      router.refresh();
    });
  }

  function retry() {
    setAnswers({});
    setResult(null);
  }

  const byId = new Map(result?.results.map((r) => [r.id, r]));

  return (
    <section aria-labelledby="check" className="flex flex-col gap-6 rounded-3xl border border-rule bg-card p-5 sm:p-8">
      <div className="flex flex-col gap-2">
        <p className="label text-muted-foreground">Knowledge check</p>
        <h2 id="check" className="text-2xl font-semibold tracking-[-0.015em]">
          Check what you&apos;ve learned before you move on.
        </h2>
        <p className="text-[15px] text-ink-2">
          {done && !result
            ? "You've completed this lesson. You can answer the questions again whenever you like."
            : "Answer every question to complete the lesson. You'll see why each answer is right as soon as you submit."}
        </p>
      </div>

      <ol className="flex flex-col gap-7">
        {questions.map((q, n) => {
          const r = byId.get(q.id);
          return (
            <li key={q.id} className="flex flex-col gap-3">
              <p className="font-medium leading-snug">
                <span className="mr-2 text-muted-foreground tabular-nums">{n + 1}.</span>
                {q.prompt}
              </p>
              <div role="radiogroup" aria-label={q.prompt} className="flex flex-col gap-2">
                {q.options.map((option, i) => {
                  const chosen = answers[q.id] === i;
                  const isAnswer = r && r.answer === i;
                  const wrongPick = r && chosen && !r.correct;
                  return (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      aria-checked={chosen}
                      disabled={!!result || pending}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] leading-snug transition-colors",
                        !r && (chosen ? "border-ink bg-paper-2" : "border-rule hover:border-ink/40"),
                        isAnswer && "border-positive bg-positive/10",
                        wrongPick && "border-destructive/50 bg-destructive/5",
                        r && !isAnswer && !wrongPick && "border-rule opacity-60"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                          chosen ? "border-ink bg-ink text-paper" : "border-ink/30"
                        )}
                        aria-hidden
                      >
                        {isAnswer ? <Check className="h-3 w-3" /> : wrongPick ? <X className="h-3 w-3" /> : null}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>
              {r && (
                <p className={cn("rounded-xl px-4 py-3 text-[15px] leading-relaxed", r.correct ? "bg-positive/10 text-ink" : "bg-paper-2 text-ink")}>
                  <span className="font-semibold">{r.correct ? "That's right. " : "Not quite. "}</span>
                  {r.explain}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {error && <p className="text-[15px] text-destructive">{error}</p>}

      {result ? (
        <div className="flex flex-col gap-4 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px]">
            You answered <strong>{result.score}</strong> of {result.total} correctly.{" "}
            {result.saved ? "This lesson is now complete." : result.note}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={retry}>
              <RotateCcw /> Try again
            </Button>
            <Button asChild>
              <a href={nextHref}>
                {nextLabel} <ArrowRight />
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t border-rule pt-6">
          <Button type="button" size="lg" onClick={submit} disabled={!answered || pending} aria-busy={pending}>
            {pending ? "Checking…" : "Check my answers"}
          </Button>
        </div>
      )}
    </section>
  );
}
