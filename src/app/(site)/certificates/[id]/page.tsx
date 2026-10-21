import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLink, Container, Eyebrow } from "@/components/site/primitives";
import { Breadcrumbs } from "@/components/editorial/PageHero";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { courseBySlug, courses } from "@/content/courses";
import { prisma } from "@/lib/prisma";
import { isCertificateReference } from "@/lib/course-rules";
import { CertificateCard } from "@/components/courses/CertificateCard";
import { BadgeCheck, ShieldX } from "lucide-react";

type Params = { id: string };

/** Only show a reference back if it looks like one, so the page can't be used to display arbitrary text. */
function safeReference(raw: string) {
  const decoded = (() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();
  return /^[A-Za-z0-9_-]{1,64}$/.test(decoded) ? decoded : null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  return pageMetadata({
    title: "Check a certificate",
    description: `Verify a ${site.name} certificate of completion.`,
    path: `/certificates/${encodeURIComponent(id)}`,
    noindex: true,
  });
}

export default async function CertificateVerifyPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const reference = safeReference(id);
  const anyCourseOpen = courses.some((c) => c.status === "open");
  const lookup = reference?.toUpperCase() ?? null;
  const certificate =
    lookup && isCertificateReference(lookup)
      ? await prisma.certificate
          .findUnique({
            where: { id: lookup },
            select: { id: true, holderName: true, courseSlug: true, courseTitle: true, hours: true, issuedAt: true, withdrawnAt: true },
          })
          .catch(() => null)
      : null;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Certification", path: "/certification" },
    { name: "Check a certificate", path: `/certificates/${encodeURIComponent(id)}` },
  ];

  if (certificate) {
    const course = courseBySlug(certificate.courseSlug);
    const withdrawn = !!certificate.withdrawnAt;
    return (
      <>
        <section className="bg-paper">
          <Container className="py-16 md:py-24">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="flex flex-col gap-8 animate-rise lg:col-span-5">
                <Breadcrumbs items={crumbs} showCurrent={false} />
                <Eyebrow rule>Certificate check</Eyebrow>
                <h1 className="display text-[2.5rem] leading-[0.98] sm:text-6xl">
                  {withdrawn ? "This certificate has been withdrawn." : "This certificate is genuine."}
                </h1>
                <div
                  className={
                    withdrawn
                      ? "flex items-start gap-4 rounded-3xl border border-destructive/30 bg-destructive/5 p-6"
                      : "flex items-start gap-4 rounded-3xl bg-positive/10 p-6"
                  }
                >
                  {withdrawn ? (
                    <ShieldX className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5] text-destructive" aria-hidden />
                  ) : (
                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5] text-positive" aria-hidden />
                  )}
                  <p className="text-[15px] leading-relaxed">
                    {withdrawn
                      ? `${site.name} issued this certificate but has since withdrawn it, so it should no longer be relied on.`
                      : `${site.name} issued this certificate to ${certificate.holderName} on completing ${certificate.courseTitle}, including a final assessment.`}
                  </p>
                </div>
                <p className="text-[15px] leading-relaxed text-ink-2">
                  It is a certificate of completion for continuing professional development, not an accredited qualification.
                </p>
                {course && <ArrowLink href={`/courses/${course.slug}`}>About this course</ArrowLink>}
              </div>
              <div className="lg:col-span-7">
                <CertificateCard
                  reference={certificate.id}
                  holderName={certificate.holderName}
                  courseTitle={certificate.courseTitle}
                  hours={certificate.hours}
                  issuedAt={certificate.issuedAt}
                  reviewer={course?.reviewer ? `${course.reviewer.name}, ${course.reviewer.credentials}` : null}
                  withdrawn={withdrawn}
                />
              </div>
            </div>
          </Container>
        </section>
        <JsonLd data={breadcrumbLd(crumbs)} />
      </>
    );
  }

  return (
    <>
      <section className="bg-paper">
        <Container size="narrow" className="py-16 md:py-24">
          <div className="flex flex-col gap-8 animate-rise">
            <Breadcrumbs items={crumbs} showCurrent={false} />
            <Eyebrow rule>Certificate check</Eyebrow>
            <h1 className="display text-[2.5rem] leading-[0.98] sm:text-6xl">
              We couldn&apos;t find a certificate
              <br />
              <span className="text-fade">with this reference.</span>
            </h1>

            <div className="flex items-start gap-4 rounded-3xl border border-rule bg-card p-6 sm:p-8">
              <SearchX className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5]" aria-hidden />
              <div className="flex flex-col gap-2">
                <p className="label text-muted-foreground">Reference checked</p>
                <p className="break-all font-mono text-[15px] text-ink">
                  {reference ?? "This reference isn't in the format we use"}
                </p>
              </div>
            </div>

            <div className="prose-tricho">
              <p>
                This doesn&apos;t necessarily mean something is wrong. Here are a few things worth
                checking:
              </p>
              <ul>
                <li>
                  Make sure the address was typed exactly as it appears on the certificate, including
                  any capital letters, numbers and dashes.
                </li>
                <li>
                  Ask the certificate holder to send you the link again from their {site.name} account.
                </li>
                {!anyCourseOpen && (
                  <li>
                    Our first courses haven&apos;t opened yet, so no certificates have been issued so
                    far. Any certificate presented before then isn&apos;t genuine.
                  </li>
                )}
              </ul>
              <p>
                If you still can&apos;t find it, or you think a certificate may have been altered,
                please write to{" "}
                <a href={`mailto:${site.contactEmail}?subject=Certificate%20check`}>
                  {site.contactEmail}
                </a>{" "}
                and include the reference above. We&apos;ll reply as soon as we can.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <Button asChild size="lg">
                <Link href="/certification">
                  How certificates work <ArrowRight />
                </Link>
              </Button>
              <ArrowLink href="/learn">See the courses</ArrowLink>
            </div>
          </div>
        </Container>
      </section>
      <JsonLd data={breadcrumbLd(crumbs)} />
    </>
  );
}
