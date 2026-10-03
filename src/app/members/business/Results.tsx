import { Card, SectionLabel } from "@/components/members/MemberPage";
import { partnerStatsSummary, plural, type StatDay, type StatField } from "@/lib/partner-stats";

const DAYS = 30;

const METRICS: { field: StatField; label: string; explain: (n: number) => string }[] = [
  {
    field: "views",
    label: "Page views",
    explain: (n) =>
      n
        ? `Your partner page was opened ${plural(n, "time", "times")} by people browsing the partner directory.`
        : "Nobody has opened your partner page in this period yet. A complete page with a clear logo tends to draw more visits.",
  },
  {
    field: "websiteClicks",
    label: "Website visits",
    explain: (n) =>
      n
        ? `Visitors followed the link from your page to your website ${plural(n, "time", "times")}.`
        : "Nobody has followed the link to your website yet. Adding your website to your page makes this possible.",
  },
  {
    field: "perkViews",
    label: "Perk views",
    explain: (n) =>
      n
        ? `Your member perk was shown ${plural(n, "time", "times")} to signed-in members on the Member perks page.`
        : "Your perk has not been shown to members in this period. Add a perk to your page so members can see it.",
  },
  {
    field: "perkClaims",
    label: "Perk claims",
    explain: (n) =>
      n
        ? `Members chose Get this offer ${plural(n, "time", "times")} and went to your website to claim it.`
        : "No member has claimed your perk yet. A clear offer, such as a discount code, usually gets the most claims.",
  },
];

/** The brand's results for the last 30 days, with a small daily chart for each figure. */
export async function Results({ partnerId }: { partnerId: string }) {
  const { totals, series } = await partnerStatsSummary(partnerId, DAYS);
  const nothingYet = Object.values(totals).every((n) => n === 0);

  return (
    <section id="results" className="mb-10 scroll-mt-20">
      <SectionLabel>Your results over the last {DAYS} days</SectionLabel>
      <Card className="p-5 sm:p-6">
        <p className="text-[15px] leading-relaxed text-ink-2">
          {nothingYet
            ? "Your figures will appear here as soon as professionals start visiting your page and seeing your perk. We count real visits only, never search engines or your own team."
            : "These figures show how hair and scalp professionals have found and used your page and perk. We count real visits only, never search engines, the Trichollective team or your own visits while signed in."}
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
