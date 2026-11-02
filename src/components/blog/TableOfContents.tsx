"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** The post's sections, with the one being read highlighted. */
export function TableOfContents({ headings }: { headings: { id: string; text: string }[] }) {
  const [active, setActive] = useState(headings[0]?.id);

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [headings]);

  return (
    <nav aria-label="In this post">
      <p className="label mb-5 text-muted-foreground">In this post</p>
      <ol className="flex flex-col border-l border-rule">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={cn(
                "-ml-px block border-l py-2 pl-4 text-[14px] leading-snug transition-colors",
                active === h.id ? "border-ink text-ink" : "border-transparent text-muted-foreground hover:text-ink"
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
