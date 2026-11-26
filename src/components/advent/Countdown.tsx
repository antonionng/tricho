"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [
    { v: Math.floor(s / 86400), l: "days" },
    { v: Math.floor((s % 86400) / 3600), l: "hours" },
    { v: Math.floor((s % 3600) / 60), l: "minutes" },
    { v: s % 60, l: "seconds" },
  ];
}

/** Counts down to the next door, then reloads the calendar so it opens. */
export function Countdown({ until, label }: { until: string; label: string }) {
  const router = useRouter();
  const target = Date.parse(until);
  // Null until mounted, so the server and the browser never disagree about the time.
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    let done = false;
    const tick = () => {
      const ms = target - Date.now();
      setLeft(ms);
      if (ms <= 0 && !done) {
        done = true;
        router.refresh();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target, router]);

  const units = parts(left ?? 0);
  return (
    <div className="flex flex-col gap-3" role="timer" aria-label={label}>
      <p className="label text-paper/60">{label}</p>
      <div className="flex gap-2 sm:gap-3">
        {units.map((u) => (
          <div key={u.l} className="flex min-w-[64px] flex-col items-center rounded-2xl border border-[color:var(--gold)]/30 bg-paper/[0.04] px-3 py-3 backdrop-blur sm:min-w-[78px]">
            <span className="advent-digit advent-gold display text-3xl leading-none sm:text-4xl">{left === null ? "--" : String(u.v).padStart(2, "0")}</span>
            <span className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-paper/55">{u.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
