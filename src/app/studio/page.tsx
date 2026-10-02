import Link from "next/link";
import { getOverview } from "@/lib/overview";
import { kindLabel } from "@/components/studio/labels";
import { Card, Empty, NoAccess, PageHeader, Section, Stat, Tag, dateTime } from "@/components/studio/ui";
import { STAFF_ROLE_PHRASE } from "@/config/staff";
import { studioPage } from "./_lib/guard";

export const dynamic = "force-dynamic";

function greeting(now = new Date()) {
  const hour = Number(now.toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: "Europe/London" }));
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

export default async function OverviewPage() {
  const staff = await studioPage("/studio", "overview.view");
  if (!staff) return <NoAccess what="the overview" />;
  const o = await getOverview();
  const has = (p: Parameters<typeof staff.perms.has>[0]) => staff.perms.has(p);
  const waiting = o.drafts.reduce((n, d) => n + d.count, 0);
  const first = (staff.name ?? staff.email).split(/[ @]/)[0];

  return (
    <div className="space-y-10">
      <PageHeader
        title={`${greeting()}, ${first}.`}
        intro={`Here is how Trichollective is doing today. You are signed in as ${STAFF_ROLE_PHRASE[staff.role]}.`}
      />

      {has("members.view") && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat label="Active members" value={o.members.active} note={`${o.members.accounts} accounts in total`} />
          <Stat label="Joined, last 30 days" value={o.members.joined30} />
          <Stat label="Lapsed, last 30 days" value={o.members.lapsed30} note="Memberships that ended and weren't renewed" />
          {staff.role === "owner" && <Stat label="Monthly income" value={`£${o.members.mrr.toLocaleString("en-GB")}`} />}
          {has("subscribers.view") && <Stat label="Newsletter readers" value={o.subscribers} note={`${o.subscribers30} new in 30 days`} />}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {has("inbox.view") && (
          <Section title="Waiting for a decision" actions={<Link href="/studio/inbox" className="text-sm underline underline-offset-4">Open the inbox</Link>}>
            {waiting === 0 ? (
              <Empty>The inbox is clear. New drafts from the agents will appear here.</Empty>
            ) : (
              <Card>
                <ul className="divide-y divide-rule text-sm">
                  {o.drafts.map((d) => (
                    <li key={d.kind} className="flex justify-between py-2">
                      <span className="text-ink">{kindLabel(d.kind)}</span>
                      <span className="tabular-nums text-ink-2">{d.count}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </Section>
        )}

        {has("community.view") && (
          <Section title="Community" actions={<Link href="/studio/community" className="text-sm underline underline-offset-4">Moderation queue</Link>}>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Open reports" value={o.openReports} />
              <Stat label="Posts, 30 days" value={o.posts30} />
              <Stat label="Replies, 30 days" value={o.comments30} />
            </div>
          </Section>
        )}

        {has("events.view") && (
          <Section title="Coming up" actions={<Link href="/studio/events" className="text-sm underline underline-offset-4">All events</Link>}>
            {o.events.length === 0 ? (
              <Empty>No events are scheduled. Describe the next one in a sentence on the Events page and the form fills itself in.</Empty>
            ) : (
              <Card>
                <ul className="divide-y divide-rule text-sm">
                  {o.events.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="text-ink">
                        {e.title} {!e.published && <Tag tone="warn">Draft</Tag>}
                        <span className="block text-xs text-muted-foreground">{dateTime(e.startsAt)}</span>
                      </span>
                      <span className="tabular-nums text-ink-2">
                        {e._count.rsvps}
                        {e.capacity ? ` of ${e.capacity}` : ""} going
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </Section>
        )}

        {(has("gazette.view") || has("podcast.view")) && (
          <Section title="Publishing">
            <div className="grid grid-cols-2 gap-3">
              {has("gazette.view") && (
                <Link href="/studio/gazette">
                  <Stat
                    label="Trichozette"
                    value={o.editions.published ?? 0}
                    note={`${(o.editions.draft ?? 0) + (o.editions.generating ?? 0)} in progress, ${o.editions.scheduled ?? 0} scheduled`}
                  />
                </Link>
              )}
              {has("podcast.view") && (
                <Link href="/studio/podcast">
                  <Stat
                    label="Podcast episodes"
                    value={o.episodes.published ?? 0}
                    note={`${(o.episodes.planning ?? 0) + (o.episodes.draft ?? 0)} being prepared`}
                  />
                </Link>
              )}
            </div>
          </Section>
        )}
      </div>

      {has("audit.view") && (
        <Section title="Recent changes" actions={<Link href="/studio/audit" className="text-sm underline underline-offset-4">Full audit log</Link>}>
          {o.recent.length === 0 ? (
            <Empty>Changes made in Studio will be listed here.</Empty>
          ) : (
            <Card>
              <ul className="divide-y divide-rule text-sm">
                {o.recent.map((r) => (
                  <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <span className="text-ink">{r.summary ?? r.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.actorEmail} · {dateTime(r.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </Section>
      )}
    </div>
  );
}
