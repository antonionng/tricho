import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Check, Clock, MapPin } from "lucide-react";
import { Container, Section } from "@/components/site/primitives";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { eventPlace, formatEventDate, formatEventTime } from "@/components/editorial/events";
import { attendeeState, canEditDetails, detailsCloseAt } from "@/lib/attendees";
import { eventTimeZone, mapHref, timeZoneLabel } from "@/lib/event-time";
import { prisma } from "@/lib/prisma";
import { ticketQrDataUrl } from "@/lib/ticket-qr";
import { updateAttendeeDetailsAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your ticket",
  robots: { index: false, follow: false, nocache: true },
};

type Params = { slug: string; code: string };

/**
 * One attendee's ticket: the QR code to show at the door, and a form to change
 * their name, dietary and access details until the cut-off. The code in the
 * address is the only key, so the page is never indexed or cached.
 */
export default async function TicketPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<{ saved?: string; notice?: string }> }) {
  const { slug, code } = await params;
  const sp = await searchParams;
  const a = await prisma.eventAttendee.findUnique({
    where: { code: code.toUpperCase() },
    select: {
      name: true,
      code: true,
      dietary: true,
      accessNeeds: true,
      cancelledAt: true,
      checkedInAt: true,
      ticket: { select: { status: true, ticketType: { select: { name: true } } } },
      event: {
        select: {
          slug: true,
          title: true,
          startsAt: true,
          endsAt: true,
          online: true,
          venue: true,
          city: true,
          venueAddress: true,
          timezone: true,
          detailsCloseAt: true,
        },
      },
    },
  });
  if (!a || a.event.slug !== slug) notFound();

  const e = a.event;
  const tz = eventTimeZone(e.timezone);
  const state = attendeeState(a, a.ticket.status);
  const editable = state !== "cancelled" && canEditDetails(e);
  const qr = state === "confirmed" ? await ticketQrDataUrl(e.slug, a.code) : null;
  const map = e.venueAddress ? mapHref([e.venue, e.venueAddress]) : null;
  const time = (d: Date) => new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).format(d);
  const closes = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).format(
    detailsCloseAt(e)
  );

  return (
    <Section>
      <Container>
        <div className="mx-auto flex max-w-xl flex-col gap-8">
          <div className="flex flex-col gap-3">
            <p className="label text-muted-foreground">{a.ticket.ticketType?.name ?? "Ticket"}</p>
            <h1 className="display text-4xl leading-tight sm:text-5xl">{e.title}</h1>
            <p className="text-lg text-ink-2">{a.name}</p>
          </div>

          {sp.saved === "1" && (
            <p role="status" className="rounded-2xl border border-positive/30 bg-positive/10 p-4 text-sm text-ink">
              Your details have been saved.
            </p>
          )}
          {sp.notice && (
            <p role="status" className="rounded-2xl border border-rule bg-paper-2 p-4 text-sm text-ink-2">
              {sp.notice}
            </p>
          )}

          {state === "cancelled" && (
            <p className="rounded-2xl border border-rule bg-paper-2 p-5 text-ink-2">
              This ticket has been cancelled. If you think this is a mistake, please reply to your ticket email and we will help.
            </p>
          )}
          {state === "pending" && (
            <p className="rounded-2xl border border-rule bg-paper-2 p-5 text-ink-2">
              The payment for this ticket is still being confirmed. Your QR code will appear here, and arrive by email, within a few minutes.
            </p>
          )}
          {qr && (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-rule bg-card p-6 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- a generated data URL */}
              <img src={qr} alt={`QR code for ticket ${a.code}`} width={240} height={240} className="h-60 w-60" />
              <p className="label text-muted-foreground">Ticket code</p>
              <p className="text-2xl font-semibold tracking-[0.12em] text-ink">{a.code}</p>
              {a.checkedInAt ? (
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-positive">
                  <Check className="h-4 w-4" aria-hidden /> Checked in at {time(a.checkedInAt)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Show this at the door, on your phone or printed.</p>
              )}
            </div>
          )}

          <dl className="flex flex-col gap-3 text-[15px]">
            <div className="flex gap-3">
              <dt className="sr-only">Date</dt>
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
              <dd>{formatEventDate(e.startsAt, tz)}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="sr-only">Time</dt>
              <Clock className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
              <dd>
                {formatEventTime(e.startsAt, e.endsAt, tz)} ({timeZoneLabel(tz)})
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="sr-only">Where</dt>
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
              <dd>
                {eventPlace(e)}
                {e.venueAddress && <span className="block text-[13px] text-muted-foreground">{e.venueAddress}</span>}
                {map && (
                  <a href={map} target="_blank" rel="noopener" className="text-[13px] underline underline-offset-4">
                    Open in Maps
                  </a>
                )}
              </dd>
            </div>
          </dl>

          {state !== "cancelled" && (
            <form action={updateAttendeeDetailsAction} className="flex flex-col gap-4 rounded-3xl border border-rule bg-card p-6">
              <input type="hidden" name="code" value={a.code} />
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-ink">Your details</h2>
                <p className="text-sm text-muted-foreground">
                  {editable
                    ? `You can change these until ${closes}. We use them for your name badge, catering and access.`
                    : "Details can no longer be changed online. Please reply to your ticket email and we will help."}
                </p>
              </div>
              <fieldset disabled={!editable} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-sm text-ink-2">
                  Name on the ticket
                  <Input name="name" defaultValue={a.name} required maxLength={120} />
                </label>
                <label className="flex flex-col gap-1 text-sm text-ink-2">
                  Dietary needs
                  <Input name="dietary" defaultValue={a.dietary ?? ""} maxLength={300} placeholder="For example: vegetarian, nut allergy" />
                </label>
                <label className="flex flex-col gap-1 text-sm text-ink-2">
                  Access needs
                  <Input name="accessNeeds" defaultValue={a.accessNeeds ?? ""} maxLength={300} placeholder="For example: step-free access" />
                </label>
              </fieldset>
              {editable && (
                <div>
                  <SubmitButton pendingLabel="Saving…">Save my details</SubmitButton>
                </div>
              )}
            </form>
          )}

          <Link href={`/events/${e.slug}`} className="text-sm underline underline-offset-4">
            About the event
          </Link>
        </div>
      </Container>
    </Section>
  );
}
