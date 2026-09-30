import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Clock, LayoutList, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLink, Container, Pill, Section, SectionHeader } from "@/components/site/primitives";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { Breadcrumbs } from "@/components/editorial/PageHero";
import { CertificatePreview } from "@/components/editorial/CertificatePreview";
import { Syllabus } from "@/components/editorial/Syllabus";
import { images, img } from "@/content/images";
import { courseBySlug, courses, type Course } from "@/content/courses";
import { absoluteUrl, breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return courses.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const course = courseBySlug(slug);
  if (!course) return {};
  return pageMetadata({
    title: course.title,
    description: course.summary,
    path: `/courses/${course.slug}`,
    og: { title: course.title, eyebrow: `Course · ${course.hours} hours`, img: images[course.imageKey].src, variant: "photo" },
  });
}

const REVIEW_LINE = "Every course is reviewed by a qualified practitioner before it opens.";

function courseLd(c: Course) {
  const url = absoluteUrl(`/courses/${c.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.title,
    description: c.summary,
    url,
    inLanguage: "en-GB",
    provider: { "@type": "Organization", name: site.name, sameAs: site.url },
    audience: { "@type": "Audience", audienceType: c.audience },
    teaches: c.outcomes,
    educationalCredentialAwarded: "Certificate of completion",
    syllabusSections: c.syllabus.map((s) => ({
      "@type": "Syllabus",
      name: s.title,
      description: s.detail,
    })),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: `PT${c.hours}H`,
    },
    offers: {
      "@type": "Offer",
      url,
      category: "Paid",
      price: c.priceGBP,
      priceCurrency: "GBP",
      availability:
        c.status === "open" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
    },
  };
}

export default async function CoursePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const course = courseBySlug(slug);
  if (!course) notFound();

  const image = images[course.imageKey];
  const comingSoon = course.status === "coming-soon";
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Learn", path: "/learn" },
    { name: course.title, path: `/courses/${course.slug}` },
  ];
  const others = courses.filter((c) => c.slug !== course.slug).slice(0, 2);

  return (
    <>
      {/* Opening */}
      <section className="border-b border-rule bg-paper">
        <Container>
          <div className="grid gap-12 py-12 md:py-16 lg:grid-cols-12 lg:gap-16 lg:py-20">
            <div className="lg:col-span-7 flex flex-col gap-7 animate-rise">
              <Breadcrumbs items={crumbs} showCurrent={false} className="-mb-2" />
              <div className="flex flex-wrap gap-2">
                <Pill>{course.hours} hours</Pill>
                <Pill>Online</Pill>
                {comingSoon ? <Pill>Opening soon</Pill> : <Pill tone="positive">Open now</Pill>}
              </div>
              <h1 className="display text-[2.5rem] leading-[0.98] sm:text-6xl lg:text-[4.25rem]">
                {course.title}
              </h1>
              <p className="lede max-w-2xl">{course.summary}</p>
              <p className="flex items-start gap-2.5 text-[15px] text-ink-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                {REVIEW_LINE}
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-paper-2 lg:aspect-[4/5]">
                <Image
                  src={img(image, 1100)}
                  alt={image.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Outcomes and the enrol panel */}
      <Section>
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7 flex flex-col gap-10">
              <SectionHeader eyebrow="What you'll learn" title="By the end," fade="you'll be able to" />
              <ul className="flex flex-col divide-y divide-rule border-y border-rule">
                {course.outcomes.map((o) => (
                  <li key={o} className="flex gap-4 py-5">
                    <Check className="mt-1 h-4 w-4 shrink-0 stroke-[2]" aria-hidden />
                    <p className="text-[17px] leading-relaxed text-ink">{o}.</p>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="lg:col-span-5" id="enrol">
              <div className="flex flex-col gap-6 rounded-3xl border border-rule bg-card p-7 sm:p-9 lg:sticky lg:top-24">
                <p className="label text-muted-foreground">Price</p>
                <div className="flex flex-col gap-1">
                  <p className="display text-5xl">
                    {course.memberPriceGBP === 0 ? "Free" : `£${course.memberPriceGBP}`}
                  </p>
                  <p className="text-[15px] text-ink-2">
                    for members · £{course.priceGBP} otherwise
                  </p>
                </div>
                <dl className="flex flex-col gap-3 border-y border-rule py-5 text-[14px]">
                  <div className="flex gap-3">
                    <dt className="sr-only">Format</dt>
                    <LayoutList className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                    <dd className="text-ink-2">{course.format}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="sr-only">Study time</dt>
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                    <dd className="text-ink-2">About {course.hours} hours, at your own pace</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="sr-only">Who it&apos;s for</dt>
                    <Users className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                    <dd className="text-ink-2">{course.audience}</dd>
                  </div>
                </dl>

                {comingSoon ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-[15px] leading-relaxed text-ink">
                      This course is being written and reviewed now. Leave your email and we&apos;ll
                      tell you the day it opens.
                    </p>
                    <NewsletterForm source={`course:${course.slug}`} cta="Register interest" />
                    <p className="text-[13px] text-muted-foreground">
                      We&apos;ll only email you about this course and our monthly newsletter.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button asChild size="lg" className="w-full">
                      <Link href="/pricing">
                        Join to enrol <ArrowRight />
                      </Link>
                    </Button>
                    <p className="text-[13px] text-muted-foreground">
                      {course.memberPriceGBP === 0
                        ? "Included in every membership."
                        : `Members pay £${course.memberPriceGBP}.`}{" "}
                      You can cancel membership at any time.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      {/* Syllabus */}
      <Section tone="paper-2">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <SectionHeader
                eyebrow="Syllabus"
                title={`${course.syllabus.length} short lessons take you`}
                fade="from first principles to practice."
                body={course.format + "."}
              />
            </div>
            <div className="lg:col-span-8">
              <Syllabus lessons={course.syllabus} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Who it's for and format */}
      <Section>
        <Container>
          <div className="grid gap-px overflow-hidden rounded-3xl border border-rule bg-rule md:grid-cols-3">
            {[
              { label: "Who it's for", title: course.audience, body: "No previous course is needed. If you're unsure whether it suits you, write to us and we'll tell you honestly." },
              { label: "Format", title: course.format, body: "Everything is online. Lessons are short, so you can work through them between clients and pick up where you left off." },
              { label: "Review", title: "Checked before it opens", body: `${REVIEW_LINE} The reviewer is named on the course and on your certificate.` },
            ].map((b) => (
              <div key={b.label} className="flex flex-col gap-4 bg-paper p-8 md:p-10">
                <p className="label text-muted-foreground">{b.label}</p>
                <p className="text-xl font-semibold leading-snug tracking-tight">{b.title}</p>
                <p className="text-[15px] leading-relaxed text-ink-2">{b.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Certificate */}
      <Section tone="paper-2">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-16">
            <div className="lg:col-span-5 flex flex-col gap-8">
              <SectionHeader
                eyebrow="Your certificate"
                title="Your certificate is proof of your learning"
                fade="that anyone can check."
                body="When you finish, you receive a certificate of completion with its own public web address. Share it with clients, add it to your directory listing, or send it to an employer."
              />
              <p className="text-[15px] leading-relaxed text-ink-2">
                It is a certificate of completion, not an accredited qualification. Where a course
                gains CPD accreditation, we&apos;ll say so clearly on this page.
              </p>
              <ArrowLink href="/certification">How certificates work</ArrowLink>
            </div>
            <div className="lg:col-span-7">
              <CertificatePreview courseTitle={course.title} hours={course.hours} />
            </div>
          </div>
        </Container>
      </Section>

      {/* More courses */}
      {others.length > 0 && (
        <Section>
          <Container>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <SectionHeader eyebrow="Keep learning" title="You might also like these courses." />
              <ArrowLink href="/learn">All courses</ArrowLink>
            </div>
            <ul className="mt-10 divide-y divide-rule border-y border-rule">
              {others.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/courses/${c.slug}`}
                    className="group flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-lg font-semibold leading-snug tracking-tight">{c.title}</p>
                      <p className="text-[14px] text-muted-foreground">
                        {c.hours} hours ·{" "}
                        {c.memberPriceGBP === 0 ? "Included for members" : `£${c.memberPriceGBP} for members`}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      <JsonLd data={[courseLd(course), breadcrumbLd(crumbs)]} />
    </>
  );
}
