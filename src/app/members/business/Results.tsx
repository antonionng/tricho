import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Card, SectionLabel } from "@/components/members/MemberPage";
import { partnerStatsSummary, type StatDay, type StatField } from "@/lib/partner-stats";
import { RESULT_DAYS as DAYS, RESULT_METRICS as METRICS } from "./messages";

/** The brand's results for the last 30 days, with a small daily chart for each figure. */
export async function Results({ partnerId, published, hasPerk }: { partnerId: string; published: boolean; hasPerk: boolean }) {
  const { totals, series } = await partnerStatsSummary(partnerId, DAYS);
  const nothingYet = Object.values(totals).every((n) => n === 0);

  if (nothingYet) {
    return (
      <section id="results" className="mb-10 scroll-mt-20">
        <SectionLabel>Your results</SectionLabel>
        <Card className="flex gap-4 p-5 sm:p-6">
          <BarChart3 className="mt-0.5 h-6 w-6 shrink-0 stroke-[1.4] text-muted-foreground" aria-hidden />
          <div className="flex flex-col gap-2">
            <p className="text-[15px] font-medium leading-snug text-ink">
              {published
                ? "Your figures will appear here as soon as professionals start visiting your page."
                : "Your figures will appear here once your page is live and professionals start visiting it."}
            </p>
            <p className="text-sm leading-relaxed text-ink-2">
              We show page views, visits to your website, how often members see your perk and how often they claim it, for the last{" "}
              {DAYS} days. Each visit is added within moments, and we count real visits only, never search engines, the
              Trichollective team or your own visits while signed in.
            </p>
            {!hasPerk && (
              <p className="text-sm leading-relaxed text-ink-2">
                Perk views and claims start once you add a member perk, which you can do in{" "}
                <Link href="/members/business/setup?step=perk" className="underline underline-offset-4">
                  the perk step
                </Link>
                .
              </p>
            )}
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section id="results" className="mb-10 scroll-mt-20">
      <SectionLabel>Your results over the last {DAYS} days</SectionLabel>
      <Card className="p-5 sm:p-6">
        <p className="text-[15px] leading-relaxed text-ink-2">
          These figures show how hair and scalp professionals have found and used your page and perk. We count real visits only, never
          search engines, the Trichollective team or your own visits while signed in.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {METRICS.map((m) => (
            <li key={m.field} className="flex flex-col gap-2 rounded-xl border border-rule p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-ink">{m.label}</span>
                <span className="text-2xl font-semibold tabular-nums tracking-tight text-ink">{totals[m.field].toLocaleString("en-GB")}</span>
              </div>
              <Bars series={series} field={m.field} label={m.label} />
              <p className="text-xs leading-relaxed text-muted-foreground">{m.explain(totals[m.field])}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">Each bar is one day, with today on the right. Days are counted in UTC.</p>
      </Card>
    </section>
  );
}

function Bars({ series, field, label }: { series: StatDay[]; field: StatField; label: string }) {
  const max = Math.max(1, ...series.map((d) => d[field]));
  const w = 4;
  const gap = 2;
  const h = 32;
  const width = series.length * (w + gap) - gap;
  const best = series.reduce((a, b) => (b[field] > a[field] ? b : a), series[0]);
  const summary = best && best[field] > 0 ? `${label} by day. The busiest day was ${best.day}, with ${best[field]}.` : `${label} by day. There are none yet.`;
  return (
    <svg viewBox={`0 0 ${width} ${h}`} preserveAspectRatio="none" className="h-8 w-full" role="img" aria-label={summary}>
      {series.map((d, i) => {
        const v = d[field];
        const bh = v ? Math.max(2, (v / max) * h) : 1;
        return (
          <rect key={d.day} x={i * (w + gap)} y={h - bh} width={w} height={bh} rx={1} style={{ fill: v ? "var(--color-ink)" : "var(--color-rule)" }}>
            <title>{`${d.day}: ${v}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}
