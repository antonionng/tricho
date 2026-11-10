import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { ArrowRight, CalendarDays, Clock, MapPin, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLink, Container, Pill, Section } from "@/components/site/primitives";
import { Breadcrumbs } from "@/components/editorial/PageHero";
import { SignupPanel } from "@/components/editorial/SignupPanel";
import {
  EVENT_KIND_LABEL,
  eventLd,
  eventPlace,
  formatEventDate,
  formatEventTime,
  formatPrice,
  publicEventSelect,
} from "@/components/editorial/events";
import { BuyTicket, TicketReturnNotice } from "@/components/events/BuyTicket";
import { BuyPackage, PackageReturnNotice, type PackageCard } from "@/components/events/BuyPackage";
import { packageAvailability, packageIncludes } from "@/lib/packages";
import { MemberPlace } from "@/components/events/MemberPlace";
import { images, img } from "@/content/images";
import { seatUsage, seatsLeft, typeAvailability, typeSeatsTaken, type TypeAvailability } from "@/lib/tickets";
import { eventTimeZone, mapHref, timeZoneLabel } from "@/lib/event-time";
import { prisma } from "@/lib/prisma";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

type Params = { slug: string };

const getEvent = cache(async (slug: string) => {
  try {
    return await prisma.event.findFirst({
      where: { slug, published: true },
      select: publicEventSelect,
    });
  } catch (err) {
    console.error("[events] failed to load event", slug, err);
    return null;
  }
});

const getTicketTypes = cache(async (eventId: string) =>
  prisma.eventTicketType
    .findMany({
      where: { eventId, active: true, kind: "attendee" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        pricePence: true,
        memberPricePence: true,
        membersOnly: true,
        capacity: true,
        salesStart: true,
        salesEnd: true,
        maxPerOrder: true,
        active: true,
      },
    })
    .catch(() => [])
);

const getPackages = cache(async (eventId: string) =>
  prisma.eventTicketType
    .findMany({
      where: { eventId, active: true, kind: "package" },
      orderBy: [{ sortOrder: "asc" }, { pricePence: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        pricePence: true,
        memberPricePence: true,
        membersOnly: true,
        capacity: true,
        salesStart: true,
        salesEnd: true,
        maxPerOrder: true,
        active: true,
        placesIncluded: true,
        includesStand: true,
        includesStageSlot: true,
      },
    })
    .catch(() => [])
);

function pence(p: number) {
  return p % 100 === 0 ? `£${p / 100}` : `£${(p / 100).toFixed(2)}`;
}

/** "12 left", "Sold out", "Sales open on 1 December", "Sales closed". */
function availabilityText(a: TypeAvailability, tz: string) {
  switch (a.state) {
    case "not_yet":
      return `Sales open on ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).format(a.opensAt!)}`;
    case "closed":
      return "Sales closed";
    case "sold_out":
      return "Sold out";
    default:
      return a.left != null ? `${a.left} left` : null;
  }
}

export async function generateStaticParams(): Promise<Params[]> {
  try {
    const events = await prisma.event.findMany({
      where: { published: true, startsAt: { gte: new Date() } },
      select: { slug: true },
      take: 50,
    });
    return events.map((e) => ({ slug: e.slug }));
  } catch {
    // Pages render on first request instead.
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return {};
  return pageMetadata({
    title: `${event.title}, ${formatEventDate(event.startsAt)}`,
    description: event.summary,
    path: `/events/${event.slug}`,
    og: { title: event.title, sub: event.startsAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: eventTimeZone(event.timezone) }), eyebrow: event.online ? "Online" : event.city ?? "Event", img: (event.online ? images.ed15 : images.ed28).src, variant: "photo" },
  });
}

export default async function EventPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const isPast = (event.endsAt ?? event.startsAt) < new Date();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Events", path: "/events" },
    { name: event.title, path: `/events/${event.slug}` },
  ];
  const image = event.online ? images.ed15 : images.ed28;
  const paragraphs = (event.body ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  // Seats left for tickets sold here. The page refreshes when a ticket is paid; checkout checks again.
  const usageForLeft = event.sellTickets && !isPast ? await seatUsage(event.id).catch(() => null) : null;
  const left = usageForLeft ? seatsLeft(event, usageForLeft.tickets, usageForLeft.rsvps) : null;
  // Ticket types, each with what is left. Shown to everyone at the public price; members see theirs at checkout.
  const usage = usageForLeft;
  const types = event.sellTickets ? await getTicketTypes(event.id) : [];
  // Any ticket type on sale, packages included, turns the flat prices off.
  const hasAnyTypes = event.sellTickets ? (await prisma.eventTicketType.count({ where: { eventId: event.id, active: true } }).catch(() => 0)) > 0 : false;
  const typeRows = types.map((t) => ({
    ...t,
    availability: typeAvailability(t, {
      eventStartsAt: event.startsAt,
      taken: usage ? typeSeatsTaken(t.id, usage.tickets) : 0,
      eventLeft: left,
      isMember: true,
    }),
  }));
  const tz = eventTimeZone(event.timezone);
  // Exhibitor and sponsor packages, each with what is left of its stock, stands and stage slots.
  const packages = event.sellTickets && !event.online && !isPast ? await getPackages(event.id) : [];
  const packageCards: PackageCard[] = packages.map((p) => {
    const a = packageAvailability(p, event, usage?.packageOrders ?? []);
    return {
      id: p.id,
      name: p.name,
      pricePence: p.pricePence,
      includes: packageIncludes(p),
      placesIncluded: p.placesIncluded,
      status: availabilityText(a, tz),
      canBuy: a.state === "on_sale",
    };
  });
  const map = !event.online && event.venueAddress ? mapHref([event.venue, event.venueAddress]) : null;

  return (
    <>
      <section className="border-b border-rule bg-paper">
        <Container>
          <div className="grid gap-12 py-12 md:py-16 lg:grid-cols-12 lg:gap-16 lg:py-20">
            <div className="lg:col-span-7 flex flex-col gap-7 animate-rise">
              <Breadcrumbs items={crumbs} showCurrent={false} className="-mb-2" />
              <div className="flex flex-wrap gap-2">
                <Pill>{EVENT_KIND_LABEL[event.kind]}</Pill>
                <Pill>{event.online ? "Online" : event.city ?? "In person"}</Pill>
                {event.sponsor && <Pill>Sponsored by {event.sponsor.name}</Pill>}
                {isPast && <Pill>This event has taken place</Pill>}
              </div>
              <h1 className="display text-[2.5rem] leading-[0.98] sm:text-6xl lg:text-[4.25rem]">
                {event.title}
                <br />
                <span className="text-fade">{formatEventDate(event.startsAt, tz)}</span>
              </h1>
              <p className="lede max-w-2xl">{event.summary}</p>
              {event.presenters && <p className="text-ink-2">Presented by {event.presenters}.</p>}
            </div>
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-paper-2 lg:aspect-[4/5]">
                <Image
                  src={img(image, 1100)}
                  alt={image.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="mag-bw object-cover object-top"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7 flex flex-col gap-10">
              {paragraphs.length > 0 ? (
                <div className="prose-tricho">
                  {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              ) : (
                <p className="prose-tricho">
                  Full details, including the programme, will be shared here and sent to everyone who
                  books.
                </p>
              )}
              {event.chapter && (
                <ArrowLink href={`/chapters/${event.chapter.slug}`}>
                  More from the {event.chapter.city} chapter
                </ArrowLink>
              )}
              <ArrowLink href="/events">All events</ArrowLink>
            </div>

            <aside className="lg:col-span-5">
              <div className="flex flex-col gap-6 rounded-3xl border border-rule bg-card p-7 sm:p-9 lg:sticky lg:top-24">
                <Suspense fallback={null}>
                  <TicketReturnNotice />
                </Suspense>
                <dl className="flex flex-col gap-4 text-[15px]">
                  <div className="flex gap-3">
                    <dt className="sr-only">Date</dt>
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                    <dd className="text-ink">{formatEventDate(event.startsAt, tz)}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="sr-only">Time</dt>
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                    <dd className="text-ink">
                      {formatEventTime(event.startsAt, event.endsAt, tz)} ({timeZoneLabel(tz)})
                    </dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="sr-only">Where</dt>
                    {event.online ? (
                      <Video className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                    ) : (
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                    )}
                    <dd className="text-ink">
                      {eventPlace(event)}
                      {!event.online && event.venueAddress && (
                        <span className="block text-[13px] text-muted-foreground">
                          {event.venueAddress}
                          {map && (
                            <>
                              {" · "}
                              <a href={map} target="_blank" rel="noopener" className="underline underline-offset-4">
                                Map
                              </a>
                            </>
                          )}
                        </span>
                      )}
                      {event.online && (
                        <span className="block text-[13px] text-muted-foreground">
                          The joining link is sent to everyone who books.
                        </span>
                      )}
                    </dd>
                  </div>
                  {event.capacity && (
                    <div className="flex gap-3">
                      <dt className="sr-only">Capacity</dt>
                      <Users className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                      <dd className="text-ink">Limited to {event.capacity} places</dd>
                    </div>
                  )}
                </dl>

                {!isPast && event.sellTickets && typeRows.length > 0 && (
                  <div className="flex flex-col gap-4 border-t border-rule pt-6">
                    <p className="label text-muted-foreground">Tickets</p>
                    <ul className="flex flex-col divide-y divide-rule">
                      {typeRows.map((t) => {
                        const status = availabilityText(t.availability, tz);
                        const gone = t.availability.state === "sold_out" || t.availability.state === "closed";
                        return (
                          <li key={t.id} className={`flex items-start justify-between gap-4 py-3 ${gone ? "opacity-60" : ""}`}>
                            <div className="min-w-0">
                              <p className="font-medium text-ink">
                                {t.name}
                                {t.membersOnly && <span className="text-muted-foreground"> · members only</span>}
                              </p>
                              {t.description && <p className="text-[14px] text-ink-2">{t.description}</p>}
                              {status && <p className="text-[13px] text-muted-foreground">{status}</p>}
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-lg font-semibold text-ink">{pence(t.pricePence)}</p>
                              {t.memberPricePence != null && t.memberPricePence < t.pricePence && (
                                <p className="text-[13px] text-muted-foreground">{pence(t.memberPricePence)} for members</p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <BuyTicket eventId={event.id} slug={event.slug} memberPriceGBP={event.memberPriceGBP} />
                  </div>
                )}
                {!isPast && event.sellTickets && typeRows.length === 0 && hasAnyTypes && (
                  <div className="flex flex-col gap-2 border-t border-rule pt-6">
                    <p className="label text-muted-foreground">Tickets</p>
                    <p className="text-[15px] text-ink-2">
                      Delegate tickets are not on sale yet.{packageCards.length > 0 && " Exhibitors and sponsors can book a package below."}
                    </p>
                  </div>
                )}
                {!isPast && event.sellTickets && typeRows.length === 0 && !hasAnyTypes && (
                  <div className="flex flex-col gap-4 border-t border-rule pt-6">
                    <div className="flex flex-col gap-1">
                      <p className="label text-muted-foreground">Tickets</p>
                      <p className="display mt-2 text-5xl">{formatPrice(event.memberPriceGBP)}</p>
                      <p className="text-[15px] text-ink-2">
                        for members, and {event.priceGBP === 0 ? "free" : formatPrice(event.priceGBP)} for guests.
                      </p>
                      {left != null && (
                        <p className="text-[15px] text-ink-2">
                          {left === 0 ? "Every place has now been taken." : `${left} ${left === 1 ? "place is" : "places are"} left.`}
                        </p>
                      )}
                    </div>
                    <BuyTicket eventId={event.id} slug={event.slug} memberPriceGBP={event.memberPriceGBP} />
                  </div>
                )}
                {!isPast && !event.sellTickets && event.ticketUrl && (
                  <div className="flex flex-col gap-4 border-t border-rule pt-6">
                    <p className="label text-muted-foreground">Tickets</p>
                    <MemberPlace
                      slug={event.slug}
                      fallback={
                        <>
                          <Button asChild size="lg" className="w-full">
                            <a href={event.ticketUrl} target="_blank" rel="noopener">
                              Get tickets on Eventbrite <ArrowRight />
                            </a>
                          </Button>
                          <Link
                            href="/pricing"
                            className="text-center text-[15px] font-medium underline decoration-transparent underline-offset-4 hover:decoration-ink/40"
                          >
                            Members hear about every gathering first
                          </Link>
                        </>
                      }
                    />
                  </div>
                )}
                {!isPast && !event.sellTickets && !event.ticketUrl && (
                  <>
                    <div className="flex flex-col gap-1 border-t border-rule pt-6">
                      <p className="label text-muted-foreground">Tickets</p>
                      <p className="display mt-2 text-5xl">{formatPrice(event.memberPriceGBP)}</p>
                      <p className="text-[15px] text-ink-2">for members. This event is part of membership.</p>
                    </div>
                    {/* Members save their place in the members' area; everyone else is shown how to join. */}
                    <MemberPlace
                      slug={event.slug}
                      membersOnly
                      fallback={
                        <Button asChild size="lg" className="w-full">
                          <Link href="/pricing">
                            Become a member to save your place <ArrowRight />
                          </Link>
                        </Button>
                      }
                    />
                  </>
                )}
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      {packageCards.length > 0 && (
        <Section tone="paper-2" id="exhibit">
          <Container>
            <div className="flex flex-col gap-10">
              <div className="flex max-w-3xl flex-col gap-4">
                <p className="label text-muted-foreground">Exhibit or sponsor</p>
                <h2 className="display text-4xl leading-tight sm:text-5xl">Put your brand in front of the trichologists who recommend it.</h2>
                <p className="lede">
                  Every delegate at {event.title} works with hair and scalp clients, and many choose the products and services their clinics use. A
                  package gets your company in the event booklet, and the larger ones add a stand, time on stage and places for your team.
                </p>
                <p className="text-[15px] text-ink-2">
                  Prices include VAT, and you receive a VAT invoice in your company&apos;s name. Packages are booked separately from delegate tickets.
                </p>
              </div>
              <Suspense fallback={null}>
                <PackageReturnNotice />
              </Suspense>
              <BuyPackage eventId={event.id} slug={event.slug} packages={packageCards} />
            </div>
          </Container>
        </Section>
      )}

      {isPast && (
        <Section tone="paper-2">
          <Container>
            <SignupPanel
              eyebrow="Next time"
              title="Hear about the next one first."
              body="Members are told about every gathering, masterclass and case round before anyone else. Leave your email and we'll keep you posted too."
              source="events"
            />
          </Container>
        </Section>
      )}

      <JsonLd data={[eventLd(event), breadcrumbLd(crumbs)]} />
    </>
  );
}
