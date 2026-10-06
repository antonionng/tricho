import "server-only";
import type { EventKind } from "@prisma/client";
import { EVENT_KIND_LABEL, eventPlace, formatPrice } from "@/components/editorial/events";
import { eventDay, timeOfDay } from "@/components/members/format";
import { appBookingMode, bookingMode, type MemberEventStatus } from "@/lib/event-status";

type Base = {
  id: string;
  slug: string;
  title: string;
  kind: EventKind;
  summary: string;
  startsAt: Date;
  endsAt: Date | null;
  venue: string | null;
  city: string | null;
  online: boolean;
  priceGBP: number;
  memberPriceGBP: number;
  sellTickets: boolean;
  ticketUrl: string | null;
  chapterId: string | null;
};

/** The parts of an event both the list and the event screen show, worded as on the website. */
export function presentEvent(e: Base, s: MemberEventStatus, chapterId: string | null) {
  const price = [
    e.memberPriceGBP > 0 ? `${formatPrice(e.memberPriceGBP)} for members` : "Free for members",
    e.sellTickets && e.priceGBP > 0 ? `${formatPrice(e.priceGBP)} for guests` : null,
  ]
    .filter(Boolean)
    .join(", ");
  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    kind: e.kind,
    kindLabel: EVENT_KIND_LABEL[e.kind],
    summary: e.summary,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    day: eventDay(e.startsAt),
    time: `${timeOfDay(e.startsAt)}${e.endsAt ? ` to ${timeOfDay(e.endsAt)}` : ""}`,
    online: e.online,
    place: eventPlace(e),
    price,
    memberPriceGBP: e.memberPriceGBP,
    ticketUrl: e.ticketUrl,
    left: s.left,
    local: !!chapterId && e.chapterId === chapterId,
    going: s.going,
    hasTicket: s.hasTicket,
    full: s.full,
    started: s.started,
    past: s.past,
    booking: appBookingMode(bookingMode(e, s), e.online),
  };
}
