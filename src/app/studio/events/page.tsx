import Link from "next/link";
import { Plus } from "lucide-react";
import type { Event } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { EVENT_KIND_LABEL } from "@/components/studio/labels";
import { Empty, Field, Notice, PageHeader, Section, Tag, dateTime, fieldClass, NoAccess } from "@/components/studio/ui";
import { cn } from "@/lib/utils";
import { studioPage } from "../_lib/guard";
import { saveEventAction } from "../actions";
import { draftEventAction, writeEventBodyAction } from "./actions";
import { dateToLondonInput, formValuesFromPayload, missingEventFields, type EventFormValues, type RequiredEventField } from "@/lib/event-input";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; new?: string; notice?: string; tone?: string; prefill?: string; body?: string }>;
}) {
  const staff = await studioPage("/studio/events", "events.view");
  if (!staff) return <NoAccess what="events" />;
  const canEdit = staff.perms.has("events.edit");
  const sp = await searchParams;
  const now = new Date();

  const [events, editing, sales] = await Promise.all([
    prisma.event.findMany({
      orderBy: { startsAt: "desc" },
      take: 60,
      include: { _count: { select: { rsvps: true } } },
    }),
    sp.edit ? prisma.event.findUnique({ where: { id: sp.edit } }) : null,
    prisma.eventTicket.groupBy({ by: ["eventId"], where: { status: "paid" }, _sum: { quantity: true, amount: true } }),
  ]);
  const salesByEvent = new Map(sales.map((r) => [r.eventId, { sold: r._sum.quantity ?? 0, revenue: r._sum.amount ?? 0 }]));
  const prefillDraft =
    sp.prefill && canEdit
      ? await prisma.draft.findFirst({ where: { id: sp.prefill, kind: "event_prefill", status: "draft" }, select: { id: true, payload: true } })
      : null;
  const prefillValues = prefillDraft ? formValuesFromPayload(prefillDraft.payload) : null;
  const prefill = prefillDraft && prefillValues ? { id: prefillDraft.id, values: prefillValues, missing: missingEventFields(prefillValues) } : null;
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

      {prefill && !sp.notice && (
        <Notice>
          {sp.body === "1"
            ? "The full description was written from your title and summary. Please read it through and check it is accurate before saving."
            : "These details were drafted from your description. Please check every field, especially the date, time and prices, before saving."}
          {prefill.missing.length > 0 && " The fields marked in red still need filling in."}
        </Notice>
      )}

      {showForm && !editing && canEdit && <DescribeEvent />}

      {showForm && <EventForm event={editing} prefill={prefill} />}

      <Section title="Coming up">
        <EventList events={upcoming} sales={salesByEvent} empty="Nothing coming up. Add an event so members have something to look forward to." />
      </Section>
      {past.length > 0 && (
        <Section title="Past events">
          <EventList events={past} sales={salesByEvent} empty="" />
        </Section>
      )}
    </div>
  );
}

type Sales = Map<string, { sold: number; revenue: number }>;

function money(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

function EventList({ events, sales, empty }: { events: (Event & { _count: { rsvps: number } })[]; sales: Sales; empty: string }) {
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
          <div className="flex flex-wrap items-center gap-2">
            {e.sellTickets ? (
              <Tag>
                {sales.get(e.id)?.sold ?? 0} {(sales.get(e.id)?.sold ?? 0) === 1 ? "ticket" : "tickets"} sold
                {e.capacity ? ` of ${e.capacity}` : ""}, {money(sales.get(e.id)?.revenue ?? 0)}
              </Tag>
            ) : null}
            <Tag>
              {e._count.rsvps} going{e.capacity && !e.sellTickets ? ` of ${e.capacity}` : ""}
            </Tag>
            {e.published ? <Tag tone="positive">Published</Tag> : <Tag tone="warn">Not published</Tag>}
            <Button asChild size="xs" variant="outline">
              <Link href={`/studio/events/${e.id}/attendees`}>Attendees</Link>
            </Button>
            <Button asChild size="xs" variant="outline">
              <Link href={`/studio/events?edit=${e.id}`}>Edit</Link>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function DescribeEvent() {
  return (
    <form action={draftEventAction} className="max-w-4xl space-y-3 rounded-2xl border border-rule bg-card p-5 sm:p-6">
      <Field
        label="Describe the event in a sentence"
        hint="For example: a masterclass on scalp micropigmentation next Thursday evening in Dublin, £40 for members and £60 for guests, 20 places. The form below is filled in for you to check before anything is saved."
      >
        <textarea name="sentence" required rows={2} maxLength={2000} className={fieldClass} />
      </Field>
      <SubmitButton pendingLabel="Filling in the form…">Fill in the form</SubmitButton>
    </form>
  );
}

type Prefill = { id: string; values: EventFormValues; missing: RequiredEventField[] } | null;

const missingClass = "border-destructive ring-1 ring-destructive/40";

function EventForm({ event, prefill }: { event: Event | null; prefill: Prefill }) {
  const v = prefill?.values;
  const miss = (f: RequiredEventField) => !!prefill?.missing.includes(f);
  const missHint = "This still needs filling in.";
  return (
    <form action={saveEventAction} className="max-w-4xl space-y-5 rounded-2xl border border-rule bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-ink">{event ? "Edit event" : "New event"}</h2>
        <Link href="/studio/events" className="text-sm text-ink-2 underline underline-offset-4">
          Cancel
        </Link>
      </div>
      {event && <input type="hidden" name="id" value={event.id} />}
      {prefill && <input type="hidden" name="prefillId" value={prefill.id} />}

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field label="Title" hint={miss("title") ? missHint : event ? `Web address: /events/${event.slug}` : "The web address is made from the title."}>
          <input name="title" defaultValue={v ? v.title : event?.title} required className={cn(fieldClass, miss("title") && missingClass)} />
        </Field>
        <Field label="Type">
          <select name="kind" defaultValue={v?.kind ?? event?.kind ?? "gathering"} className={fieldClass}>
            {Object.entries(EVENT_KIND_LABEL).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Short summary" hint={miss("summary") ? missHint : "One or two sentences. Shown on event cards."}>
        <textarea name="summary" defaultValue={v ? v.summary : event?.summary} required rows={2} className={cn(fieldClass, miss("summary") && missingClass)} />
      </Field>
      <div className="space-y-2">
        <Field label="Full description" hint="Optional. Leave a blank line between paragraphs.">
          <textarea name="body" defaultValue={v ? v.body : (event?.body ?? "")} rows={6} className={fieldClass} />
        </Field>
        <SubmitButton formAction={writeEventBodyAction} formNoValidate variant="outline" size="sm" pendingLabel="Writing…">
          Write the description for me
        </SubmitButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" hint={miss("startsAt") ? `UK time. ${missHint}` : "UK time."}>
          <input
            type="datetime-local"
            name="startsAt"
            defaultValue={v ? v.startsAt : dateToLondonInput(event?.startsAt)}
            required
            className={cn(fieldClass, miss("startsAt") && missingClass)}
          />
        </Field>
        <Field label="Ends" hint="Optional.">
          <input type="datetime-local" name="endsAt" defaultValue={v ? v.endsAt : dateToLondonInput(event?.endsAt)} className={fieldClass} />
        </Field>
      </div>

      <fieldset className="space-y-3 rounded-2xl border border-rule p-4">
        <legend className="px-1 text-sm font-medium text-ink">Where</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="online" defaultChecked={v ? v.online : (event?.online ?? false)} className="h-4 w-4 accent-ink" />
          It&apos;s online
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" hint="Leave blank for online events.">
            <input name="city" defaultValue={v ? v.city : (event?.city ?? "")} className={fieldClass} />
          </Field>
          <Field label="Venue">
            <input name="venue" defaultValue={v ? v.venue : (event?.venue ?? "")} className={fieldClass} />
          </Field>
        </div>
      </fieldset>

      <Field label="Ticket link" hint="Optional. For example an Eventbrite page. Shown on the event and in Trichozette and newsletter.">
        <input type="url" name="ticketUrl" defaultValue={v ? v.ticketUrl : (event?.ticketUrl ?? "")} placeholder="https://www.eventbrite.co.uk/e/…" className={fieldClass} />
      </Field>

      <label className="flex items-start gap-3 rounded-2xl border border-rule p-4 text-sm">
        <input type="checkbox" name="sellTickets" defaultChecked={v ? v.sellTickets : (event?.sellTickets ?? false)} className="mt-0.5 h-4 w-4 accent-ink" />
        <span>
          <span className="font-medium text-ink">Sell tickets on Trichollective</span>
          <span className="block text-muted-foreground">
            People pay by card through Stripe on the event page. Signed-in members pay the member price and everyone else pays the guest price, with
            up to four tickets per guest order. Places below caps the number sold. When this is ticked, the ticket link above is not used. Members
            save a free place instead of buying a ticket when the member price is 0.
          </span>
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Guest price (£)">
          <input type="number" min={0} step={1} name="priceGBP" defaultValue={v ? v.priceGBP : (event?.priceGBP ?? 0)} className={fieldClass} />
        </Field>
        <Field label="Member price (£)" hint="0 means free for members.">
          <input type="number" min={0} step={1} name="memberPriceGBP" defaultValue={v ? v.memberPriceGBP : (event?.memberPriceGBP ?? 0)} className={fieldClass} />
        </Field>
        <Field label="Places" hint="Leave blank for no limit.">
          <input type="number" min={0} step={1} name="capacity" defaultValue={v ? v.capacity : (event?.capacity ?? "")} className={fieldClass} />
        </Field>
      </div>

      <label className={cn("flex items-start gap-3 rounded-2xl border border-rule p-4 text-sm")}>
        <input type="checkbox" name="published" defaultChecked={v ? v.published : (event?.published ?? false)} className="mt-0.5 h-4 w-4 accent-ink" />
        <span>
          <span className="font-medium text-ink">Published</span>
          <span className="block text-muted-foreground">Show it to members and on the website.</span>
        </span>
      </label>

      <SubmitButton pendingLabel="Saving…">{event ? "Save changes" : "Create event"}</SubmitButton>
    </form>
  );
}
