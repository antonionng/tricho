import { ArrowUpRight } from "lucide-react";
import { RsvpButton } from "@/components/members/RsvpButton";
import { BuyTicket } from "@/components/events/BuyTicket";
import { bookingMode } from "@/lib/event-status";

/**
 * How a member books an event: buy a ticket here, reserve a free place, or book
 * on the organiser's own ticket page when the event charges members elsewhere.
 */
export function EventActions({
  event,
  going,
  hasTicket,
  full,
  started,
}: {
  event: { id: string; slug: string; memberPriceGBP: number; sellTickets: boolean; ticketUrl: string | null };
  going: boolean;
  hasTicket: boolean;
  full: boolean;
  started: boolean;
}) {
  const mode = bookingMode(event, { hasTicket, started, going, full });
  if (mode === "none") return null;
  if (mode === "started") {
    return (
      <span className="inline-flex h-11 items-center rounded-full border border-rule px-5 text-sm text-muted-foreground">
        This event has started
      </span>
    );
  }
  if (mode === "sold_out") {
    return <span className="inline-flex h-11 items-center rounded-full border border-rule px-5 text-sm text-muted-foreground">Sold out</span>;
  }
  if (mode === "buy") {
    return <BuyTicket eventId={event.id} slug={event.slug} memberPriceGBP={event.memberPriceGBP} returnTo="members" compact />;
  }
  // Members pay on an outside ticket page, so the place is booked there rather than here.
  if (mode === "external" && event.ticketUrl) {
    return (
      <a
        href={event.ticketUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 items-center gap-1 rounded-full bg-ink px-5 text-sm font-medium text-paper hover:bg-ink/85"
      >
        Get tickets <ArrowUpRight className="h-4 w-4" />
      </a>
    );
  }
  return <RsvpButton eventId={event.id} going={going} full={full} />;
}
