import { AlertTriangle, Lightbulb, MessageSquareQuote, ShieldAlert, Users } from "lucide-react";
import type { CalloutTone, LessonBlock } from "@/content/course-types";
import { cn } from "@/lib/utils";
import { CopyTemplate } from "./CopyTemplate";

const CALLOUT: Record<CalloutTone, { icon: typeof Lightbulb; label: string; className: string }> = {
  tip: { icon: Lightbulb, label: "In practice", className: "border-rule bg-paper-2" },
  caution: { icon: AlertTriangle, label: "Take care", className: "border-amber-300/70 bg-amber-50" },
  redflag: { icon: ShieldAlert, label: "Red flag", className: "border-destructive/30 bg-destructive/5" },
  scope: { icon: Users, label: "Scope of practice", className: "border-positive/30 bg-positive/5" },
};

/** Renders a lesson's teaching content in the house reading style. */
export function LessonBlocks({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="flex flex-col gap-6 text-[17px] leading-[1.7] text-ink">
      {blocks.map((block, i) => (
        <Block key={i} block={block} index={i} />
      ))}
    </div>
  );
}

function Block({ block, index }: { block: LessonBlock; index: number }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "h":
      return <h2 className="mt-6 text-2xl font-semibold leading-tight tracking-[-0.015em]">{block.text}</h2>;
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List className={cn("flex flex-col gap-2 pl-6", block.ordered ? "list-decimal" : "list-disc", "marker:text-muted-foreground")}>
          {block.items.map((item) => (
            <li key={item} className="pl-1">
              {item}
            </li>
          ))}
        </List>
      );
    }
    case "callout": {
      const tone = CALLOUT[block.tone];
      const Icon = tone.icon;
      return (
        <aside className={cn("flex gap-4 rounded-2xl border p-5 sm:p-6", tone.className)}>
          <Icon className="mt-1 h-5 w-5 shrink-0 stroke-[1.6]" aria-hidden />
          <div className="flex flex-col gap-1.5">
            <p className="label text-muted-foreground">{tone.label}</p>
            <p className="font-semibold leading-snug">{block.title}</p>
            <p className="text-[16px] leading-relaxed text-ink-2">{block.text}</p>
          </div>
        </aside>
      );
    }
    case "case":
      return (
        <section className="overflow-hidden rounded-2xl border border-rule bg-card" aria-label={`Case study: ${block.title}`}>
          <div className="flex flex-col gap-3 p-5 sm:p-6">
            <p className="label text-muted-foreground">Case study</p>
            <p className="text-lg font-semibold leading-snug tracking-tight">{block.title}</p>
            <p className="text-[16px] leading-relaxed text-ink-2">{block.scenario}</p>
            <p className="font-medium">{block.question}</p>
          </div>
          <details className="group border-t border-rule">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[15px] font-medium sm:px-6 [&::-webkit-details-marker]:hidden">
              <span>Think it through, then see the discussion</span>
              <span className="text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="px-5 pb-5 text-[16px] leading-relaxed text-ink-2 sm:px-6 sm:pb-6">{block.discussion}</p>
          </details>
        </section>
      );
    case "script":
      return (
        <figure className="flex flex-col gap-4 rounded-2xl bg-ink p-5 text-paper sm:p-7">
          <figcaption className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-paper/60">
            <MessageSquareQuote className="h-4 w-4" aria-hidden /> {block.title}
          </figcaption>
          <div className="flex flex-col gap-3">
            {block.lines.map((line) => (
              <blockquote key={line} className="border-l-2 border-paper/25 pl-4 text-[16px] leading-relaxed">
                {line}
              </blockquote>
            ))}
          </div>
        </figure>
      );
    case "steps":
      return (
        <section className="flex flex-col gap-4">
          <p className="font-semibold">{block.title}</p>
          <ol className="flex flex-col divide-y divide-rule border-y border-rule">
            {block.steps.map((step, i) => (
              <li key={step.title} className="flex gap-4 py-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-rule text-[13px] font-semibold tabular-nums">
                  {i + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <p className="font-medium leading-snug">{step.title}</p>
                  <p className="text-[16px] leading-relaxed text-ink-2">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      );
    case "table":
      return (
        <figure className="flex flex-col gap-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-[15px]">
              <thead>
                <tr className="border-b border-ink">
                  {block.head.map((h) => (
                    <th key={h} scope="col" className="py-2.5 pr-4 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r} className="border-b border-rule align-top">
                    {row.map((cell, c) => (
                      <td key={c} className={cn("py-3 pr-4 leading-relaxed", c === 0 ? "font-medium" : "text-ink-2")}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <figcaption className="text-[13px] text-muted-foreground">{block.caption}</figcaption>
        </figure>
      );
    case "terms":
      return (
        <dl className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2">
          {block.items.map((t) => (
            <div key={t.term} className="flex flex-col gap-1 bg-card p-4">
              <dt className="font-semibold leading-snug">{t.term}</dt>
              <dd className="text-[15px] leading-relaxed text-ink-2">{t.meaning}</dd>
            </div>
          ))}
        </dl>
      );
    case "template":
      return <CopyTemplate id={`template-${index}`} title={block.title} body={block.body} />;
  }
}
