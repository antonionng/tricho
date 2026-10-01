import { Plus } from "lucide-react";

/** Expandable syllabus: one native <details> per lesson, so it works without JavaScript. */
export function Syllabus({ lessons }: { lessons: { title: string; detail: string }[] }) {
  return (
    <ol className="divide-y divide-rule border-y border-rule">
      {lessons.map((lesson, i) => (
        <li key={lesson.title}>
          <details className="group py-1" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center gap-5 py-4 [&::-webkit-details-marker]:hidden">
              <span className="label w-8 shrink-0 text-muted-foreground tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-lg font-medium text-ink">{lesson.title}</span>
              <Plus
                className="h-5 w-5 shrink-0 stroke-[1.5] transition-transform duration-300 group-open:rotate-45"
                aria-hidden
              />
            </summary>
            <p className="pb-5 pl-13 pr-10 text-[16px] leading-relaxed text-ink-2">{lesson.detail}</p>
          </details>
        </li>
      ))}
    </ol>
  );
}
