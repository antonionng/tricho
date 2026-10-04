import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MessagesSquare, Presentation, Users } from "lucide-react";
import { Container, Eyebrow, Section, SectionHeader } from "@/components/site/primitives";
import { Timeline } from "@/components/site/Timeline";
import { PageHero } from "@/components/editorial/PageHero";
import { SignupPanel } from "@/components/editorial/SignupPanel";
import {
  EVENT_KINDS_EXPLAINED,
  EventRow,
  eventLd,
  publicEventSelect,
  type PublicEvent,
} from "@/components/editorial/events";
import { images, img } from "@/content/images";
import { prisma } from "@/lib/prisma";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Events: gatherings, masterclasses and case rounds",
  description: `Meet the colleagues you refer to at conferences in England, Ireland and Los Angeles, and learn at monthly live masterclasses and case rounds, recorded for members.`,
  path: "/events",
    og: { title: "Meet the colleagues you refer to,", sub: "and learn from a specialist every month.", eyebrow: "Events", img: images.ed27.src, variant: "photo" },
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Events", path: "/events" },
];

const kindIcons = [Users, Presentation, MessagesSquare, CalendarDays];

async function getEvents(): Promise<{ upcoming: PublicEvent[]; past: PublicEvent[] }> {
  const now = new Date();
  try {
    const [upcoming, past] = await Promise.all([
      prisma.event.findMany({
        where: { published: true, startsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        select: publicEventSelect,
      }),
      prisma.event.findMany({
        where: { published: true, startsAt: { lt: now } },
        orderBy: { startsAt: "desc" },
        take: 12,
        select: publicEventSelect,
      }),
    ]);
    return { upcoming, past };
  } catch (err) {
    // If the database is unreachable, show the honest empty state rather than an error page.
    console.error("[events] failed to load events", err);
    return { upcoming: [], past: [] };
  }
}

export default async function EventsPage() {
  const { upcoming, past } = await getEvents();

  return (
    <>
      <PageHero
        eyebrow="Events"
        title="Meet the colleagues you refer to in person,"
        fade="and learn from a specialist live every month."
        lede={
          <p>
            {site.name} began as a gathering at {site.originPlace}, and launches online at{" "}
            {site.launch.title} on 5 October. Next, {site.next.city} ({site.next.status.toLowerCase()}). Between
            conferences there are live masterclasses and case rounds online, with recordings, and meetups in
            each chapter. Members hear about every event first and pay less for tickets.
          </p>
        }
        image={images.ed27}
        imageClassName="mag-bw object-top"
        crumbs={crumbs}
      />

      {/* Upcoming */}
      <Section>
        <Container>
          {upcoming.length > 0 ? (
            <>
              <SectionHeader eyebrow="Coming up" title="Book your place at the next conference" fade="or live masterclass." />
              <ul className="mt-10 divide-y divide-rule border-y border-rule">
                {upcoming.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </ul>
            </>
          ) : (
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <SectionHeader
                  eyebrow="Coming up"
                  title="Hear about the next date first"
                  fade="by leaving your email below."
                  body="We announce each event as soon as the date and venue are confirmed, and we never list an event before it's real."
                />
              </div>
              <div className="lg:col-span-7">
                <SignupPanel
                  eyebrow="Be the first to know"
                  title="The next gathering will be announced to members first."
                  body="Leave your email and we'll let you know as soon as the next date is set, along with news of masterclasses and case rounds."
                  source="events"
                />
              </div>
            </div>
          )}
        </Container>
      </Section>

      {/* The story so far */}
      <Section tone="ink">
        <Container>
          <div className="flex flex-col gap-5 max-w-3xl">
            <p className="label text-paper/60">The story so far</p>
            <h2 className="display text-4xl sm:text-5xl">
              The conferences began at Whittlebury
              <br />
              <span className="opacity-60">and now reach Ireland and beyond.</span>
            </h2>
          </div>
          <div className="mt-14">
            <Timeline tone="ink" />
          </div>
        </Container>
      </Section>

      {/* Kinds of events */}
      <Section tone="paper-2">
        <Container>
          <SectionHeader
            eyebrow="Ways to meet"
            title="Choose from four ways to learn"
            fade="and meet colleagues through the year."
          />
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-rule bg-rule sm:grid-cols-2">
            {EVENT_KINDS_EXPLAINED.map((k, i) => {
              const Icon = kindIcons[i] ?? CalendarDays;
              return (
                <div key={k.title} className="flex flex-col gap-4 bg-paper p-8 md:p-10">
                  <Icon className="h-6 w-6 stroke-[1.25]" aria-hidden />
                  <h3 className="display text-2xl sm:text-3xl">{k.title}</h3>
                  <p className="text-[15px] leading-relaxed text-ink-2">{k.body}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Past */}
      {past.length > 0 && (
        <Section>
          <Container>
            <SectionHeader eyebrow="Archive" title="See what past conferences and masterclasses covered." />
            <ul className="mt-10 divide-y divide-rule border-y border-rule">
              {past.map((e) => (
                <EventRow key={e.id} event={e} past />
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {/* Closing image band */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="absolute inset-0 opacity-40">
          <Image src={img(images.ed30, 1800)} alt="" fill sizes="100vw" className="mag-bw object-cover object-top" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
        <Container className="relative py-20 md:py-28">
          <div className="max-w-2xl flex flex-col gap-6">
            <Eyebrow rule className="text-paper">
              Local chapters
            </Eyebrow>
            <h2 className="display text-4xl md:text-5xl">
              Between conferences, meet colleagues
              <br />
              <span className="opacity-60">in your own country chapter.</span>
            </h2>
            <p className="text-lg leading-relaxed text-paper/80">
              Members belong to a chapter for Ireland, England, Scotland, Wales, Europe or the United States, with
              meetups of their own and a ready list of people to refer to.
            </p>
            <Link
              href="/chapters"
              className="inline-flex w-fit items-center gap-2 text-[15px] font-medium underline decoration-paper/30 underline-offset-4 hover:decoration-paper"
            >
              See the chapters <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </section>

      <JsonLd data={[breadcrumbLd(crumbs), ...upcoming.map(eventLd)]} />
    </>
  );
}
