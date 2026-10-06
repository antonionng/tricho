/** What /api/mobile/v1/events sends. Dates are ISO strings. */
export type BookingMode = "none" | "started" | "sold_out" | "buy" | "external" | "rsvp" | "full" | "web_only";

export type Face = { id: string; name: string | null; image: string | null };

export type EventSummary = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  kindLabel: string;
  summary: string;
  startsAt: string;
  endsAt: string | null;
  day: { day: string; month: string; weekday: string };
  time: string;
  online: boolean;
  place: string;
  price: string;
  memberPriceGBP: number;
  /** The organiser's own ticket page, when members pay there. */
  ticketUrl: string | null;
  left: number | null;
  local: boolean;
  going: boolean;
  hasTicket: boolean;
  full: boolean;
  started: boolean;
  past: boolean;
  booking: BookingMode;
  goingText: string;
};

export type EventListItem = EventSummary & { attendees: Face[] };

export type EventsResponse = {
  going: number;
  next: { city: string; status: string };
  events: EventListItem[];
};

export type EventDetail = EventSummary & {
  date: string;
  timeLong: string;
  paragraphs: string[];
  attending: boolean;
  joinUrl: string | null;
  calendar: { google: string; ics: string } | null;
  chapter: { slug: string; city: string } | null;
  url: string;
  attendees: (Face & { you: boolean; profession: string })[];
};

export const eventsKey = ["events"] as const;
export const eventKey = (slug: string) => ["events", "detail", slug] as const;
