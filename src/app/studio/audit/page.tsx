import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Empty, NoAccess, PageHeader, Tag, dateTime, fieldClass } from "@/components/studio/ui";
import { Button } from "@/components/ui/button";
import { studioPage } from "../_lib/guard";

export const dynamic = "force-dynamic";

const PAGE = 50;

const AREAS: { id: string; label: string }[] = [
  { id: "", label: "Everything" },
  { id: "staff.", label: "Team" },
  { id: "member.", label: "Members" },
  { id: "referral.", label: "Referrals" },
  { id: "post.", label: "Community posts" },
  { id: "report.", label: "Reports" },
  { id: "room.", label: "Rooms" },
  { id: "event.", label: "Events" },
  { id: "gazette.", label: "Trichozette" },
  { id: "podcast.", label: "Podcast" },
  { id: "draft.", label: "Inbox" },
  { id: "listing.", label: "Listings" },
  { id: "partner.", label: "Partners" },
  { id: "agent.", label: "Agents" },
];

type Search = { area?: string; actor?: string; target?: string; before?: string };

export default async function AuditPage({ searchParams }: { searchParams: Promise<Search> }) {
  if (!(await studioPage("/studio/audit", "audit.view"))) return <NoAccess what="the audit log" />;
  const sp = await searchParams;
  const area = AREAS.some((a) => a.id === sp.area) ? sp.area! : "";
  const before = sp.before ? new Date(sp.before) : null;

  const where: Prisma.AuditLogWhereInput = {
    ...(area ? { action: { startsWith: area } } : {}),
    ...(sp.actor ? { actorEmail: { contains: sp.actor, mode: "insensitive" } } : {}),
    ...(sp.target ? { targetId: sp.target } : {}),
    ...(before && !Number.isNaN(before.getTime()) ? { createdAt: { lt: before } } : {}),
  };
  const rows = await prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE + 1 });
  const more = rows.length > PAGE;
  const shown = rows.slice(0, PAGE);

  const link = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { area, actor: sp.actor, target: sp.target, ...extra };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return p.toString() ? `/studio/audit?${p}` : "/studio/audit";
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit log"
        intro="A record of every change made in Studio: who made it, when, and what it was before and after."
      />

      <div className="flex flex-wrap items-center gap-2">
        {AREAS.map((a) => (
          <Link
            key={a.id || "all"}
            href={link({ area: a.id || undefined, before: undefined })}
            className={`rounded-full px-3 py-1.5 text-sm ${a.id === area ? "bg-ink text-paper" : "bg-paper-2 text-ink-2"}`}
          >
            {a.label}
          </Link>
        ))}
        <form action="/studio/audit" className="ml-auto flex gap-2">
          {area && <input type="hidden" name="area" value={area} />}
          <input name="actor" defaultValue={sp.actor} placeholder="Filter by team member's email" className={`${fieldClass} w-64 py-1.5`} />
          <Button type="submit" size="sm" variant="outline">
            Filter
          </Button>
        </form>
      </div>

      {sp.target && (
        <p className="text-sm text-ink-2">
          Showing changes to one record. <Link href={link({ target: undefined })} className="underline">Show everything</Link>
        </p>
      )}

      {shown.length === 0 ? (
        <Empty>Nothing has been recorded here yet. Changes appear as soon as someone on the team makes them.</Empty>
      ) : (
        <ol className="divide-y divide-rule rounded-2xl border border-rule bg-card">
          {shown.map((r) => (
            <li key={r.id} className="space-y-1 px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm text-ink">{r.summary ?? r.action}</p>
                <span className="text-xs text-muted-foreground tabular-nums">{dateTime(r.createdAt)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{r.actorEmail}</span>
                <Tag>{r.action}</Tag>
                {r.targetId && (
                  <Link href={link({ target: r.targetId, before: undefined })} className="underline underline-offset-2">
                    History of this {r.targetType}
                  </Link>
                )}
              </div>
              {(r.before !== null || r.after !== null) && (
                <details className="pt-1">
                  <summary className="cursor-pointer text-xs text-ink-2">Before and after</summary>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <pre className="max-h-64 overflow-auto rounded-xl bg-paper-2 p-3 text-xs">{JSON.stringify(r.before, null, 2) ?? "–"}</pre>
                    <pre className="max-h-64 overflow-auto rounded-xl bg-paper-2 p-3 text-xs">{JSON.stringify(r.after, null, 2) ?? "–"}</pre>
                  </div>
                </details>
              )}
            </li>
          ))}
        </ol>
      )}

      {more && (
        <Button asChild variant="outline">
          <Link href={link({ before: shown[shown.length - 1].createdAt.toISOString() })}>Show older changes</Link>
        </Button>
      )}
    </div>
  );
}
