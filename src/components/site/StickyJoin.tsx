"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Mobile-only join bar that appears once the hero has scrolled away. */
export function StickyJoin({
  label = "Join the collective",
  href = "/pricing",
  note = "From £9 a month. Cancel anytime.",
}: {
  label?: string;
  href?: string;
  note?: string;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      data-sticky-join
      className={cn(
        "xl:hidden fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper/95 backdrop-blur-xl px-4 pt-3 pb-safe-3 transition-transform duration-300",
        show ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="min-w-0 text-[13px] leading-tight text-ink-2">{note}</p>
        <Link
          href={href}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-medium text-paper"
        >
          {label} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
