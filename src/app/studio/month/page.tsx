import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Circle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AGENTS } from "@/agents";
import { occurrencesInMonth } from "@/agents/cron";
import { Button } from "@/components/ui/button";
import { EVENT_KIND_LABEL } from "@/components/studio/labels";
import { Card, PageHeader, Section, Stat, NoAccess } from "@/components/studio/ui";
import { cn } from "@/lib/utils";
import { studioPage } from "../_lib/guard";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseMonth(m?: string) {
  const now = new Date();
  const match = m?.match(/^(\d{4})-(\d{2})$/);
  if (match) return { year: Number(match[1]), month: Number(match[2]) - 1 };
  return { year: now.getFullYear(), month: now.getMonth() };
}

function key(y: number, m: number) {
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function MonthPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  if (!(await studioPage("/studio/month", "inbox.view"))) return <NoAccess what="the monthly plan" />;
  const { m } = await searchParams;
  const { year, month } = parseMonth(m);
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const label = start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const today = new Date();
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month;

  const [created, published, events, pending] = await Promise.all([
    prisma.draft.findMany({ where: { createdAt: { gte: start, lt: end } }, select: { createdAt: true, status: true, kind: true } }),
    prisma.draft.findMany({
      where: { publishedAt: { gte: start, lt: end } },
      select: { publishedAt: true, kind: true, title: true },
    }),
    prisma.event.findMany({
      where: { startsAt: { gte: start, lt: end } },
      orderBy: { startsAt: "asc" },
      select: { id: true, title: true, kind: true, startsAt: true, published: true },
    }),
    prisma.draft.count({ where: { status: "draft", kind: { not: "event_prefill" } } }),
  ]);

  type DayInfo = { runs: string[]; created: number; published: number; events: typeof events };
  const days: DayInfo[] = Array.from({ length: daysInMonth }, () => ({ runs: [], created: 0, published: 0, events: [] }));
  for (const a of AGENTS) {
    for (const when of occurrencesInMonth(a.cron, year, month)) {
      days[when.getUTCDate() - 1]?.runs.push(a.name);
    }
  }
  for (const d of created) days[d.createdAt.getDate() - 1].created++;
  for (const d of published) if (d.publishedAt) days[d.publishedAt.getDate() - 1].published++;
  for (const e of events) days[e.startsAt.getDate() - 1].events.push(e);

  const publishedEvents = events.filter((e) => e.published);
  const checklist = [
    {
      done: published.some((d) => d.kind === "gazette_article"),
      label: "Trichozette edition is published",
      help: "Approve this month's Trichozette pieces in the inbox.",
      href: "/studio/inbox?agent=gazette",
    },
    {
      done: published.some((d) => d.kind === "newsletter"),
      label: "The newsletter has gone out",
      help: "The newsletter is drafted on the 25th. Approve it in the inbox to send it.",
      href: "/studio/inbox?agent=newsletter",
    },
    {
      done: publishedEvents.length > 0,
      label: "At least one event is on",
      help: "Add a gathering, case round or chapter meet-up and publish it.",
      href: "/studio/events?new=1",
    },
    {
      done: publishedEvents.some((e) => e.kind === "masterclass"),
      label: "The monthly masterclass is scheduled",
      help: "Members are promised a live masterclass each month.",
      href: "/studio/events?new=1",
    },
  ];
  const covered = checklist.filter((c) => c.done).length;

  // Monday-first grid padding
  const lead = (start.getDay() + 6) % 7;

  return (
    <div className="space-y-10">
      <PageHeader
        title={label}
        intro="What the agents will do this month, what's been drafted and published, and what's on."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/studio/month?m=${key(year, month - 1)}`}>
                <ChevronLeft /> Previous
              </Link>
            </Button>
            {!isThisMonth && (
              <Button asChild variant="outline" size="sm">
                <Link href="/studio/month">This month</Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href={`/studio/month?m=${key(year, month + 1)}`}>
                Next <ChevronRight />
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Section title="Is the month covered?" intro={`${covered} of ${checklist.length} done.`} className="lg:order-2">
          <ul className="space-y-2">
            {checklist.map((c) => (
              <li key={c.label}>
                <Card className={cn("flex gap-3 p-4", c.done && "bg-positive/5 border-positive/30")}>
                  {c.done ? (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-positive" aria-label="Done" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-mute" aria-label="Not yet" />
                  )}
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-ink">{c.label}</p>
                    {!c.done && (
                      <p className="text-muted-foreground">
                        {c.help}{" "}
                        <Link href={c.href} className="text-ink underline underline-offset-4">
                          Sort it
                        </Link>
                      </p>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Drafted" value={created.length} />
            <Stat label="Published" value={published.length} />
            <Stat label="Waiting" value={pending} />
          </div>
        </Section>

        <Section title="Calendar" intro="Agents run early in the morning, UK time.">
          <div className="grid grid-cols-7 gap-1 text-xs">
            {WEEKDAYS.map((d) => (
              <div key={d} className="label px-1 pb-1 text-muted-foreground">
                {d}
              </div>
            ))}
            {Array.from({ length: lead }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((info, i) => {
              const isToday = isThisMonth && today.getDate() === i + 1;
              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-24 rounded-xl border bg-card p-1.5 sm:min-h-28 sm:p-2",
                    isToday ? "border-ink" : "border-rule"
                  )}
                >
                  <p className={cn("text-sm font-semibold tabular-nums", isToday ? "text-ink" : "text-ink-2")}>{i + 1}</p>
                  <div className="mt-1 space-y-1">
                    {info.events.map((e) => (
                      <Link
                        key={e.id}
                        href={`/studio/events?edit=${e.id}`}
                        title={e.title}
                        className={cn(
                          "block truncate rounded-md px-1.5 py-0.5",
                          e.published ? "bg-ink text-paper" : "border border-dashed border-ink/40 text-ink"
                        )}
                      >
                        {EVENT_KIND_LABEL[e.kind] ?? "Event"}
                      </Link>
                    ))}
                    {info.runs.length > 0 && (
                      <p className="truncate rounded-md bg-paper-2 px-1.5 py-0.5 text-ink-2" title={info.runs.join(", ")}>
                        {info.runs.length === 1 ? info.runs[0] : `${info.runs.length} agents`}
                      </p>
                    )}
                    {(info.created > 0 || info.published > 0) && (
                      <p className="hidden text-muted-foreground sm:block">
                        {info.created > 0 && `${info.created} drafted`}
                        {info.created > 0 && info.published > 0 && " · "}
                        {info.published > 0 && `${info.published} out`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-ink" /> Published event
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-dashed border-ink/40" /> Unpublished event
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-paper-2" /> Agent run
            </span>
          </div>
        </Section>
      </div>
    </div>
  );
}
