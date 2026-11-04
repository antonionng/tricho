"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Starts the Educator membership checkout, or sends a signed-out visitor to sign in first. */
export function JoinEducatorButton({ label = "Become an Educator", className }: { label?: string; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function join() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/educators/checkout", { method: "POST" });
      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent("/educators#join")}`;
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) throw new Error(body.error || "We could not start the payment. Please try again in a moment.");
      window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }
  return (
    <div className={className}>
      <Button type="button" size="lg" onClick={join} disabled={busy} aria-busy={busy}>
        {busy ? "Just a moment…" : label} {!busy && <ArrowRight />}
      </Button>
      {error && <p className="mt-2 text-[14px] text-destructive">{error}</p>}
    </div>
  );
}
