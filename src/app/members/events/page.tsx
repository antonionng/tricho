import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, MapPin, Video } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Paywall } from "@/components/members/Paywall";
import { EmptyState, MemberPage, PageHeader } from "@/components/members/MemberPage";
import { EventActions } from "@/components/members/EventActions";
import { TicketReturnBanner } from "@/components/events/BuyTicket";
import { holdCutoff, seatsLeft } from "@/lib/tickets";
import { eventDay, timeOfDay } from "@/components/members/format";
import { EVENT_KIND_LABEL, formatPrice } from "@/components/editorial/events";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { site } from "@/config/site";

export const metadata = { title: "Events" };

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ ticket?: string }> }) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/events");
  if (!ctx.allowed) return <Paywall title="Events" body="Gatherings, masterclasses and chapter meetups are part of membership." />;
  const userId = ctx.session.user.id;
  const { ticket } = await searchParams;
  const cutoff = holdCutoff();
  const now = new Date();

  // Keep an event visible for a few hours after it starts.
  const since = new Date();
  since.setHours(since.getHours() - 3);
  const events = await prisma.event.findMany({
    where: { published: true, startsAt: { gte: since } },
    orderBy: { startsAt: "asc" },
    take: 40,
    select: {
      id: true,
      slug: true,
      title: true,
      kind: true,
      summary: true,
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
      chapterId: true,
      rsvps: { select: { userId: true } },
      tickets: {
        where: { OR: [{ status: "paid" }, { status: "pending", createdAt: { gte: cutoff } }] },
        select: { quantity: true, userId: true, status: true },
      },
    },
  });
  const going = events.filter((e) => e.rsvps.some((r) => r.userId === userId)).length;

  return (
    <MemberPage>
      <PageHeader
        label="Events"
        title="Coming up"
        lede={
          going > 0
            ? `You're going to ${going} ${going === 1 ? "event" : "events"}. Everything members can come to is below.`
            : "Gatherings, masterclasses, case rounds and chapter meetups. Let us know you're coming so we can plan."
        }
      />

      {ticket && (
        <div className="mb-4">
          <TicketReturnBanner status={ticket} />
        </div>
      )}

      {events.length === 0 ? (
        <EmptyState
          title="Nothing scheduled just now"
          body={`The next gathering is in ${site.next.city} (${site.next.status.toLowerCase()}). It will appear here, with masterclasses and chapter meetups, as soon as it's announced.`}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((e) => {
            const d = eventDay(e.startsAt);
            const isGoing = e.rsvps.some((r) => r.userId === userId);
            const hasTicket = e.tickets.some((t) => t.userId === userId && t.status === "paid");
            const left = e.sellTickets ? seatsLeft(e, e.tickets, e.rsvps) : null;
            const full = e.sellTickets ? left === 0 : e.capacity != null && e.rsvps.length >= e.capacity;
            const local = !!ctx.chapterId && e.chapterId === ctx.chapterId;
            return (
              <li key={e.id} className="flex gap-4 rounded-2xl border border-rule bg-card p-4 sm:gap-5 sm:p-5">
                <div className="grid h-16 w-14 shrink-0 place-items-center rounded-2xl bg-paper-2 text-center leading-none sm:h-20 sm:w-16">
                  <span>
                    <span className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{d.month}</span>
                    <span className="display mt-1 block text-2xl sm:text-3xl">{d.day}</span>
                    <span className="mt-1 block text-[10px] text-muted-foreground">{d.weekday}</span>
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    <Pill>{EVENT_KIND_LABEL[e.kind]}</Pill>
                    {local && <Pill tone="ink">Your chapter</Pill>}
                    {hasTicket ? <Pill tone="positive">You have a ticket</Pill> : isGoing && <Pill tone="positive">You&apos;re going</Pill>}
                  </div>
                  <h2 className="mt-2 text-lg font-semibold leading-snug tracking-[-0.01em]">{e.title}</h2>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-muted-foreground">
                    <span>{timeOfDay(e.startsAt)}{e.endsAt ? ` to ${timeOfDay(e.endsAt)}` : ""}</span>
                    <span className="inline-flex items-center gap-1">
                      {e.online ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                      {e.online ? "Online" : [e.venue, e.city].filter(Boolean).join(", ") || "Venue to be confirmed"}
                    </span>
                    <span>{e.memberPriceGBP > 0 ? `${formatPrice(e.memberPriceGBP)} for members` : "Free for members"}</span>
                    {e.sellTickets && e.priceGBP > 0 && <span>{formatPrice(e.priceGBP)} for guests</span>}
                    {left != null && left > 0 && <span>{left} {left === 1 ? "place" : "places"} left</span>}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-2">{e.summary}</p>
                  <div className="mt-4 flex flex-wrap items-start gap-2">
                    <EventActions
                      event={e}
                      going={isGoing}
                      hasTicket={hasTicket}
                      full={full}
                      started={e.startsAt < now}
                    />
                    <Link
                      href={`/members/events/${e.slug}`}
                      className="inline-flex h-11 items-center gap-1 rounded-full px-3 text-sm text-ink-2 hover:bg-paper-2"
                    >
                      See details <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </MemberPage>
  );
}
