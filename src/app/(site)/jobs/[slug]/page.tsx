import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Briefcase, Clock, Mail, MapPin, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/site/primitives";
import { prisma } from "@/lib/prisma";
import { employmentLabel, jobParagraphs, liveJobWhere, workplaceLabel } from "@/lib/jobs";
import { partnerLogoSrc, safeHttpUrl } from "@/lib/partners";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";

async function getJob(slug: string) {
  return prisma.job
    .findFirst({
      where: { slug, ...liveJobWhere() },
      include: { partner: { select: { name: true, slug: true, logoUrl: true, website: true, tagline: true, blurb: true } } },
    })
    .catch(() => null);
}

/** Google's employment types for JobPosting. */
const SCHEMA_EMPLOYMENT: Record<string, string> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  contract: "CONTRACTOR",
  self_employed: "CONTRACTOR",
  chair_rental: "OTHER",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return { title: "Role not found", robots: { index: false } };
  return pageMetadata({
    title: `${job.title} at ${job.partner.name}, ${job.location}`,
    description: job.summary.slice(0, 160),
    path: `/jobs/${job.slug}`,
  });
}

export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();

  const logo = partnerLogoSrc(job.partner.logoUrl);
  const website = safeHttpUrl(job.partner.website);
  const applyUrl = safeHttpUrl(job.applyUrl);
  const applyHref = applyUrl ?? (job.applyEmail ? `mailto:${job.applyEmail}?subject=${encodeURIComponent(`Application: ${job.title}`)}` : null);
  const paragraphs = jobParagraphs(job.description);
  const remote = job.workplace === "remote";

  return (
    <>
      <Section className="pb-10">
        <Container className="max-w-3xl">
          <Link href="/jobs" className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm text-ink-2 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> All roles
          </Link>
          <div className="mt-6 flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-rule bg-white">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="h-full w-full object-contain p-1.5" />
              ) : (
                <Briefcase className="h-6 w-6 stroke-[1.25]" aria-hidden />
              )}
            </span>
            <Link href={`/partners/${job.partner.slug}`} className="text-[15px] font-medium underline-offset-4 hover:underline">
              {job.partner.name}
            </Link>
          </div>
          <h1 className="display mt-5 text-4xl leading-[1.05] sm:text-5xl">{job.title}</h1>
          <p className="lede mt-4">{job.summary}</p>

          <dl className="mt-8 grid gap-3 rounded-3xl border border-rule bg-card p-5 text-[15px] sm:grid-cols-2 sm:p-6">
            <div className="flex gap-3">
              <dt className="sr-only">Location</dt>
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
              <dd>
                {[job.location, job.country].filter(Boolean).join(", ")}
                {job.workplace !== "on_site" && ` · ${workplaceLabel(job.workplace)}`}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="sr-only">Type of role</dt>
              <Clock className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
              <dd>{employmentLabel(job.employment)}</dd>
            </div>
            {job.pay && (
              <div className="flex gap-3">
                <dt className="sr-only">Pay</dt>
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                <dd>{job.pay}</dd>
              </div>
            )}
          </dl>

          {applyHref && (
            <div className="mt-6 flex flex-col gap-2">
              <Button asChild size="lg" className="self-start">
                <a href={applyHref} {...(applyUrl ? { target: "_blank", rel: "noopener nofollow" } : {})}>
                  {applyUrl ? (
                    <>
                      Apply on {job.partner.name}&apos;s site <ArrowUpRight />
                    </>
                  ) : (
                    <>
                      <Mail /> Apply by email
                    </>
                  )}
                </a>
              </Button>
              {!applyUrl && job.applyEmail && <p className="text-sm text-muted-foreground">Applications go to {job.applyEmail}.</p>}
            </div>
          )}

          <div className="mt-10 flex flex-col gap-4 text-[16px] leading-[1.7] text-ink-2">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-3 rounded-3xl border border-rule bg-card p-6">
            <p className="label text-muted-foreground">About the employer</p>
            <p className="text-lg font-semibold">{job.partner.name}</p>
            <p className="text-[15px] leading-relaxed text-ink-2">{job.partner.tagline || job.partner.blurb}</p>
            <Link href={`/partners/${job.partner.slug}`} className="text-sm font-medium underline underline-offset-4">
              See {job.partner.name}&apos;s page and team
            </Link>
          </div>
        </Container>
      </Section>

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "JobPosting",
            title: job.title,
            description: paragraphs.map((p) => `<p>${p.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!)}</p>`).join(""),
            datePosted: job.createdAt.toISOString(),
            validThrough: job.expiresAt.toISOString(),
            employmentType: SCHEMA_EMPLOYMENT[job.employment] ?? "OTHER",
            directApply: false,
            hiringOrganization: {
              "@type": "Organization",
              name: job.partner.name,
              ...(website ? { sameAs: website } : {}),
              ...(logo ? { logo: new URL(logo, site.url).toString() } : {}),
            },
            ...(remote
              ? {
                  jobLocationType: "TELECOMMUTE",
                  applicantLocationRequirements: { "@type": "Country", name: job.country || "Ireland" },
                }
              : {
                  jobLocation: {
                    "@type": "Place",
                    address: { "@type": "PostalAddress", addressLocality: job.location, ...(job.country ? { addressCountry: job.country } : {}) },
                  },
                }),
          },
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Jobs", path: "/jobs" },
            { name: job.title, path: `/jobs/${job.slug}` },
          ]),
        ]}
      />
    </>
  );
}
