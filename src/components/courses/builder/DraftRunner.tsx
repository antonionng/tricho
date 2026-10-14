"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Keeps an AI draft going while the page is open. Each request writes for a
 * few minutes and returns; this asks again until the draft is done, and
 * refreshes the page so the progress shows. Closing the page simply pauses it.
 */
export function DraftRunner({ runId, step, total }: { runId: string; step: number; total: number }) {
  const router = useRouter();
  const busy = useRef(false);

  useEffect(() => {
    let stopped = false;
    async function tick() {
      if (busy.current || stopped) return;
      busy.current = true;
      try {
        const res = await fetch(`/api/courses/draft/${runId}`, { method: "POST" });
        const body = (await res.json().catch(() => null)) as { status?: string } | null;
        router.refresh();
        if (body?.status && body.status !== "running") stopped = true;
      } catch {
        // The request can time out while the work carries on; the next tick picks it up.
      } finally {
        busy.current = false;
      }
    }
    tick();
    const poll = setInterval(tick, 5000);
    const refresh = setInterval(() => router.refresh(), 5000);
    return () => {
      stopped = true;
      clearInterval(poll);
      clearInterval(refresh);
    };
  }, [runId, router]);

  const lessons = Math.max(0, total - 2);
  const label =
    total === 0 || step === 0
      ? "Reading your material and planning the lessons."
      : step - 1 < lessons
        ? `Writing lesson ${step} of ${lessons}.`
        : "Writing the final assessment.";
  return (
    <div role="status" className="mb-6 flex items-center gap-3 rounded-2xl border border-rule bg-paper-2 px-5 py-4 text-[15px]">
      <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
      <span>
        <strong>Your AI draft is being written.</strong> {label} Lessons appear in the builder as each one is finished. You can leave this page and come back.
      </span>
    </div>
  );
}
