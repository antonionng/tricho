import Link from "next/link";
import { ArrowRight, MapPin, Video } from "lucide-react";
import type { EventKind } from "@prisma/client";
import { Pill } from "@/components/site/primitives";
import { absoluteUrl } from "@/lib/seo";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/** The fields the public pages need. Kept narrow so nothing private is ever selected. */
export const publicEventSelect = {
  id: true,
  slug: true,
  title: true,
  kind: true,
  summary: true,
  body: true,
  startsAt: true,
  endsAt: true,
  venue: true,
  city: true,
  online: true,
  priceGBP: true,
  memberPriceGBP: true,
  capacity: true,
  ticketUrl: true,
  sellTickets: true,
  chapter: { select: { slug: true, city: true } },
} as const;

export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  kind: EventKind;
  summary: string;
  body: string | null;
  startsAt: Date;
  endsAt: Date | null;
  venue: string | null;
  city: string | null;
  online: boolean;
  priceGBP: number;
  memberPriceGBP: number;
  capacity: number | null;
  chapter: { slug: string; city: string } | null;
};

export const EVENT_KIND_LABEL: Record<EventKind, string> = {
  gathering: "Gathering",
  masterclass: "Masterclass",
  case_round: "Case round",
  chapter_meetup: "Chapter meetup",
  welcome: "Welcome session",
};

/** The kinds of events we run, for pages with nothing scheduled yet. */
export const EVENT_KINDS_EXPLAINED = [
  {
    title: "Conferences",
    body: `Meet the colleagues you refer to and learn about new techniques and technology in person, from ${site.originPlace} to ${site.launch.city} and, next, ${site.next.city}.`,
  },
  {
    title: "Monthly masterclasses",
    body: "Learn from a specialist live each month and add the hours to your CPD log, with a recording to watch later if you are with clients."
  },
  {
    title: "Case rounds",
    body: "Bring an anonymised case and hear how a trichologist, a doctor and a cosmetic practitioner would each approach it, so you leave with a clearer plan."
  },
  {
    title: "Chapter meetups",
    body: "Meet members in your country chapter, build the local referral relationships that bring clients your way, and compare notes on practice."
  },
];

const TZ = "Europe/Dublin";

export function formatEventDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(d);
}

export function formatEventTime(start: Date, end?: Date | null) {
  const t = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });
  return end ? `${t.format(start)} to ${t.format(end)}` : t.format(start);
}

export function formatPrice(gbp: number) {
  return gbp === 0 ? "Free" : `£${gbp}`;
}

export function eventPlace(e: Pick<PublicEvent, "online" | "venue" | "city">) {
  if (e.online) return "Online";
  return [e.venue, e.city].filter(Boolean).join(", ") || "Venue to be confirmed";
}

/** schema.org Event for an event page or an event list. */
export function eventLd(e: PublicEvent) {
  const url = absoluteUrl(`/events/${e.slug}`);
  const location = e.online
    ? { "@type": "VirtualLocation", url }
    : {
        "@type": "Place",
        name: e.venue ?? e.city ?? "To be confirmed",
        address: {
          "@type": "PostalAddress",
          ...(e.city ? { addressLocality: e.city } : {}),
        },
      };
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.summary,
    url,
    startDate: e.startsAt.toISOString(),
    ...(e.endsAt ? { endDate: e.endsAt.toISOString() } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: e.online
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    location,
    organizer: { "@type": "Organization", name: site.name, url: site.url },
    offers: {
      "@type": "Offer",
      url,
      price: e.priceGBP,
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
    },
    ...(e.capacity ? { maximumAttendeeCapacity: e.capacity } : {}),
  };
}

/** A single event as a calm list row: date block, title, place and price. */
export function EventRow({ event, past = false }: { event: PublicEvent; past?: boolean }) {
  const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: TZ }).format(event.startsAt);
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: TZ }).format(event.startsAt);
  return (
    <li>
      <Link
        href={`/events/${event.slug}`}
        className={cn(
          "group grid grid-cols-[4rem_1fr] gap-5 py-7 sm:grid-cols-[5.5rem_1fr_auto] sm:items-center sm:gap-8",
          past && "opacity-70 hover:opacity-100 transition-opacity"
        )}
      >
        <div className="flex flex-col">
          <span className="display text-4xl sm:text-5xl tabular-nums">{day}</span>
          <span className="label text-muted-foreground">{month}</span>
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex flex-wrap gap-2">
            <Pill>{EVENT_KIND_LABEL[event.kind]}</Pill>
            {past && <Pill>Past</Pill>}
          </div>
          <h3 className="text-xl font-semibold leading-snug tracking-tight">{event.title}</h3>
          <p className="flex items-center gap-1.5 text-[14px] text-muted-foreground">
            {event.online ? (
              <Video className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {eventPlace(event)} · {formatEventTime(event.startsAt, event.endsAt)}
          </p>
        </div>
        <div className="col-start-2 flex items-center justify-between gap-6 sm:col-start-3 sm:flex-col sm:items-end sm:justify-center sm:gap-1">
          {!past && (
            <p className="text-[14px] text-ink-2">
              {formatPrice(event.memberPriceGBP)} for members
              <span className="text-muted-foreground"> · {formatPrice(event.priceGBP)} otherwise</span>
            </p>
          )}
          <span className="inline-flex items-center gap-1.5 text-[14px] font-medium">
            Details <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </li>
  );
}
