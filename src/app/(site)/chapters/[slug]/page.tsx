import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, MapPin } from "lucide-react";
import type { Profession } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { ArrowLink, Container, Eyebrow, Pill, Section, SectionHeader } from "@/components/site/primitives";
import { Breadcrumbs } from "@/components/editorial/PageHero";
import { SignupPanel } from "@/components/editorial/SignupPanel";
import { EventRow, eventLd, publicEventSelect, type PublicEvent } from "@/components/editorial/events";
import { images, img } from "@/content/images";
import { CHAPTERS, chapterBySlug } from "@/content/chapters";
import { prisma } from "@/lib/prisma";
import { publicListingWhere } from "@/lib/stats";
import { absoluteUrl, breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { FREE_LISTING_DAYS } from "@/config/subscriptions";

export const revalidate = 300;
export const dynamicParams = false;

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return CHAPTERS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const chapter = chapterBySlug(slug);
  if (!chapter) return {};
  return pageMetadata({
    title: `${chapter.city} chapter: hair and scalp professionals in ${chapter.city}`,
    description: `${chapter.blurb} Find ${site.name} members in ${chapter.city} and hear about local meetups.`,
    path: `/chapters/${chapter.slug}`,
    og: { title: chapter.city, sub: "Trichollective chapter.", eyebrow: chapter.country, img: chapter.imageKey ? images[chapter.imageKey].src : images.community.src, variant: "photo" },
  });
}

const professionLabel: Record<Profession, string> = {
  cosmetic: "Cosmetic",
  clinical: "Clinical",
  medical: "Medical",
  brand: "Brand",
};

type ListingCard = {
  id: string;
  slug: string | null;
  name: string;
  profession: Profession;
  headline: string | null;
  specialization: string | null;
  city: string;
  isVerified: boolean;
};

async function getChapterData(slug: string, city: string) {
  try {
    const [listings, events] = await Promise.all([
      prisma.directoryListing.findMany({
        where: { ...publicListingWhere(), city: { equals: city, mode: "insensitive" } },
        orderBy: [{ kind: "desc" }, { isVerified: "desc" }, { createdAt: "asc" }],
        take: 12,
        select: {
          id: true,
          slug: true,
          name: true,
          profession: true,
          headline: true,
          specialization: true,
          city: true,
          isVerified: true,
        },
      }),
      prisma.event.findMany({
        where: {
          published: true,
          startsAt: { gte: new Date() },
          OR: [{ city: { equals: city, mode: "insensitive" } }, { chapter: { slug } }],
        },
        orderBy: { startsAt: "asc" },
        take: 6,
        select: publicEventSelect,
      }),
    ]);
    return { listings: listings as ListingCard[], events: events as PublicEvent[] };
  } catch (err) {
    console.error("[chapters] failed to load chapter data", slug, err);
    return { listings: [] as ListingCard[], events: [] as PublicEvent[] };
  }
}

export default async function ChapterPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const chapter = chapterBySlug(slug);
  if (!chapter) notFound();

  const { listings, events } = await getChapterData(chapter.slug, chapter.city);
  const image = chapter.imageKey ? images[chapter.imageKey] : null;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Chapters", path: "/chapters" },
    { name: chapter.city, path: `/chapters/${chapter.slug}` },
  ];
  const isOrigin = chapter.city === site.launch.city;

  return (
    <>
      {/* Opening */}
      <section className="border-b border-rule bg-paper">
        <Container>
          <div className={`grid gap-12 py-12 md:py-16 lg:py-20 ${image ? "lg:grid-cols-12 lg:items-center lg:gap-16" : ""}`}>
            <div className={`flex flex-col gap-7 animate-rise ${image ? "lg:col-span-6" : "max-w-4xl"}`}>
              <Breadcrumbs items={crumbs} showCurrent={false} className="-mb-2" />
              <Eyebrow rule>
                {chapter.country} · Local chapter
              </Eyebrow>
              <h1 className="display text-[3rem] leading-[0.95] sm:text-7xl lg:text-[5.5rem]">
                {chapter.city}
                <br />
                <span className="text-fade">{isOrigin ? "where we launch." : "chapter."}</span>
              </h1>
              <p className="lede max-w-xl">{chapter.blurb}</p>
            </div>
            {image && (
              <div className="lg:col-span-6">
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-paper-2 lg:aspect-[5/6]">
                  <Image
                    src={img(image, 1200)}
                    alt={image.alt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Professionals */}
      <Section>
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeader
              eyebrow="In the directory"
              title={`Professionals in ${chapter.city}`}
              body={
                listings.length > 0
                  ? "Cosmetic, clinical and medical practitioners listed in the founding directory. Every listing is reviewed by a person before it goes live."
                  : undefined
              }
            />
            {listings.length > 0 && (
              <ArrowLink href={`/directory?city=${encodeURIComponent(chapter.city)}`}>
                Search the directory
              </ArrowLink>
            )}
          </div>

          {listings.length > 0 ? (
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => {
                const inner = (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill>{professionLabel[l.profession]}</Pill>
                      {l.isVerified && (
                        <Pill tone="positive">
                          <BadgeCheck className="h-3 w-3" aria-hidden /> Verified
                        </Pill>
                      )}
                    </div>
                    <p className="text-lg font-semibold leading-snug tracking-tight">{l.name}</p>
                    {(l.headline || l.specialization) && (
                      <p className="text-[14px] leading-relaxed text-ink-2 line-clamp-2">
                        {l.headline ?? l.specialization}
                      </p>
                    )}
                    <p className="mt-auto flex items-center gap-1.5 pt-2 text-[13px] text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" aria-hidden /> {l.city}
                    </p>
                  </>
                );
                return (
                  <li key={l.id}>
                    {l.slug ? (
                      <Link
                        href={`/directory/p/${l.slug}`}
                        className="flex h-full flex-col gap-3 rounded-3xl border border-rule bg-card p-6 transition-colors hover:border-ink/40"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div className="flex h-full flex-col gap-3 rounded-3xl border border-rule bg-card p-6">
                        {inner}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-10 flex flex-col gap-4 rounded-3xl border border-dashed border-rule p-7 sm:p-10">
              <p className="text-lg font-medium text-ink">
                No one in {chapter.city} is listed yet.
              </p>
              <p className="max-w-xl text-[15px] leading-relaxed text-ink-2">
                The founding directory is just opening. If you practise in {chapter.city}, you can add
                your listing free for {FREE_LISTING_DAYS} days and be among the first people clients
                find here.
              </p>
              <ArrowLink href="/directory/list">Add your founding listing</ArrowLink>
            </div>
          )}
        </Container>
      </Section>

      {/* Events */}
      <Section tone="paper-2">
        <Container>
          {events.length > 0 ? (
            <>
              <SectionHeader eyebrow="Coming up" title={`Events in ${chapter.city}`} />
              <ul className="mt-10 divide-y divide-rule border-y border-rule">
                {events.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </ul>
              <ArrowLink href="/events" className="mt-8">
                All events
              </ArrowLink>
            </>
          ) : (
            <SignupPanel
              eyebrow={`Events in ${chapter.city}`}
              title="The next meetup will be announced to members first."
              body={`Nothing is scheduled in ${chapter.city} just yet. Leave your email and we'll tell you when the next chapter meetup or gathering is confirmed.`}
              source={`chapter:${chapter.slug}`}
            />
          )}
        </Container>
      </Section>

      {/* Join */}
      <section className="border-t border-rule bg-paper">
        <Container className="py-24 md:py-28">
          <div className="flex flex-col items-center gap-8 text-center">
            <h2 className="display text-5xl sm:text-6xl max-w-3xl">
              Join the {chapter.city} chapter.
              <br />
              <span className="text-fade">Meet the people near you.</span>
            </h2>
            <p className="lede max-w-xl">
              Members choose their chapter when they join. You&apos;ll get the chapter&apos;s space in
              the community, news of local meetups and a place in the directory.
            </p>
            <Button asChild size="xl">
              <Link href="/pricing">
                Become a member <ArrowRight />
              </Link>
            </Button>
            <ArrowLink href="/chapters">See every chapter</ArrowLink>
          </div>
        </Container>
      </section>

      <JsonLd
        data={[
          breadcrumbLd(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: `${site.name} ${chapter.city}`,
            url: absoluteUrl(`/chapters/${chapter.slug}`),
            description: chapter.blurb,
            parentOrganization: { "@type": "Organization", name: site.name, url: site.url },
            areaServed: {
              "@type": "City",
              name: chapter.city,
              containedInPlace: { "@type": "Country", name: chapter.country },
            },
          },
          ...events.map(eventLd),
        ]}
      />
    </>
  );
}
