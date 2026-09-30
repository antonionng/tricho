import Link from "next/link";
import { Plus } from "lucide-react";
import type { Event } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { EVENT_KIND_LABEL } from "@/components/studio/labels";
import { Empty, Field, Notice, PageHeader, Section, Tag, dateTime, fieldClass } from "@/components/studio/ui";
import { cn } from "@/lib/utils";
import { studioPage } from "../_lib/guard";
import { saveEventAction } from "../actions";

export const dynamic = "force-dynamic";

/** A date as the London wall-clock value a datetime-local input expects. */
function londonInput(d: Date | null | undefined) {
  if (!d) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; new?: string; notice?: string; tone?: string }>;
}) {
  if (!(await studioPage("/studio/events"))) return null;
  const sp = await searchParams;
  const now = new Date();

  const [events, editing] = await Promise.all([
    prisma.event.findMany({
      orderBy: { startsAt: "desc" },
      take: 60,
      include: { _count: { select: { rsvps: true } } },
    }),
    sp.edit ? prisma.event.findUnique({ where: { id: sp.edit } }) : null,
  ]);
  const showForm = !!editing || sp.new === "1";
  const upcoming = events.filter((e) => e.startsAt >= now).reverse();
  const past = events.filter((e) => e.startsAt < now);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Events"
        intro="Gatherings, masterclasses, case rounds and chapter meet-ups. Events only appear to members and on the website once you tick Published."
        actions={
          !showForm && (
            <Button asChild>
              <Link href="/studio/events?new=1">
                <Plus /> New event
              </Link>
            </Button>
          )
        }
      />

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      {showForm && <EventForm event={editing} />}

      <Section title="Coming up">
        <EventList events={upcoming} empty="Nothing coming up. Add an event so members have something to look forward to." />
      </Section>
      {past.length > 0 && (
        <Section title="Past events">
          <EventList events={past} empty="" />
        </Section>
      )}
    </div>
  );
}

function EventList({ events, empty }: { events: (Event & { _count: { rsvps: number } })[]; empty: string }) {
  if (!events.length) return <Empty>{empty}</Empty>;
  return (
    <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
      {events.map((e) => (
        <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium text-ink">{e.title}</p>
            <p className="text-xs text-muted-foreground">
              {EVENT_KIND_LABEL[e.kind]} · {dateTime(e.startsAt)} · {e.online ? "Online" : [e.venue, e.city].filter(Boolean).join(", ") || "Place to be confirmed"} ·{" "}
              {e.memberPriceGBP === 0 ? "Free for members" : `£${e.memberPriceGBP} members`}
              {e.priceGBP > 0 && `, £${e.priceGBP} guests`}
              {e.ticketUrl && (
                <>
                  {" · "}
                  <a href={e.ticketUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    Tickets
                  </a>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tag>
              {e._count.rsvps} going{e.capacity ? ` of ${e.capacity}` : ""}
            </Tag>
            {e.published ? <Tag tone="positive">Published</Tag> : <Tag tone="warn">Not published</Tag>}
            <Button asChild size="xs" variant="outline">
              <Link href={`/studio/events?edit=${e.id}`}>Edit</Link>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function EventForm({ event }: { event: Event | null }) {
  return (
    <form action={saveEventAction} className="space-y-5 rounded-3xl border border-rule bg-card p-5 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-ink">{event ? "Edit event" : "New event"}</h2>
        <Link href="/studio/events" className="text-sm text-ink-2 underline underline-offset-4">
          Cancel
        </Link>
      </div>
      {event && <input type="hidden" name="id" value={event.id} />}

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field label="Title" hint={event ? `Web address: /events/${event.slug}` : "The web address is made from the title."}>
          <input name="title" defaultValue={event?.title} required className={fieldClass} />
        </Field>
        <Field label="Type">
          <select name="kind" defaultValue={event?.kind ?? "gathering"} className={fieldClass}>
            {Object.entries(EVENT_KIND_LABEL).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Short summary" hint="One or two sentences. Shown on event cards.">
        <textarea name="summary" defaultValue={event?.summary} required rows={2} className={fieldClass} />
      </Field>
      <Field label="Full description" hint="Optional. Leave a blank line between paragraphs.">
        <textarea name="body" defaultValue={event?.body ?? ""} rows={6} className={fieldClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" hint="UK time.">
          <input type="datetime-local" name="startsAt" defaultValue={londonInput(event?.startsAt)} required className={fieldClass} />
        </Field>
        <Field label="Ends" hint="Optional.">
          <input type="datetime-local" name="endsAt" defaultValue={londonInput(event?.endsAt)} className={fieldClass} />
        </Field>
      </div>

      <fieldset className="space-y-3 rounded-2xl border border-rule p-4">
        <legend className="px-1 text-sm font-medium text-ink">Where</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="online" defaultChecked={event?.online ?? false} className="h-4 w-4 accent-ink" />
          It&apos;s online
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" hint="Leave blank for online events.">
            <input name="city" defaultValue={event?.city ?? ""} className={fieldClass} />
          </Field>
          <Field label="Venue">
            <input name="venue" defaultValue={event?.venue ?? ""} className={fieldClass} />
          </Field>
        </div>
      </fieldset>

      <Field label="Ticket link" hint="Optional. For example an Eventbrite page. Shown on the event and in Trichozette and newsletter.">
        <input type="url" name="ticketUrl" defaultValue={event?.ticketUrl ?? ""} placeholder="https://www.eventbrite.co.uk/e/…" className={fieldClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Guest price (£)">
          <input type="number" min={0} step={1} name="priceGBP" defaultValue={event?.priceGBP ?? 0} className={fieldClass} />
        </Field>
        <Field label="Member price (£)" hint="0 means free for members.">
          <input type="number" min={0} step={1} name="memberPriceGBP" defaultValue={event?.memberPriceGBP ?? 0} className={fieldClass} />
        </Field>
        <Field label="Places" hint="Leave blank for no limit.">
          <input type="number" min={0} step={1} name="capacity" defaultValue={event?.capacity ?? ""} className={fieldClass} />
        </Field>
      </div>

      <label className={cn("flex items-start gap-3 rounded-2xl border border-rule p-4 text-sm")}>
        <input type="checkbox" name="published" defaultChecked={event?.published ?? false} className="mt-0.5 h-4 w-4 accent-ink" />
        <span>
          <span className="font-medium text-ink">Published</span>
          <span className="block text-muted-foreground">Show it to members and on the website.</span>
        </span>
      </label>

      <SubmitButton pendingLabel="Saving…">{event ? "Save changes" : "Create event"}</SubmitButton>
    </form>
  );
}
