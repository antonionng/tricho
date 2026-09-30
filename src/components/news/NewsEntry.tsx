import { ArrowUpRight, Lock } from "lucide-react";
import type { NewsItem } from "@/content/news";

const DISCIPLINE = { cosmetic: "Cosmetic", clinical: "Clinical", medical: "Medical" } as const;

export function newsDate(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m || 1) - 1, day || 1));
  return date.toLocaleDateString("en-GB", { ...(day ? { day: "numeric" } : {}), month: "long", year: "numeric", timeZone: "UTC" });
}

/** One news item. `showWhy` is for members; the public sees a prompt instead. */
export function NewsEntry({ item, showWhy, lockedHref }: { item: NewsItem; showWhy: boolean; lockedHref?: string }) {
  return (
    <article className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <time dateTime={item.date}>{newsDate(item.date)}</time>
        <span aria-hidden>·</span>
        <span>{item.disciplines.map((d) => DISCIPLINE[d]).join(" · ")}</span>
      </div>
      <h3 className="text-xl font-semibold leading-snug tracking-tight text-ink">{item.headline}</h3>
      <p className="text-[15px] leading-relaxed text-ink-2">{item.summary}</p>
      {showWhy ? (
        <p className="rounded-xl bg-paper-2 px-4 py-3 text-[14px] leading-relaxed text-ink-2">
          <span className="font-semibold text-ink">Why it matters: </span>
          {item.whyItMatters}
        </p>
      ) : (
        lockedHref && (
          <a href={lockedHref} className="inline-flex items-center gap-1.5 self-start rounded-full border border-rule px-3 py-1.5 text-[13px] text-ink-2 hover:border-ink/40">
            <Lock className="h-3 w-3" /> Why it matters for your practice: members
          </a>
        )
      )}
      <a
        href={item.url}
        target="_blank"
        rel="noopener nofollow"
        className="inline-flex items-center gap-1 self-start text-sm font-medium text-ink underline underline-offset-4 decoration-ink/30"
      >
        Source: {item.source} <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
    </article>
  );
}
