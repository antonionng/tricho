import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, CalendarPlus, Clock, MapPin, Megaphone, Users, Video } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Paywall } from "@/components/members/Paywall";
import { Card, MemberPage } from "@/components/members/MemberPage";
import { EventActions } from "@/components/members/EventActions";
import { TicketReturnBanner } from "@/components/events/BuyTicket";
import {
  EVENT_KIND_LABEL,
  eventPlace,
  formatEventDate,
  formatEventTime,
  formatPrice,
  publicEventSelect,
} from "@/components/editorial/events";
import { holdCutoff, seatsLeft } from "@/lib/tickets";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { googleCalendarHref } from "@/lib/calendar-links";
import { absoluteUrl } from "@/lib/mail/layout";
import { SubmitButton } from "@/components/members/SubmitButton";
import { shareGoingAction } from "../actions";

export const metadata = { title: "Event" };

export default async function MemberEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ticket?: string; shared?: string }>;
}) {
  const ctx = await getMemberContext();
  const { slug } = await params;
  if (!ctx.session?.user?.id) redirect(`/login?next=/members/events/${slug}`);
  if (!ctx.allowed) return <Paywall title="Events" body="Gatherings, masterclasses and chapter meetups are part of membership." />;
  const userId = ctx.session.user.id;
  const { ticket, shared } = await searchParams;

  const event = await prisma.event.findFirst({
    where: { slug, published: true },
    select: {
      ...publicEventSelect,
      chapterId: true,
      joinUrl: true,
      rsvps: { select: { userId: true } },
      tickets: {
        where: { OR: [{ status: "paid" }, { status: "pending", createdAt: { gte: holdCutoff() } }] },
        select: { quantity: true, userId: true, status: true },
      },
    },
  });
  if (!event) notFound();

  const now = new Date().getTime();
  const started = event.startsAt.getTime() < now;
  const past = (event.endsAt ?? event.startsAt).getTime() < now;
  const going = event.rsvps.some((r) => r.userId === userId);
  const hasTicket = event.tickets.some((t) => t.userId === userId && t.status === "paid");
  const left = event.sellTickets ? seatsLeft(event, event.tickets, event.rsvps) : null;
  const full = event.sellTickets ? left === 0 : event.capacity != null && event.rsvps.length >= event.capacity;
  const local = !!ctx.chapterId && event.chapterId === ctx.chapterId;
  const attending = going || hasTicket;
  // The joining link is only ever shown to members who are going.
  const joinUrl = attending && event.online ? event.joinUrl : null;
  const gcal = googleCalendarHref({ ...event, joinUrl, pageUrl: absoluteUrl(`/members/events/${event.slug}`) });
  const paragraphs = (event.body ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <MemberPage size="narrow">
      <Link
        href="/members/events"
        className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm text-ink-2 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> All events
      </Link>

      {ticket && (
        <div className="mt-3">
          <TicketReturnBanner status={ticket} />
        </div>
      )}

      <header className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Pill>{EVENT_KIND_LABEL[event.kind]}</Pill>
          {local && <Pill tone="ink">Your chapter</Pill>}
          {hasTicket ? <Pill tone="positive">You have a ticket</Pill> : going && <Pill tone="positive">You&apos;re going</Pill>}
          {past && <Pill>This event has taken place</Pill>}
        </div>
        <h1 className="display text-[2.4rem] leading-[1.02] sm:text-5xl">{event.title}</h1>
        <p className="text-[15px] leading-relaxed text-ink-2 sm:text-base">{event.summary}</p>
      </header>

      <Card className="mt-6 flex flex-col gap-5 p-5 sm:p-6">
        <dl className="flex flex-col gap-3 text-[15px]">
          <div className="flex gap-3">
            <dt className="sr-only">Date</dt>
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
            <dd>{formatEventDate(event.startsAt)}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="sr-only">Time</dt>
            <Clock className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
            <dd>{formatEventTime(event.startsAt, event.endsAt)} (Irish and UK time)</dd>
          </div>
          <div className="flex gap-3">
            <dt className="sr-only">Where</dt>
            {event.online ? (
              <Video className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
            ) : (
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
            )}
            <dd>
              {eventPlace(event)}
              {event.online && !joinUrl && (
                <span className="block text-[13px] text-muted-foreground">
                  The joining link appears here and in your confirmation email once you say you are going.
                </span>
              )}
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="sr-only">Places</dt>
            <Users className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
            <dd>
              {event.memberPriceGBP > 0 ? `${formatPrice(event.memberPriceGBP)} for members` : "Free for members"}
              {event.sellTickets && event.priceGBP > 0 ? `, ${formatPrice(event.priceGBP)} for guests` : ""}
              {left != null && left > 0 && !past ? `. ${left} ${left === 1 ? "place" : "places"} left.` : "."}
            </dd>
          </div>
        </dl>
        {!past && (
          <div className="border-t border-rule pt-5">
            <EventActions event={event} going={going} hasTicket={hasTicket} full={full} started={started} />
            {hasTicket && (
              <p className="text-sm leading-relaxed text-ink-2">Your ticket is confirmed, and the details have been sent to your email.</p>
            )}
            {attending && (
              <div className="mt-5 flex flex-col gap-4">
                {joinUrl && (
                  <a
                    href={joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center justify-center gap-2 self-start rounded-full bg-ink px-6 text-[15px] font-medium text-paper hover:bg-ink/85"
                  >
                    <Video className="h-4 w-4" /> Join on Google Meet <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-ink">Add it to your calendar so you don&apos;t miss it.</p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={gcal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-rule bg-card px-4 text-sm hover:border-ink/40"
                    >
                      <CalendarPlus className="h-4 w-4" /> Google Calendar
                    </a>
                    <a
                      href={`/api/events/${event.id}/ics`}
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-rule bg-card px-4 text-sm hover:border-ink/40"
                    >
                      <CalendarPlus className="h-4 w-4" /> Apple or Outlook
                    </a>
                  </div>
                </div>
                <form action={shareGoingAction.bind(null, event.id)} className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-ink">Let colleagues know you are going, so they can join you.</p>
                  <SubmitButton variant="outline" className="self-start" pending="Sharing…">
                    <Megaphone className="h-4 w-4" /> Tell the community you&apos;re going
                  </SubmitButton>
                  {shared === "no" && (
                    <p className="text-sm text-destructive">
                      This couldn&apos;t be shared just now. Please make sure you are going and can post in The Lounge.
                    </p>
                  )}
                </form>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="mt-8 flex flex-col gap-4 text-[16px] leading-[1.7] text-ink-2">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => <p key={i}>{p}</p>)
        ) : (
          <p>The full programme will be shared here and sent to everyone who books.</p>
        )}
      </div>

      {event.chapter && (
        <Link
          href={`/members/chapters/${event.chapter.slug}`}
          className="mt-8 inline-flex h-11 items-center text-sm font-medium underline underline-offset-4"
        >
          See the {event.chapter.city} chapter
        </Link>
      )}
    </MemberPage>
  );
}
