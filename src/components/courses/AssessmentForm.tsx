"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowRight, Award, Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitAssessment, type AssessmentResult } from "@/app/members/courses/[slug]/actions";

type Q = { id: string; prompt: string; options: string[] };

export function AssessmentForm({ slug, questions, needed }: { slug: string; questions: Q[]; needed: number }) {
  const top = useRef<HTMLDivElement>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Extract<AssessmentResult, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const count = questions.filter((q) => answers[q.id] != null).length;

  function submit() {
    setError(null);
    start(async () => {
      const res = await submitAssessment(slug, answers);
      if (!res.ok) return setError(res.error);
      setResult(res);
      top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function retake() {
    setAnswers({});
    setResult(null);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const wrong = new Set(result?.wrong);

  return (
    <div ref={top} className="flex scroll-mt-6 flex-col gap-8">
      {result && (
        <section
          role="status"
          className={cn("flex flex-col gap-4 rounded-3xl p-6 sm:p-8", result.passed ? "bg-ink text-paper" : "border border-rule bg-paper-2")}
        >
          {result.passed ? <Award className="h-8 w-8 stroke-[1.4]" aria-hidden /> : null}
          <h2 className="display text-4xl leading-[1.05]">
            {result.passed
              ? "You passed, and your certificate is ready."
              : result.score >= result.needed - 2
                ? "You're nearly there."
                : "Not this time, but you can take it again."}
          </h2>
          <p className={cn("text-[16px] leading-relaxed", result.passed ? "text-paper/80" : "text-ink-2")}>
            You scored {result.score} out of {result.total}. {result.passed ? "" : `You need ${result.needed} to pass. `}
            {result.passed
              ? "Each answer is explained below, so you can check your reasoning on any you weren't sure of."
              : `The ${result.wrong.length === 1 ? "question" : `${result.wrong.length} questions`} marked below need another look. Go back over the lessons they cover, then take the assessment again. There's no limit on retakes.`}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {result.passed && result.certificate ? (
              <Button asChild size="lg" variant="paper">
                <a href={`/members/courses/${slug}/certificate`}>
                  See your certificate <ArrowRight />
                </a>
              </Button>
            ) : (
              <>
                <Button type="button" size="lg" onClick={retake}>
                  <RotateCcw /> Take it again
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href={`/members/courses/${slug}`}>Back to the lessons</a>
                </Button>
              </>
            )}
          </div>
        </section>
      )}

      <ol className="flex flex-col gap-6">
        {questions.map((q, n) => {
          const missed = wrong.has(q.id);
          const explained = result?.explanations?.[q.id];
          return (
            <li
              key={q.id}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border bg-card p-5 sm:p-6",
                result && !result.passed && missed ? "border-destructive/40" : "border-rule"
              )}
            >
              <p className="flex items-start justify-between gap-4 font-medium leading-snug">
                <span>
                  <span className="mr-2 text-muted-foreground tabular-nums">{n + 1}.</span>
                  {q.prompt}
                </span>
                {result &&
                  (missed ? (
                    <X className="h-5 w-5 shrink-0 text-destructive" aria-label="Needs another look" />
                  ) : (
                    <Check className="h-5 w-5 shrink-0 text-positive" aria-label="Correct" />
                  ))}
              </p>
              <div role="radiogroup" aria-label={q.prompt} className="flex flex-col gap-2">
                {q.options.map((option, i) => {
                  const chosen = answers[q.id] === i;
                  const isAnswer = explained?.answer === i;
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
                        chosen ? "border-ink bg-paper-2" : "border-rule hover:border-ink/40",
                        isAnswer && "border-positive bg-positive/10",
                        result && !chosen && !isAnswer && "opacity-60"
                      )}
                    >
                      <span className={cn("mt-0.5 h-4 w-4 shrink-0 rounded-full border", chosen ? "border-[5px] border-ink" : "border-ink/30")} aria-hidden />
                      {option}
                    </button>
                  );
                })}
              </div>
              {explained && <p className="rounded-xl bg-paper-2 px-4 py-3 text-[15px] leading-relaxed">{explained.explain}</p>}
            </li>
          );
        })}
      </ol>

      {!result && (
        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-rule bg-card/95 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] text-ink-2">
            {count} of {questions.length} answered. You need {needed} correct to pass.
          </p>
          {error && <p className="text-[14px] text-destructive">{error}</p>}
          <Button type="button" size="lg" onClick={submit} disabled={count < questions.length || pending} aria-busy={pending}>
            {pending ? "Marking…" : "Submit my answers"}
          </Button>
        </div>
      )}
    </div>
  );
}
