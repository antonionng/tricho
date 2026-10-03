"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Starts generation when the edition is waiting to be written, then refreshes
 * the editor every few seconds so each page appears as soon as it is saved.
 */
export function GenerationRunner({ id, generating, written, total }: { id: string; generating: boolean; written: number; total: number }) {
  const router = useRouter();
  const started = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!generating || started.current) return;
    started.current = true;
    fetch(`/studio/gazette/${id}/generate`, { method: "POST" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
        setMessage(body?.message ?? (res.ok ? "Generation finished." : "Generation stopped. Try again in a moment."));
        setFailed(!res.ok);
      })
      .catch(() => {
        // The request can time out while the work carries on, so keep refreshing.
        setMessage("The connection dropped. The editor will keep checking for new pages.");
      })
      .finally(() => {
        started.current = false;
        router.refresh();
      });
  }, [generating, id, router]);

  useEffect(() => {
    if (!generating) return;
    const timer = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(timer);
  }, [generating, router]);

  if (generating) {
    return (
      <div role="status" className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <Loader2 className="h-4 w-4 animate-spin" />
        {total > 0
          ? `Writing the pages: ${written} of ${total} are done. You can stay on this page or come back later.`
          : "Writing the outline. The planned pages will appear here in a minute or so."}
      </div>
    );
  }
  if (!message) return null;
  return (
    <div
      role="status"
      className={
        failed
          ? "rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          : "rounded-2xl border border-positive/30 bg-positive/5 px-4 py-3 text-sm text-positive"
      }
    >
      {message}
    </div>
  );
}
