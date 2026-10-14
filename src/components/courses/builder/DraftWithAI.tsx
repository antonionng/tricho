import { Sparkles } from "lucide-react";
import { SubmitButton } from "@/components/members/SubmitButton";

/**
 * Offered on a course with no lessons yet: the author gives an outline, notes
 * or PDFs, and the AI drafts lessons, knowledge checks and an assessment into
 * the builder for them to edit.
 */
export function DraftWithAI({ courseId, action, limitNote }: { courseId: string; action: (form: FormData) => Promise<void>; limitNote?: string }) {
  const field = "w-full rounded-xl border border-rule bg-card px-3.5 py-2.5 text-[15px] leading-relaxed outline-none focus:border-ink/50";
  return (
    <details className="group mb-6 rounded-2xl border border-rule bg-paper-2">
      <summary className="flex cursor-pointer list-none items-start gap-3 p-5 [&::-webkit-details-marker]:hidden">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.6]" aria-hidden />
        <span>
          <span className="block font-semibold">Start from your own material with an AI draft</span>
          <span className="mt-1 block text-[15px] leading-relaxed text-ink-2">
            Give it your outline, notes or slides as PDFs, and it drafts the lessons, case studies, knowledge checks and final assessment for you to edit. It marks anything you should check.
          </span>
        </span>
      </summary>
      <form action={action} className="flex flex-col gap-4 border-t border-rule p-5">
        <input type="hidden" name="id" value={courseId} />
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] font-medium">Outline</span>
          <textarea name="outline" rows={5} className={field} placeholder="The lessons you have in mind, who the course is for, and what learners should be able to do by the end." />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] font-medium">Notes (optional)</span>
          <textarea name="notes" rows={6} className={field} placeholder="Paste your teaching notes, a talk transcript or a handout." />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] font-medium">PDFs (optional, up to three, 9MB each)</span>
          <input type="file" name="files" accept="application/pdf" multiple className="text-[14px]" />
        </label>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Drafting takes a few minutes, and you can leave the page while it works. The draft is yours to edit, and the team still reviews the course before it goes on sale.{limitNote ? ` ${limitNote}` : ""}
        </p>
        <SubmitButton className="self-start" pending="Starting…">
          <Sparkles /> Draft my course
        </SubmitButton>
      </form>
    </details>
  );
}
