import { prisma } from "@/lib/prisma";

/**
 * Simple daily counts for each partner: views of their public page, clicks through
 * to their website, and how often members see and claim their perk. One row per
 * partner per day (UTC), incremented in place, with no personal data stored.
 */

export const STAT_FIELDS = ["views", "websiteClicks", "perkViews", "perkClaims"] as const;
export type StatField = (typeof STAT_FIELDS)[number];
export type StatCounts = Record<StatField, number>;
export type StatDay = StatCounts & { day: string };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight UTC on the day of this moment. */
export function utcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const BOT = /bot|crawl|spider|preview|slurp|facebookexternalhit|embedly|headless|lighthouse|monitor/i;

/** Crawlers, link previews and monitors, which should never count as a visit. */
export function isBot(userAgent: string | null | undefined) {
  if (!userAgent) return true;
  return BOT.test(userAgent);
}

/**
 * Whether a visit should count. Bots never count, and nor do visits from the
 * Trichollective team or from the brand looking at its own page.
 */
export function shouldCount(v: {
  userAgent: string | null | undefined;
  viewerEmail?: string | null;
  viewerIsStaff?: boolean;
  ownerEmail?: string | null;
}) {
  if (isBot(v.userAgent)) return false;
  if (v.viewerIsStaff) return false;
  if (v.viewerEmail && v.ownerEmail && v.viewerEmail.toLowerCase() === v.ownerEmail.toLowerCase()) return false;
  return true;
}

/** Adds one to today's count. Never throws: reporting must never break a page or a redirect. */
export async function recordPartnerStat(partnerId: string, field: StatField, by = 1) {
  return recordPartnerStats([partnerId], field, by);
}

/** Adds one to today's count for several partners at once, such as every perk shown on a page. */
export async function recordPartnerStats(partnerIds: string[], field: StatField, by = 1) {
  if (!STAT_FIELDS.includes(field) || by <= 0) return;
  const day = utcDay();
  const ids = [...new Set(partnerIds.filter(Boolean))].slice(0, 100);
  try {
    await Promise.all(
      ids.map((partnerId) =>
        prisma.partnerStat
          .upsert({
            where: { partnerId_day: { partnerId, day } },
            create: { partnerId, day, [field]: by },
            update: { [field]: { increment: by } },
          })
          .catch((err: unknown) => {
            // A race on the first view of the day can hit the unique index; one retry as an update settles it.
            return prisma.partnerStat
              .update({
                where: { partnerId_day: { partnerId, day } },
                data: { [field]: { increment: by } },
              })
              .catch(() => console.error("[partner-stats] could not record", field, err));
          })
      )
    );
  } catch (err) {
    console.error("[partner-stats] could not record", field, err);
  }
}

const zero = (): StatCounts => ({
  views: 0,
  websiteClicks: 0,
  perkViews: 0,
  perkClaims: 0,
});

/**
 * Turns stored rows into totals and a day-by-day series for the last `days` days,
 * oldest first, with a zero for every day that has no row.
 */
export function summariseStats(
  rows: ({ day: Date } & Partial<StatCounts>)[],
  days = 30,
  now = new Date()
): { totals: StatCounts; series: StatDay[]; from: Date; to: Date } {
  const to = utcDay(now);
  const from = new Date(to.getTime() - (days - 1) * DAY_MS);
  const byDay = new Map<string, StatDay>();
  for (let i = 0; i < days; i++) {
    const key = new Date(from.getTime() + i * DAY_MS).toISOString().slice(0, 10);
    byDay.set(key, { day: key, ...zero() });
  }
  const totals = zero();
  for (const r of rows) {
    const entry = byDay.get(utcDay(r.day).toISOString().slice(0, 10));
    if (!entry) continue;
    for (const f of STAT_FIELDS) {
      const n = r[f] ?? 0;
      entry[f] += n;
      totals[f] += n;
    }
  }
  return { totals, series: [...byDay.values()], from, to };
}

function since(days: number, now = new Date()) {
  return new Date(utcDay(now).getTime() - (days - 1) * DAY_MS);
}

/** One partner's totals and daily series. Returns empty figures if the database cannot be read. */
export async function partnerStatsSummary(partnerId: string, days = 30) {
  const rows = await prisma.partnerStat
    .findMany({
      where: { partnerId, day: { gte: since(days) } },
      orderBy: { day: "asc" },
    })
    .catch(() => []);
  return summariseStats(rows, days);
}

/** Totals for many partners at once, keyed by partner id, for lists in Studio. */
export async function partnerStatsTotals(partnerIds: string[], days = 30): Promise<Map<string, StatCounts>> {
  const out = new Map<string, StatCounts>();
  if (!partnerIds.length) return out;
  const rows = await prisma.partnerStat
    .groupBy({
      by: ["partnerId"],
      where: { partnerId: { in: partnerIds }, day: { gte: since(days) } },
      _sum: {
        views: true,
        websiteClicks: true,
        perkViews: true,
        perkClaims: true,
      },
    })
    .catch(() => []);
  for (const r of rows) {
    out.set(r.partnerId, {
      views: r._sum.views ?? 0,
      websiteClicks: r._sum.websiteClicks ?? 0,
      perkViews: r._sum.perkViews ?? 0,
      perkClaims: r._sum.perkClaims ?? 0,
    });
  }
  return out;
}

/** "1 view", "12 views": a count with the right word for the reports. */
export function plural(n: number, one: string, many: string) {
  return `${n.toLocaleString("en-GB")} ${n === 1 ? one : many}`;
}
