import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLink, Container, Eyebrow, Section, SectionHeader } from "@/components/site/primitives";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { images, img } from "@/content/images";
import { tierById } from "@/config/subscriptions";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { employmentLabel, liveJobWhere, workplaceLabel } from "@/lib/jobs";
import { partnerLogoSrc } from "@/lib/partners";

// New roles show as soon as they are posted.
export const dynamic = "force-dynamic";

const business = tierById("business")!;

export const metadata = pageMetadata({
  title: `Jobs in hair and scalp care`,
  description:
    "Find roles at clinics, salons, head spas and brands across Ireland and the UK, posted by Trichollective Business members. Employers reach practitioners already trained in hair and scalp care.",
  path: "/jobs",
    og: { title: "Find your next role in hair and scalp care.", eyebrow: "Careers", img: images.ed32.src, variant: "photo" },
});

export default async function JobsPage() {
  const jobs = await prisma.job
    .findMany({
      where: liveJobWhere(),
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { partner: { select: { name: true, slug: true, logoUrl: true } } },
    })
    .catch(() => []);
  return (
    <>
      <Section className="pb-12 md:pb-16">
        <Container>
          <div className="flex flex-col gap-8 animate-rise">
            <Eyebrow rule>Jobs</Eyebrow>
            <h1 className="display max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
              Find your next role in a clinic, salon or head spa
              <br />
              <span className="text-fade">that takes hair and scalp care seriously.</span>
            </h1>
            <p className="lede max-w-2xl">
              Roles at clinics, salons, head spas and brands across Ireland and the UK, posted by
              Trichollective Business members.
            </p>
          </div>
        </Container>
      </Section>

      {/* The board */}
      <section className="pb-20 md:pb-28">
        <Container>
          {jobs.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {jobs.map((job) => {
                const logo = partnerLogoSrc(job.partner.logoUrl);
                return (
                  <li key={job.id} className="relative flex gap-4 rounded-3xl border border-rule bg-card p-5 transition-colors hover:border-ink/40 sm:gap-5 sm:p-6">
                    <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-rule bg-white">
                      {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logo} alt="" className="h-full w-full object-contain p-1.5" />
                      ) : (
                        <Briefcase className="h-6 w-6 stroke-[1.25]" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-semibold leading-snug tracking-tight">
                        <Link href={`/jobs/${job.slug}`} className="after:absolute after:inset-0 after:rounded-3xl">
                          {job.title}
                        </Link>
                      </h2>
                      <p className="mt-0.5 text-[15px] text-ink-2">{job.partner.name}</p>
                      <p className="mt-1 flex flex-wrap gap-x-2 text-sm text-muted-foreground">
                        <span>{job.location}</span>
                        <span>{employmentLabel(job.employment)}</span>
                        {job.workplace !== "on_site" && <span>{workplaceLabel(job.workplace)}</span>}
                        {job.pay && <span>{job.pay}</span>}
                      </p>
                      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{job.summary}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-5 rounded-3xl border border-dashed border-rule bg-card px-6 py-16 text-center md:py-20">
              <Briefcase className="h-7 w-7 stroke-[1.25]" aria-hidden />
              <h2 className="text-2xl font-semibold tracking-tight">No roles are listed right now</h2>
              <p className="max-w-lg text-[15px] leading-relaxed text-ink-2">
                Roles posted by Business members appear here as soon as they are published. Leave your email below and
                we&apos;ll let you know when new ones go up.
              </p>
            </div>
          )}
        </Container>
      </section>

      {/* Two sides */}
      <Section tone="paper-2">
        <Container>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-6 overflow-hidden rounded-3xl border border-ink bg-ink text-paper">
              <div className="relative aspect-[16/9]">
                <Image
                  src={img(images.ed32, 1000)}
                  alt={images.ed32.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="mag-bw object-cover object-top opacity-90"
                />
              </div>
              <div className="flex flex-1 flex-col gap-5 p-7 pt-0 md:p-10 md:pt-2">
                <p className="label text-paper/60">For employers</p>
                <h2 className="display text-4xl">Post a job and reach practitioners already trained in hair and scalp care.</h2>
                <p className="text-[15px] leading-relaxed text-paper/80">
                  Job posts are included with Business membership, along with a business page, five
                  Professional seats for your team and a listing in member perks. Your roles are seen by
                  head spa therapists, stylists, trichologists, nurses and doctors who are already part of
                  the community.
                </p>
                <p className="text-sm text-paper/60">
                  £{business.price} a month, or £{business.annualPrice} a year. Cancel anytime.
                </p>
                <div className="mt-auto pt-2">
                  <Button asChild size="lg" variant="paper">
                    <Link href="/for-business">
                      See Business membership <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 overflow-hidden rounded-3xl border border-rule bg-card">
              <div className="relative aspect-[16/9]">
                <Image
                  src={img(images.ed26, 1000)}
                  alt={images.ed26.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="mag-bw object-cover object-top"
                />
              </div>
              <div className="flex flex-1 flex-col gap-5 p-7 pt-0 md:p-10 md:pt-2">
                <p className="label text-muted-foreground">For candidates</p>
                <h2 className="display text-4xl">Be the first to hear when a new role is posted.</h2>
                <p className="text-[15px] leading-relaxed text-ink-2">
                  Join the newsletter and we&apos;ll tell you when new roles are posted, along with news from
                  the community and the next conference. You can unsubscribe at any time.
                </p>
                <div className="mt-auto pt-2">
                  <NewsletterForm source="jobs" cta="Notify me" />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeader
              eyebrow="While you wait"
              title="Show employers a certificate"
              fade="they can verify online in seconds."
              body="Short courses written by practitioners, each with a certificate of completion anyone can check online. Certificates are not accredited qualifications."
            />
            <div className="flex flex-col gap-3">
              <ArrowLink href="/learn">See the courses</ArrowLink>
              <ArrowLink href="/certification">How certificates are checked</ArrowLink>
            </div>
          </div>
        </Container>
      </Section>

      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Jobs", path: "/jobs" },
        ])}
      />
    </>
  );
}
