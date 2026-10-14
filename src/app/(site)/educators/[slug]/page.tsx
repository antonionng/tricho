import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Globe } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Container, Eyebrow, Pill, Section } from "@/components/site/primitives";
import { Breadcrumbs } from "@/components/editorial/PageHero";
import { getCourse, type CatalogueCourse } from "@/lib/course-catalogue";
import { absoluteUrl, breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

type Params = { slug: string };

/** Only approved educators have a public page. */
async function load(slug: string) {
  return prisma.educatorProfile
    .findFirst({
      where: { slug, status: "approved" },
      select: { id: true, slug: true, displayName: true, headline: true, bio: true, credentials: true, topics: true, website: true, courses: { where: { status: "published" }, select: { slug: true } } },
    })
    .catch(() => null);
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const educator = await load((await params).slug);
  if (!educator) return {};
  return pageMetadata({
    title: `${educator.displayName}, Trichollective Educator`,
    description: educator.headline || `Courses by ${educator.displayName} on Trichollective.`,
    path: `/educators/${educator.slug}`,
  });
}

export default async function EducatorPage({ params }: { params: Promise<Params> }) {
  const educator = await load((await params).slug);
  if (!educator) notFound();
  const courses = (await Promise.all(educator.courses.map((c) => getCourse(c.slug)))).filter((c): c is CatalogueCourse => !!c && c.status === "open");
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Educators", path: "/educators" },
    { name: educator.displayName, path: `/educators/${educator.slug}` },
  ];

  return (
    <>
      <section className="border-b border-rule bg-paper">
        <Container size="narrow">
          <div className="flex flex-col gap-6 py-16 md:py-20 animate-rise">
            <Breadcrumbs items={crumbs} showCurrent={false} />
            <Eyebrow rule>Trichollective Educator</Eyebrow>
            <h1 className="display text-[2.6rem] leading-[0.98] sm:text-6xl">{educator.displayName}</h1>
            {educator.headline && <p className="lede">{educator.headline}</p>}
            {educator.topics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {educator.topics.map((t) => (
                  <Pill key={t}>{t}</Pill>
                ))}
              </div>
            )}
            {educator.website && (
              <a href={educator.website} target="_blank" rel="noopener nofollow" className="inline-flex items-center gap-2 text-[15px] underline underline-offset-4">
                <Globe className="h-4 w-4" /> Website
              </a>
            )}
          </div>
        </Container>
      </section>

      <Section>
        <Container size="narrow">
          <div className="flex flex-col gap-10">
            {educator.bio && (
              <div className="prose-tricho">
                {educator.bio.split(/\n{2,}/).map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            )}
            {educator.credentials && (
              <div className="flex flex-col gap-2">
                <p className="label text-muted-foreground">Qualifications and experience</p>
                <p className="whitespace-pre-line text-[16px] leading-relaxed text-ink-2">{educator.credentials}</p>
              </div>
            )}
            <div className="flex flex-col gap-4">
              <p className="label text-muted-foreground">Courses</p>
              {courses.length === 0 ? (
                <p className="text-[15px] text-ink-2">{educator.displayName.split(" ")[0]}&apos;s first course is on its way.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-rule border-y border-rule">
                  {courses.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/courses/${c.slug}`} className="group flex items-center justify-between gap-6 py-5">
                        <span>
                          <span className="block text-lg font-semibold leading-snug tracking-tight">{c.title}</span>
                          <span className="mt-1 block text-[14px] text-muted-foreground">
                            {c.hours} hours · {c.memberPriceGBP === 0 ? "Free for members" : `£${c.memberPriceGBP} for members`}
                          </span>
                        </span>
                        <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Container>
      </Section>
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "Person", name: educator.displayName, description: educator.headline || undefined, url: absoluteUrl(`/educators/${educator.slug}`), ...(educator.website ? { sameAs: [educator.website] } : {}) },
          breadcrumbLd(crumbs),
        ]}
      />
    </>
  );
}
