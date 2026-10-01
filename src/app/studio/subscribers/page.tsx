import Link from "next/link";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Empty, PageHeader, Section, Stat, Tag, dateOnly } from "@/components/studio/ui";
import { studioPage } from "../_lib/guard";

export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  if (!(await studioPage("/studio/subscribers"))) return null;

  const [subscribers, bySource, total, unsubscribed] = await Promise.all([
    prisma.subscriber.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.subscriber.groupBy({
      by: ["source"],
      where: { unsubscribedAt: null },
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
    }),
    prisma.subscriber.count(),
    prisma.subscriber.count({ where: { unsubscribedAt: { not: null } } }),
  ]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Subscribers"
        intro="People who signed up for the newsletter or a free download on the website. They get the monthly newsletter along with active members."
        actions={
          <Button asChild variant="outline">
            <a href="/studio/subscribers/export" download>
              <Download /> Download CSV
            </a>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Subscribed" value={total - unsubscribed} />
        <Stat label="Unsubscribed" value={unsubscribed} />
      </div>

      <Section title="Where they came from">
        {bySource.length === 0 ? (
          <Empty>No sign-ups yet.</Empty>
        ) : (
          <div className="flex flex-wrap gap-2">
            {bySource.map((s) => (
              <span key={s.source} className="rounded-2xl border border-rule bg-card px-4 py-3 text-sm">
                <span className="text-muted-foreground">{s.source}</span>{" "}
                <span className="ml-1 font-semibold tabular-nums text-ink">{s._count._all}</span>
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Everyone" intro={total > subscribers.length ? `Showing the newest ${subscribers.length}. The CSV has everyone.` : undefined}>
        {subscribers.length === 0 ? (
          <Empty>
            No subscribers yet. They&apos;ll appear here when people sign up on the{" "}
            <Link href="/" className="underline underline-offset-4">
              website
            </Link>
            .
          </Empty>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-rule bg-card">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-rule">
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">UTM source</th>
                  <th className="px-4 py-3 font-medium">UTM campaign</th>
                  <th className="px-4 py-3 font-medium">Signed up</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.id} className="border-b border-rule last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{s.email}</td>
                    <td className="px-4 py-3">{s.source}</td>
                    <td className="px-4 py-3 text-ink-2">{s.utmSource ?? "–"}</td>
                    <td className="px-4 py-3 text-ink-2">{s.utmCampaign ?? "–"}</td>
                    <td className="px-4 py-3 text-ink-2">{dateOnly(s.createdAt)}</td>
                    <td className="px-4 py-3">
                      {s.unsubscribedAt ? <Tag>Unsubscribed</Tag> : <Tag tone="positive">Subscribed</Tag>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
