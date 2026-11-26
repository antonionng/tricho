import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Empty, PageHeader, Section, Stat, Tag, NoAccess } from "@/components/studio/ui";
import { ADVENT_DOORS } from "@/content/advent";
import { doorDateLabel, isClaimable, openDoorCount } from "@/lib/advent";
import { studioPage } from "../_lib/guard";

export const dynamic = "force-dynamic";
export const metadata = { title: "12 Days of Christmas" };

const pct = (n: number, of: number) => (of > 0 ? `${Math.round((n / of) * 100)}%` : "–");

export default async function StudioChristmasPage() {
  if (!(await studioPage("/studio/christmas", "partners.view"))) return <NoAccess what="the Christmas calendar" />;

  const [stats, claims, emails] = await Promise.all([
    prisma.adventStat.groupBy({ by: ["door"], _sum: { opens: true, claims: true, clicks: true } }),
    prisma.adventClaim.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.emailLog.groupBy({ by: ["ref"], where: { ref: { startsWith: "advent-2026:" } }, _count: { _all: true } }).catch(() => []),
  ]);
  const byDoor = new Map(stats.map((s) => [s.door, s._sum]));
  const claimants = new Map<number, typeof claims>();
  for (const c of claims) claimants.set(c.door, [...(claimants.get(c.door) ?? []), c]);
  const sentByDoor = new Map<number, number>();
  for (const e of emails) {
    const m = /^advent-2026:door-(\d+):/.exec(e.ref);
    if (m) sentByDoor.set(Number(m[1]), (sentByDoor.get(Number(m[1])) ?? 0) + e._count._all);
  }

  const total = (k: "opens" | "claims" | "clicks") => stats.reduce((n, s) => n + (s._sum[k] ?? 0), 0);
  const openCount = openDoorCount();

  return (
    <div className="space-y-10">
      <PageHeader
        title="12 Days of Christmas"
        intro={
          <>
            One door a day from {doorDateLabel(1, "long")} to {doorDateLabel(ADVENT_DOORS.length, "long")}. Counts leave out the team and
            bots. Preview any day with{" "}
            <Link href="/christmas?day=12" className="underline underline-offset-4">
              /christmas?day=12
            </Link>
            .
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Doors open" value={`${openCount} of ${ADVENT_DOORS.length}`} />
        <Stat label="Door opens" value={total("opens")} />
        <Stat label="Gifts claimed" value={claims.length} note={`by ${new Set(claims.map((c) => c.userId)).size} ${new Set(claims.map((c) => c.userId)).size === 1 ? "person" : "people"}`} />
        <Stat label="Clicks through" value={total("clicks")} />
      </div>

      <Section title="Each door" intro="Opens are doors opened on the calendar, claims are people who revealed the code, and clicks are presses of the door's button.">
        <div className="overflow-x-auto rounded-2xl border border-rule bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-rule text-[13px] text-muted-foreground">
              <tr>
                {["Door", "Date", "What", "Emails sent", "Opens", "Claims", "Claim rate", "Clicks"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ADVENT_DOORS.map((d) => {
                const s = byDoor.get(d.day);
                const opens = s?.opens ?? 0;
                const claimed = claimants.get(d.day)?.length ?? 0;
                return (
                  <tr key={d.day} className="border-b border-rule last:border-0">
                    <td className="px-4 py-3 font-semibold tabular-nums">{d.day}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-2">{doorDateLabel(d.day)}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{d.brand?.name ?? "Trichollective"}</span>
                      <span className="text-ink-2">: {d.headline}</span>{" "}
                      {d.reserved && <Tag tone="warn">Held for a brand</Tag>}
                      {d.kind === "brand" && <Tag tone="ink">Partner offer</Tag>}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{sentByDoor.get(d.day) ?? 0}</td>
                    <td className="px-4 py-3 tabular-nums">{opens}</td>
                    <td className="px-4 py-3 tabular-nums">{isClaimable(d) ? claimed : "–"}</td>
                    <td className="px-4 py-3 tabular-nums">{isClaimable(d) ? pct(claimed, opens) : "–"}</td>
                    <td className="px-4 py-3 tabular-nums">{s?.clicks ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Who claimed" intro="The latest 500 claims, newest first. Share the count with a brand, not the names.">
        {claims.length === 0 ? (
          <Empty>Nobody has claimed a gift yet. Claims appear here the moment someone presses Claim on a door.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card text-sm">
            {claims.map((c) => {
              const d = ADVENT_DOORS.find((x) => x.day === c.door);
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
                  <span className="font-medium">{c.email}</span>
                  <span className="text-ink-2">
                    Door {c.door}, {d?.brand?.name ?? "Trichollective"}
                  </span>
                  <span className="text-muted-foreground">
                    {c.source ? `from ${c.source} · ` : ""}
                    {c.createdAt.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
