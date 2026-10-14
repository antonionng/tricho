"use client";

import { Check, X } from "lucide-react";
import type { Question } from "@/content/course-types";
import { cn } from "@/lib/utils";
import { AddButton, Field, ItemControls, TextArea, TextInput, move, newId } from "./fields";

/** Multiple-choice questions: the knowledge check after a lesson, or the final assessment. */
export function QuestionList({ questions, onChange, idPrefix, addLabel }: { questions: Question[]; onChange: (q: Question[]) => void; idPrefix: string; addLabel: string }) {
  const set = (i: number, q: Question) => onChange(questions.map((x, j) => (j === i ? q : x)));
  return (
    <div className="flex flex-col gap-4">
      {questions.map((q, i) => (
        <div key={q.id} className="flex flex-col gap-4 rounded-2xl border border-rule bg-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="label pt-2 text-muted-foreground">Question {i + 1}</p>
            <ItemControls
              label={`question ${i + 1}`}
              onUp={i > 0 ? () => onChange(move(questions, i, -1)) : undefined}
              onDown={i < questions.length - 1 ? () => onChange(move(questions, i, 1)) : undefined}
              onRemove={() => onChange(questions.filter((_, j) => j !== i))}
            />
          </div>
          <Field label="Question">
            <TextArea value={q.prompt} onChange={(prompt) => set(i, { ...q, prompt })} rows={2} placeholder="A client tells you… What should you do first?" />
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-[14px] font-medium">Answers, with the correct one ticked</legend>
            {q.options.map((option, o) => (
              <div key={o} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => set(i, { ...q, answer: o })}
                  aria-pressed={q.answer === o}
                  aria-label={`Mark answer ${o + 1} as correct`}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",
                    q.answer === o ? "border-positive bg-positive text-paper" : "border-rule text-muted-foreground hover:border-ink/40"
                  )}
                >
                  <Check className="h-4 w-4" />
                </button>
                <TextInput value={option} onChange={(v) => set(i, { ...q, options: q.options.map((x, j) => (j === o ? v : x)) })} placeholder={`Answer ${o + 1}`} aria-label={`Answer ${o + 1}`} />
                {q.options.length > 2 && (
                  <button
                    type="button"
                    aria-label={`Remove answer ${o + 1}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      const options = q.options.filter((_, j) => j !== o);
                      const answer = q.answer === o ? 0 : q.answer > o ? q.answer - 1 : q.answer;
                      set(i, { ...q, options, answer });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {q.options.length < 6 && <AddButton onClick={() => set(i, { ...q, options: [...q.options, ""] })}>Add an answer</AddButton>}
          </fieldset>
          <Field label="Why the correct answer is right" hint="Learners see this as soon as they answer, so make it teach the point.">
            <TextArea value={q.explain} onChange={(explain) => set(i, { ...q, explain })} rows={2} />
          </Field>
        </div>
      ))}
      <AddButton onClick={() => onChange([...questions, { id: newId(idPrefix), prompt: "", options: ["", "", "", ""], answer: 0, explain: "" }])}>{addLabel}</AddButton>
    </div>
  );
}
