import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowRight, CalendarDays, Clock, MapPin, Ticket, Users, Video } from "lucide-react";
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
import { images, img } from "@/content/images";
import { prisma } from "@/lib/prisma";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";

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
    og: { title: event.title, sub: event.startsAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Dublin" }), eyebrow: event.online ? "Online" : event.city ?? "Event", img: (event.online ? images.ed15 : images.ed28).src, variant: "photo" },
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
  const ticketMail = `mailto:${site.contactEmail}?subject=${encodeURIComponent(`Tickets: ${event.title}`)}`;

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
                {isPast && <Pill>This event has taken place</Pill>}
              </div>
              <h1 className="display text-[2.5rem] leading-[0.98] sm:text-6xl lg:text-[4.25rem]">
                {event.title}
                <br />
                <span className="text-fade">{formatEventDate(event.startsAt)}</span>
              </h1>
              <p className="lede max-w-2xl">{event.summary}</p>
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
                <dl className="flex flex-col gap-4 text-[15px]">
                  <div className="flex gap-3">
                    <dt className="sr-only">Date</dt>
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                    <dd className="text-ink">{formatEventDate(event.startsAt)}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="sr-only">Time</dt>
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                    <dd className="text-ink">{formatEventTime(event.startsAt, event.endsAt)} (Irish and UK time)</dd>
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

                {!isPast && event.ticketUrl && (
                  <div className="flex flex-col gap-4 border-t border-rule pt-6">
                    <p className="label text-muted-foreground">Tickets</p>
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
                  </div>
                )}
                {!isPast && !event.ticketUrl && (
                  <>
                    <div className="flex flex-col gap-1 border-t border-rule pt-6">
                      <p className="label text-muted-foreground">Tickets</p>
                      <p className="display mt-2 text-5xl">{formatPrice(event.memberPriceGBP)}</p>
                      <p className="text-[15px] text-ink-2">
                        for members · {formatPrice(event.priceGBP)} otherwise
                      </p>
                    </div>
                    {/* Phase 2: replace the mailto with Stripe ticketing and member RSVPs (EventRsvp). */}
                    <div className="flex flex-col gap-4">
                      <Button asChild size="lg" className="w-full">
                        <Link href="/pricing">
                          Members pay less <ArrowRight />
                        </Link>
                      </Button>
                      <a
                        href={ticketMail}
                        className="inline-flex items-center justify-center gap-2 text-[15px] font-medium underline decoration-transparent underline-offset-4 hover:decoration-ink/40"
                      >
                        <Ticket className="h-4 w-4" aria-hidden /> Ask us for tickets by email
                      </a>
                    </div>
                  </>
                )}
              </div>
            </aside>
          </div>
        </Container>
      </Section>

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
