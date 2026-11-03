import Link from "next/link";
import { Plus } from "lucide-react";
import type { Event, EventTicketType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { EVENT_KIND_LABEL } from "@/components/studio/labels";
import { Empty, Field, Notice, PageHeader, Section, Tag, dateTime, fieldClass, NoAccess } from "@/components/studio/ui";
import { cn } from "@/lib/utils";
import { studioPage } from "../_lib/guard";
import { saveEventAction } from "../actions";
import { deleteTicketTypeAction, draftEventAction, notifyMasterclassAction, saveTicketTypeAction, writeEventBodyAction } from "./actions";
import { dateToZonedInput, formValuesFromPayload, missingEventFields, type EventFormValues, type RequiredEventField } from "@/lib/event-input";
import { DEFAULT_EVENT_TIMEZONE, EVENT_TIMEZONES } from "@/lib/event-time";
import { penceToPounds } from "@/lib/ticket-types";

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

  const [events, editing, sales, partners] = await Promise.all([
    prisma.event.findMany({
      orderBy: { startsAt: "desc" },
      take: 60,
      include: { _count: { select: { rsvps: true, ticketTypes: true } } },
    }),
    sp.edit ? prisma.event.findUnique({ where: { id: sp.edit } }) : null,
    prisma.eventTicket.groupBy({ by: ["eventId"], where: { status: "paid" }, _sum: { quantity: true, amount: true } }),
    prisma.partner.findMany({ where: { hidden: false }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const salesByEvent = new Map(sales.map((r) => [r.eventId, { sold: r._sum.quantity ?? 0, revenue: r._sum.amount ?? 0 }]));
  const prefillDraft =
    sp.prefill && canEdit
      ? await prisma.draft.findFirst({ where: { id: sp.prefill, kind: "event_prefill", status: "draft" }, select: { id: true, payload: true } })
      : null;
  const prefillValues = prefillDraft ? formValuesFromPayload(prefillDraft.payload) : null;
  const prefill = prefillDraft && prefillValues ? { id: prefillDraft.id, values: prefillValues, missing: missingEventFields(prefillValues) } : null;
  const showForm = !!editing || sp.new === "1";
  const ticketTypes = editing
    ? await prisma.eventTicketType.findMany({
        where: { eventId: editing.id },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      })
    : [];
  const typeSold = editing
    ? new Map(
        (
          await prisma.eventTicket.groupBy({ by: ["ticketTypeId"], where: { eventId: editing.id, status: "paid" }, _sum: { quantity: true } })
        ).map((r) => [r.ticketTypeId, r._sum.quantity ?? 0])
      )
    : new Map<string | null, number>();
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

      {showForm && <EventForm event={editing} prefill={prefill} partners={partners} />}

      {editing && (
        <TicketTypesEditor
          event={editing}
          types={ticketTypes.map((t) => ({ ...t, sold: typeSold.get(t.id) ?? 0 }))}
          canEdit={canEdit}
        />
      )}

      <Section title="Coming up">
        <EventList events={upcoming} sales={salesByEvent} canEdit={canEdit} empty="Nothing coming up. Add an event so members have something to look forward to." />
      </Section>
      {past.length > 0 && (
        <Section title="Past events">
          <EventList events={past} sales={salesByEvent} canEdit={false} empty="" />
        </Section>
      )}
    </div>
  );
}

type Sales = Map<string, { sold: number; revenue: number }>;

function money(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

function EventList({
  events,
  sales,
  empty,
  canEdit,
}: {
  events: (Event & { _count: { rsvps: number; ticketTypes: number } })[];
  sales: Sales;
  empty: string;
  canEdit: boolean;
}) {
  if (!events.length) return <Empty>{empty}</Empty>;
  return (
    <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
      {events.map((e) => (
        <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium text-ink">{e.title}</p>
            <p className="text-xs text-muted-foreground">
              {EVENT_KIND_LABEL[e.kind]} · {dateTime(e.startsAt)} · {e.online ? "Online" : [e.venue, e.city].filter(Boolean).join(", ") || "Place to be confirmed"} ·{" "}
              {e.sellTickets && e._count.ticketTypes > 0 ? (
                `${e._count.ticketTypes} ticket ${e._count.ticketTypes === 1 ? "type" : "types"}`
              ) : (
                <>
                  {e.memberPriceGBP === 0 ? "Free for members" : `£${e.memberPriceGBP} members`}
                  {e.priceGBP > 0 && `, £${e.priceGBP} guests`}
                </>
              )}
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
            {e.kind === "masterclass" && e.announcedAt && <Tag>Everyone told</Tag>}
            {canEdit && e.kind === "masterclass" && e.published && (
              <form action={notifyMasterclassAction}>
                <input type="hidden" name="eventId" value={e.id} />
                <SubmitButton size="xs" variant="outline" pendingLabel="Notifying…">
                  {e.announcedAt ? "Notify anyone missed" : "Notify all users"}
                </SubmitButton>
              </form>
            )}
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

function EventForm({ event, prefill, partners }: { event: Event | null; prefill: Prefill; partners: { id: string; name: string }[] }) {
  const v = prefill?.values;
  const tz = v?.timezone ?? event?.timezone ?? DEFAULT_EVENT_TIMEZONE;
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

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field label="Presenters" hint="Optional. For example: Adam Bond (LIVDOR) and Karley Weir. Shown on the event and in its announcement.">
          <input name="presenters" defaultValue={event?.presenters ?? ""} maxLength={200} className={fieldClass} />
        </Field>
        <Field label="Sponsored by" hint="Optional. A sponsored event is always labelled.">
          <select name="sponsorPartnerId" defaultValue={event?.sponsorPartnerId ?? ""} className={fieldClass}>
            <option value="">Not sponsored</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Starts" hint={miss("startsAt") ? `In the time zone chosen. ${missHint}` : "In the time zone chosen."}>
          <input
            type="datetime-local"
            name="startsAt"
            defaultValue={v ? v.startsAt : dateToZonedInput(event?.startsAt, tz)}
            required
            className={cn(fieldClass, miss("startsAt") && missingClass)}
          />
        </Field>
        <Field label="Ends" hint="Optional.">
          <input type="datetime-local" name="endsAt" defaultValue={v ? v.endsAt : dateToZonedInput(event?.endsAt, tz)} className={fieldClass} />
        </Field>
        <Field label="Time zone" hint="Dublin and London share a clock.">
          <select name="timezone" defaultValue={tz} className={fieldClass}>
            {EVENT_TIMEZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </select>
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
        <Field label="Venue address" hint="For in-person events. Ticket emails show it with a map link, for example: Whittlebury Hall, Whittlebury, Towcester NN12 8QH.">
          <input name="venueAddress" defaultValue={v ? v.venueAddress : (event?.venueAddress ?? "")} maxLength={300} className={fieldClass} />
        </Field>
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
            save a free place instead of buying a ticket when the member price is 0. Once the event is saved, you can add ticket types such as early
            bird and standard below; they then replace these two prices.
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
          <span className="block text-muted-foreground">
            Show it to members and on the website. Publishing a masterclass with a date still to come tells every user in the app straight away,
            and drafts the announcement email for your approval.
          </span>
        </span>
      </label>

      <SubmitButton pendingLabel="Saving…">{event ? "Save changes" : "Create event"}</SubmitButton>
    </form>
  );
}

type TypeRow = EventTicketType & { sold: number };

/**
 * Ticket types for an event sold here: early bird, standard and so on. Each has
 * its own price, member price, places, sales window and limit per order. When an
 * event has at least one type switched on, the flat member and guest prices above
 * are no longer used.
 */
function TicketTypesEditor({ event, types, canEdit }: { event: Event; types: TypeRow[]; canEdit: boolean }) {
  return (
    <section id="ticket-types" className="max-w-4xl space-y-4 rounded-2xl border border-rule bg-card p-5 sm:p-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-ink">Ticket types</h2>
        <p className="text-sm text-muted-foreground">
          Add types such as early bird and standard to sell several kinds of ticket, each with its own price, places and sales dates. Prices
          include VAT. The event&apos;s Places above still caps the total across every type.
          {!event.sellTickets && " Tick Sell tickets on Trichollective above for these to go on sale."}
          {types.some((t) => t.active)
            ? " Because this event has ticket types on sale, the flat guest and member prices are not used."
            : " Without any types on sale, the flat guest and member prices are used."}
        </p>
      </div>
      {types.map((t) => (
        <TicketTypeForm key={t.id} event={event} type={t} canEdit={canEdit} />
      ))}
      {canEdit && (
        <details className="rounded-2xl border border-dashed border-rule p-4" open={types.length === 0}>
          <summary className="cursor-pointer text-sm font-medium text-ink">Add a ticket type</summary>
          <div className="pt-4">
            <TicketTypeForm event={event} type={null} canEdit nextSort={(types.at(-1)?.sortOrder ?? 0) + 10} />
          </div>
        </details>
      )}
    </section>
  );
}

function TicketTypeForm({ event, type, canEdit, nextSort = 0 }: { event: Event; type: TypeRow | null; canEdit: boolean; nextSort?: number }) {
  const tz = event.timezone;
  return (
    <form action={saveTicketTypeAction} className={cn("space-y-4", type && "rounded-2xl border border-rule p-4")}>
      <input type="hidden" name="eventId" value={event.id} />
      {type && <input type="hidden" name="typeId" value={type.id} />}
      {type && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-ink">{type.name}</p>
          <Tag>
            {type.sold} sold{type.capacity ? ` of ${type.capacity}` : ""}
          </Tag>
          {type.active ? <Tag tone="positive">On sale</Tag> : <Tag tone="warn">Switched off</Tag>}
        </div>
      )}
      <fieldset disabled={!canEdit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
          <Field label="Name" hint="For example: Early bird, Standard, Student.">
            <input name="name" defaultValue={type?.name ?? ""} required maxLength={80} className={fieldClass} />
          </Field>
          <Field label="Price (£)" hint="What everyone pays.">
            <input name="price" inputMode="decimal" defaultValue={penceToPounds(type?.pricePence)} required className={fieldClass} />
          </Field>
          <Field label="Member price (£)" hint="Optional. Leave blank for the same price.">
            <input name="memberPrice" inputMode="decimal" defaultValue={penceToPounds(type?.memberPricePence)} className={fieldClass} />
          </Field>
        </div>
        <Field label="Description" hint="Optional. One line on what is included, shown on the event page.">
          <input name="description" defaultValue={type?.description ?? ""} maxLength={300} className={fieldClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Places" hint="Blank for no limit of its own.">
            <input type="number" min={1} step={1} name="capacity" defaultValue={type?.capacity ?? ""} className={fieldClass} />
          </Field>
          <Field label="Most per order" hint="Members included.">
            <input type="number" min={1} max={20} step={1} name="maxPerOrder" defaultValue={type?.maxPerOrder ?? 4} className={fieldClass} />
          </Field>
          <Field label="On sale from" hint="Blank for straight away.">
            <input type="datetime-local" name="salesStart" defaultValue={dateToZonedInput(type?.salesStart, tz)} className={fieldClass} />
          </Field>
          <Field label="Sales close" hint="Blank for the start of the event.">
            <input type="datetime-local" name="salesEnd" defaultValue={dateToZonedInput(type?.salesEnd, tz)} className={fieldClass} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={type?.active ?? true} className="h-4 w-4 accent-ink" />
            On sale
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="membersOnly" defaultChecked={type?.membersOnly ?? false} className="h-4 w-4 accent-ink" />
            Members only
          </label>
          <label className="flex items-center gap-2 text-sm">
            Order on the page
            <input type="number" step={1} name="sortOrder" defaultValue={type?.sortOrder ?? nextSort} className={cn(fieldClass, "w-24")} />
          </label>
        </div>
      </fieldset>
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <SubmitButton size="sm" pendingLabel="Saving…">
            {type ? "Save ticket type" : "Add ticket type"}
          </SubmitButton>
          {type && type.sold === 0 && (
            <SubmitButton size="sm" variant="outline" formAction={deleteTicketTypeAction} formNoValidate pendingLabel="Removing…">
              Remove
            </SubmitButton>
          )}
        </div>
      )}
    </form>
  );
}
