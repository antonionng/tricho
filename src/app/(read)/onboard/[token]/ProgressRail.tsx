"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** The chapters of the onboarding page, with the one being read marked as you scroll. */
export function ProgressRail({ chapters }: { chapters: { id: string; label: string; done?: boolean }[] }) {
  const [active, setActive] = useState(chapters[0]?.id);
  const list = useRef<HTMLOListElement>(null);

  // On a phone the rail scrolls sideways, so keep the current chapter in view.
  useEffect(() => {
    const ol = list.current;
    const link = ol?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!ol || !link) return;
    const left = link.offsetLeft - (ol.clientWidth - link.offsetWidth) / 2;
    ol.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    // The chapter whose top has passed a line a third of the way down the screen.
    const update = () => {
      const line = window.innerHeight / 3;
      let current = chapters[0]?.id;
      for (const c of chapters) {
        const el = document.getElementById(c.id);
        if (el && el.getBoundingClientRect().top <= line) current = c.id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [chapters]);

  return (
    <nav aria-label="Your onboarding" className="sticky top-0 z-30 border-b border-rule bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
      <ol ref={list} className="relative mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2.5 text-xs [scrollbar-width:none] sm:justify-center sm:gap-2 sm:px-6">
        {chapters.map((c, i) => (
          <li key={c.id} className="shrink-0">
            <a
              href={`#${c.id}`}
              aria-current={active === c.id ? "step" : undefined}
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded-full px-3 transition-colors",
                active === c.id ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2"
              )}
            >
              <span className={cn("mag-didone text-sm", c.done && active !== c.id && "text-[var(--c-strong)]")} aria-hidden>
                {c.done ? "✓" : ["I", "II", "III", "IV", "V", "VI"][i] ?? i + 1}
              </span>
              {c.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
