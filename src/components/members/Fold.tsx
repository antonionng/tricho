"use client";

import { useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** One collapsible row in a grouped list. Opens on its own when the page's #hash names it. */
export function Fold({
  id,
  title,
  hint,
  open,
  children,
}: {
  id: string;
  title: string;
  /** A short line under the title, such as what is saved now. */
  hint?: React.ReactNode;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details id={id} open={open} className="group scroll-mt-20 border-b border-rule last:border-0">
      <summary
        className={cn(
          "flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-paper-2 sm:px-5",
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink [&::-webkit-details-marker]:hidden"
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium">{title}</span>
          {hint && <span className="mt-0.5 block truncate text-sm text-muted-foreground">{hint}</span>}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="px-4 pb-6 pt-1 sm:px-5">{children}</div>
    </details>
  );
}

/** Opens the row named by the #hash, on load and whenever the hash changes, and scrolls it into view. */
export function OpenFoldFromHash() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const el = id ? document.getElementById(id) : null;
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.scrollIntoView({ block: "start" });
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
