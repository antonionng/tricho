import { ArrowUpRight } from "lucide-react";
import { RsvpButton } from "@/components/members/RsvpButton";
import { BuyTicket } from "@/components/events/BuyTicket";

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
  if (hasTicket) return null;
  if (started) {
    return going ? null : (
      <span className="inline-flex h-11 items-center rounded-full border border-rule px-5 text-sm text-muted-foreground">
        This event has started
      </span>
    );
  }
  if (event.sellTickets && event.memberPriceGBP > 0) {
    return full ? (
      <span className="inline-flex h-11 items-center rounded-full border border-rule px-5 text-sm text-muted-foreground">Sold out</span>
    ) : (
      <BuyTicket eventId={event.id} slug={event.slug} memberPriceGBP={event.memberPriceGBP} returnTo="members" compact />
    );
  }
  // Members pay on an outside ticket page, so the place is booked there rather than here.
  if (!event.sellTickets && event.ticketUrl && event.memberPriceGBP > 0) {
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
