import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpen, Library, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLink, Container, Pill, Section, SectionHeader } from "@/components/site/primitives";
import { Reveal } from "@/components/site/Reveal";
import { PageHero } from "@/components/editorial/PageHero";
import { images, img } from "@/content/images";
import { courses } from "@/content/courses";
import { absoluteUrl, breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";

export const metadata = pageMetadata({
  title: "Courses for hair and scalp professionals",
  description:
    "Short, practical courses for head spa therapists, stylists, trichologists, nurses and doctors. Written and reviewed by practitioners, with a certificate you can share.",
  path: "/learn",
    og: { title: "Courses that make Monday easier.", eyebrow: "Learn", img: images.learning.src, variant: "photo" },
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Learn", path: "/learn" },
];

const disciplineLabel = {
  cosmetic: "Cosmetic",
  clinical: "Clinical",
  medical: "Medical",
  everyone: "Every discipline",
} as const;

export default function LearnPage() {
  const openCount = courses.filter((c) => c.status === "open").length;

  return (
    <>
      <PageHero
        eyebrow="Learn"
        title="Courses that make"
        fade="Monday easier."
        lede={
          <p>
            Short, practical courses written by the people doing the work. Each one is reviewed by a
            qualified practitioner before it opens, and ends with a certificate anyone can check online.
          </p>
        }
        image={images.learning}
        crumbs={crumbs}
      />

      {/* Catalogue */}
      <Section>
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeader
              eyebrow="The catalogue"
              title="Browse every course we offer"
              fade="in one place."
              body={
                openCount === 0
                  ? "Our first courses are being written and reviewed now. Open any course to see what it covers and register your interest, and we'll tell you the day it opens."
                  : "Members pay less for every course, and some are included in membership at no extra cost."
              }
            />
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c, i) => (
              <Reveal key={c.slug} delay={i * 80}>
                <Link
                  href={`/courses/${c.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-rule bg-card transition-shadow hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={img(images[c.imageKey], 800)}
                      alt={images[c.imageKey].alt}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-6 sm:p-7">
                    <div className="flex flex-wrap gap-2">
                      <Pill>{disciplineLabel[c.discipline]}</Pill>
                      <Pill>{c.hours} hours</Pill>
                      {c.status === "coming-soon" ? <Pill>Opening soon</Pill> : <Pill tone="positive">Open now</Pill>}
                    </div>
                    <h3 className="text-xl font-semibold leading-snug tracking-tight">{c.title}</h3>
                    <p className="text-[15px] leading-relaxed text-ink-2">{c.summary}</p>
                    <dl className="mt-auto flex flex-col gap-3 border-t border-rule pt-5 text-[14px]">
                      <div className="flex gap-3">
                        <dt className="sr-only">Format</dt>
                        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                        <dd className="text-ink-2">{c.format}</dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="sr-only">Price</dt>
                        <dd className="text-ink">
                          {c.memberPriceGBP === 0 ? "Included for members" : `£${c.memberPriceGBP} for members`}
                          <span className="text-muted-foreground"> · £{c.priceGBP} otherwise</span>
                        </dd>
                        <ArrowRight
                          className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </div>
                    </dl>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* How courses work */}
      <Section tone="paper-2">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHeader
                eyebrow="How it works"
                title="Every course is written by a practitioner"
                fade="and checked by another before it opens."
              />
            </div>
            <ul className="lg:col-span-7 flex flex-col divide-y divide-rule border-y border-rule">
              {[
                {
                  icon: BookOpen,
                  t: "Short and practical",
                  d: "Most courses take between two and five hours, split into short lessons you can fit around clients.",
                },
                {
                  icon: ShieldCheck,
                  t: "Reviewed before it opens",
                  d: "Every course is reviewed by a qualified practitioner before it opens, and their name appears on the course page and the certificate.",
                },
                {
                  icon: BadgeCheck,
                  t: "A certificate you can share",
                  d: "Finish a course and you receive a certificate of completion with its own public web address, so a client or employer can check it in seconds.",
                },
              ].map(({ icon: Icon, t, d }) => (
                <li key={t} className="flex gap-4 py-6">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5]" aria-hidden />
                  <div>
                    <p className="font-medium text-ink">{t}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{d}</p>
                  </div>
                </li>
              ))}
              <li className="py-6">
                <ArrowLink href="/certification">How our certificates work</ArrowLink>
              </li>
            </ul>
          </div>
        </Container>
      </Section>

      {/* Free reading */}
      <Section>
        <Container>
          <SectionHeader
            eyebrow="Free to read"
            title="You can start with the basics today,"
            fade="without creating an account."
            body="Alongside the courses, we publish plain-English guides and a glossary for anyone who wants to understand hair and scalp care a little better."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {[
              {
                icon: Library,
                title: "Guides",
                body: "Clear explanations of head spa, hair shedding, scalp care and choosing the right professional. Useful to share with clients, too.",
                href: "/guides",
                cta: "Read the guides",
              },
              {
                icon: BookOpen,
                title: "Glossary",
                body: "The words clients and colleagues use, from alopecia to trichoscopy, each explained in a sentence or two.",
                href: "/glossary",
                cta: "Browse the glossary",
              },
            ].map(({ icon: Icon, ...card }) => (
              <Link
                key={card.href}
                href={card.href}
                className="group flex flex-col gap-4 rounded-3xl border border-rule bg-card p-7 sm:p-9 transition-colors hover:border-ink/40"
              >
                <Icon className="h-6 w-6 stroke-[1.25]" aria-hidden />
                <h3 className="display text-3xl">{card.title}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2">{card.body}</p>
                <span className="mt-auto pt-2 inline-flex items-center gap-2 text-[15px] font-medium">
                  {card.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* Call to action */}
      <section className="border-t border-rule bg-paper-2">
        <Container className="py-24 md:py-28">
          <div className="flex flex-col items-center gap-8 text-center">
            <h2 className="display text-5xl sm:text-6xl max-w-3xl">
              Members pay less
              <br />
              <span className="text-fade">for every course.</span>
            </h2>
            <p className="lede max-w-xl">
              Membership brings lower course prices, some courses at no extra cost, and a monthly live
              masterclass with the rest of the {site.name} community.
            </p>
            <Button asChild size="xl">
              <Link href="/pricing">
                See membership <ArrowRight />
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      <JsonLd
        data={[
          breadcrumbLd(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${site.name} courses`,
            itemListElement: courses.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: absoluteUrl(`/courses/${c.slug}`),
              name: c.title,
            })),
          },
        ]}
      />
    </>
  );
}
