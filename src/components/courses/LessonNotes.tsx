"use client";

import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { fieldClass } from "@/components/members/MemberPage";
import { cn } from "@/lib/utils";
import { saveNotes } from "@/app/members/courses/[slug]/actions";

type Status = "idle" | "saving" | "saved" | "error";

/**
 * Private notes and the lesson's reflection question. Both save on their own a
 * moment after the learner stops typing, and feed their CPD record.
 */
export function LessonNotes({
  slug,
  lessonSlug,
  reflectionPrompt,
  initialNotes,
  initialReflection,
  canSave,
}: {
  slug: string;
  lessonSlug: string;
  reflectionPrompt: string;
  initialNotes: string;
  initialReflection: string;
  canSave: boolean;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [reflection, setReflection] = useState(initialReflection);
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    if (!canSave || !dirty.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setStatus("saving");
      const res = await saveNotes(slug, lessonSlug, { notes, reflection }).catch(() => ({ ok: false as const }));
      setStatus(res.ok ? "saved" : "error");
    }, 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [notes, reflection, canSave, slug, lessonSlug]);

  const edit = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dirty.current = true;
    set(e.target.value);
  };

  return (
    <section aria-labelledby="notes" className="flex flex-col gap-5 rounded-3xl border border-rule bg-paper-2 p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-2">
          <p className="label text-muted-foreground">Your notes</p>
          <h2 id="notes" className="text-2xl font-semibold tracking-[-0.015em]">
            Write down what you&apos;ll change in your practice.
          </h2>
        </div>
        <p className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground" aria-live="polite">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          {!canSave
            ? "Notes are saved once you're enrolled"
            : status === "saving"
              ? "Saving…"
              : status === "saved"
                ? "Saved, and only visible to you"
                : status === "error"
                  ? "Couldn't save. We'll try again as you type."
                  : "Only visible to you"}
        </p>
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-medium leading-snug">Reflection: {reflectionPrompt}</span>
        <textarea
          value={reflection}
          onChange={edit(setReflection)}
          rows={4}
          disabled={!canSave}
          placeholder="A few sentences is enough. This goes into your CPD record."
          className={cn(fieldClass, "min-h-28 resize-y bg-card leading-relaxed")}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="font-medium leading-snug">Notes</span>
        <textarea
          value={notes}
          onChange={edit(setNotes)}
          rows={5}
          disabled={!canSave}
          placeholder="Anything you want to remember from this lesson."
          className={cn(fieldClass, "min-h-32 resize-y bg-card leading-relaxed")}
        />
      </label>
    </section>
  );
}
