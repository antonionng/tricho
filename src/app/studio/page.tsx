import Link from "next/link";
import { getOverview, getToday } from "@/lib/overview";
import { FOUNDING_MEMBER_PLACES } from "@/config/subscriptions";
import { countNeedingAttention } from "@/lib/retention-data";
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
  const has = (p: Parameters<typeof staff.perms.has>[0]) => staff.perms.has(p);
  const [o, attention, today] = await Promise.all([
    getOverview(),
    has("retention.view") ? countNeedingAttention() : 0,
    getToday(),
  ]);
  const signedUp = (
    <Stat
      label="Signed up today"
      value={today.signups.total}
      note={`${today.signups.paid} paid and ${today.signups.free} free ${today.signups.free === 1 ? "account" : "accounts"}.`}
    />
  );
  const waiting = o.drafts.reduce((n, d) => n + d.count, 0);
  const first = (staff.name ?? staff.email).split(/[ @]/)[0];

  return (
    <div className="space-y-10">
      <PageHeader
        title={`${greeting()}, ${first}.`}
        intro={`Here is how Trichollective is doing today. You are signed in as ${STAFF_ROLE_PHRASE[staff.role]}.`}
      />

      <Section title="Today" intro="Sign-ups are counted from midnight, Irish and UK time.">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            {has("members.view") ? (
              <Link href="/studio/members?joined=today" className="block h-full">
                {signedUp}
              </Link>
            ) : (
              signedUp
            )}
          </div>
          <Stat
            label="Ireland sign-ups"
            value={today.irelandTotal}
            note="All accounts created from the Trichollective Ireland links and QR codes."
          />
          <Stat
            label="Founding places left"
            value={today.foundingPlacesLeft}
            note={`Out of ${FOUNDING_MEMBER_PLACES} founding member places at the founding price.`}
          />
          {has("inbox.view") && (
            <Link href="/studio/inbox">
              <Stat label="Waiting in the inbox" value={waiting} note="Drafts that need a decision before anything goes out." />
            </Link>
          )}
          {has("community.view") && (
            <Link href="/studio/community">
              <Stat label="Open reports" value={o.openReports} note="Community reports that nobody has resolved yet." />
            </Link>
          )}
        </div>
        {today.signups.total > 0 ? (
          <Card className="p-4">
            <p className="mb-2 text-[13px] font-medium text-muted-foreground">Where today&apos;s sign-ups came from</p>
            <ul className="flex flex-wrap gap-2 text-sm">
              {today.signups.sources.map((src) => (
                <li key={src.key} className="rounded-full border border-rule bg-paper-2 px-3 py-1 text-ink">
                  {src.label} <span className="tabular-nums text-ink-2">{src.total}</span>{" "}
                  <span className="text-xs text-muted-foreground">
                    ({src.paid} paid, {src.free} free)
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Empty>Nobody has signed up yet today, and each new account will be counted here with where it came from.</Empty>
        )}
      </Section>

      {has("members.view") && (
        <Section title="The last 30 days">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Stat label="Active members" value={o.members.active} note={`${o.members.accounts} accounts in total`} />
            <Stat label="Joined" value={o.members.joined30} note="Last 30 days" />
            <Stat label="Lapsed" value={o.members.lapsed30} note="Memberships that ended in the last 30 days and weren't renewed" />
            {staff.role === "owner" && <Stat label="Monthly income" value={`£${o.members.mrr.toLocaleString("en-GB")}`} />}
            {has("subscribers.view") && <Stat label="Newsletter readers" value={o.subscribers} note={`${o.subscribers30} new in 30 days`} />}
            {has("retention.view") && (
              <Link href="/studio/retention">
                <Stat label="Members needing attention" value={attention} note="These members are cancelling, have a failed payment, have lapsed, have not set up or have gone quiet." />
              </Link>
            )}
          </div>
        </Section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {has("inbox.view") && (
          <Section title="Waiting for a decision" actions={<Link href="/studio/inbox" className="text-sm underline underline-offset-4">Open the inbox</Link>}>
            {waiting === 0 ? (
              <Empty>Nothing is waiting for a decision, and new drafts from the agents will appear here.</Empty>
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
              <Stat label="New posts" value={o.posts30} note="Last 30 days" />
              <Stat label="New replies" value={o.comments30} note="Last 30 days" />
            </div>
          </Section>
        )}

        {has("events.view") && (
          <Section title="Coming up" actions={<Link href="/studio/events" className="text-sm underline underline-offset-4">All events</Link>}>
            {o.events.length === 0 ? (
              <Empty>No events are scheduled yet, and you can describe the next one in a sentence on the Events page to fill in the form.</Empty>
            ) : (
              <Card>
                <ul className="divide-y divide-rule text-sm">
                  {o.events.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="text-ink">
                        {e.title} {!e.published && <Tag tone="warn">Draft</Tag>}
                        <span className="block text-xs text-muted-foreground">{dateTime(e.startsAt)}</span>
                      </span>
                      <span className="shrink-0 whitespace-nowrap tabular-nums text-ink-2">
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
