import { Plus } from "lucide-react";
import type { Faq } from "@/content/faqs";

export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {faqs.map((f) => (
        <li key={f.q}>
          <details className="group py-2">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg font-medium text-ink [&::-webkit-details-marker]:hidden">
              {f.q}
              <Plus className="h-5 w-5 shrink-0 stroke-[1.5] transition-transform duration-300 group-open:rotate-45" />
            </summary>
            <p className="pb-5 pr-10 text-[16px] leading-relaxed text-ink-2">{f.a}</p>
          </details>
        </li>
      ))}
    </ul>
  );
}
