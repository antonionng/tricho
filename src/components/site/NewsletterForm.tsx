"use client";

import { useActionState, useEffect, useRef } from "react";
import { ArrowRight, Check } from "lucide-react";
import { subscribe, type SubscribeState } from "@/lib/actions/subscribe";
import { getSource } from "@/lib/source";
import { cn } from "@/lib/utils";

export function NewsletterForm({
  source = "footer",
  cta = "Subscribe",
  tone = "paper",
  className,
}: {
  source?: string;
  cta?: string;
  tone?: "paper" | "ink";
  className?: string;
}) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, null);
  const utmSource = useRef<HTMLInputElement>(null);
  const utmCampaign = useRef<HTMLInputElement>(null);

  // Attribution from the landing URL (e.g. posts in the Facebook group).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (utmSource.current) utmSource.current.value = p.get("utm_source") ?? getSource() ?? "";
    if (utmCampaign.current) utmCampaign.current.value = p.get("utm_campaign") ?? "";
  }, []);

  if (state?.ok) {
    return (
      <p className={cn("flex items-center gap-2 text-[15px]", className)} role="status">
        <Check className="h-4 w-4" /> {state.message}
      </p>
    );
  }

  return (
    <form action={action} className={cn("w-full", className)}>
      <input type="hidden" name="source" value={source} />
      <input ref={utmSource} type="hidden" name="utm_source" defaultValue="" />
      <input ref={utmCampaign} type="hidden" name="utm_campaign" defaultValue="" />
      <div
        className={cn(
          "flex items-center rounded-full border p-1.5 pl-5 transition-colors focus-within:border-current",
          tone === "paper" ? "border-ink/20 bg-card" : "border-paper/25 bg-white/5"
        )}
      >
        <label htmlFor={`email-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`email-${source}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          className="w-0 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-current placeholder:opacity-50"
        />
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-opacity disabled:opacity-60",
            tone === "paper" ? "bg-ink text-paper" : "bg-paper text-ink"
          )}
        >
          {pending ? "Adding…" : cta}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      {state && !state.ok && <p className="mt-2 text-sm text-destructive">{state.message}</p>}
    </form>
  );
}
