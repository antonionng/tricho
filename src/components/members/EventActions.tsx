import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RsvpButton } from "@/components/members/RsvpButton";
import { BuyTicket } from "@/components/events/BuyTicket";

/**
 * How a member books an event: buy a ticket here, reserve a free place, or book
 * on the organiser's own ticket page when the event charges members elsewhere.
 * Community members are guests on masterclasses, so they see the guest ticket
 * (when the event has one) and a nudge to upgrade. Existing bookings stay.
 */
export function EventActions({
  event,
  going,
  hasTicket,
  full,
  started,
  includedAsMember = true,
}: {
  event: {
    id: string;
    slug: string;
    kind?: string;
    memberPriceGBP: number;
    priceGBP?: number;
    sellTickets: boolean;
    ticketUrl: string | null;
  };
  going: boolean;
  hasTicket: boolean;
  full: boolean;
  started: boolean;
  includedAsMember?: boolean;
}) {
  if (hasTicket) return null;
  // An existing RSVP can still be cancelled after the rule change.
  if (going) return <RsvpButton eventId={event.id} going full={full} />;
  if (started) {
    return (
      <span className="inline-flex h-11 items-center rounded-full border border-rule px-5 text-sm text-muted-foreground">
        This event has started
      </span>
    );
  }

  const gated = !includedAsMember;
  const guestTicketsHere = event.sellTickets && (event.priceGBP ?? 0) > 0;
  const memberPaysHere = event.sellTickets && event.memberPriceGBP > 0;

  if (memberPaysHere || (gated && guestTicketsHere)) {
    return full ? (
      <span className="inline-flex h-11 items-center rounded-full border border-rule px-5 text-sm text-muted-foreground">Sold out</span>
    ) : (
      <div className="flex flex-col gap-3">
        {gated && <MasterclassUpgradeNote />}
        <BuyTicket
          eventId={event.id}
          slug={event.slug}
          memberPriceGBP={event.memberPriceGBP}
          kind={event.kind}
          gated={gated}
          returnTo="members"
          compact
        />
      </div>
    );
  }

  if (gated) {
    if (event.ticketUrl) {
      return (
        <div className="flex flex-col gap-3">
          <MasterclassUpgradeNote />
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-1 self-start rounded-full bg-ink px-5 text-sm font-medium text-paper hover:bg-ink/85"
          >
            Get a guest ticket <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      );
    }
    return <MasterclassUpgradeNote />;
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

export function MasterclassUpgradeNote() {
  return (
    <p className="text-sm leading-relaxed text-ink-2">
      Live masterclasses are included with{" "}
      <Link href="/pricing#professional" className="font-medium underline underline-offset-4">
        Professional
      </Link>
      . You can buy a guest ticket when the event has one, or upgrade to join as a member.
    </p>
  );
}
