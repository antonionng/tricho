import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { MemberPage, SectionLabel } from "@/components/members/MemberPage";
import { SubmitButton } from "@/components/members/SubmitButton";
import { CertificateCard } from "@/components/courses/CertificateCard";
import { CertificateActions } from "@/components/courses/CertificateActions";
import { longDate } from "@/components/members/format";
import { courseBySlug } from "@/content/courses";
import { site } from "@/config/site";
import { requireLearner } from "../_data";
import { setCertificateOnProfile } from "../actions";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Certificate · ${courseBySlug(slug)?.title ?? "Course"}` };
}

// Print only the certificate and the CPD record, not the member area around them.
const PRINT_CSS = `@media print {
  body * { visibility: hidden; }
  #print-area, #print-area * { visibility: visible; }
  #print-area { position: absolute; inset: 0 auto auto 0; width: 100%; }
  .print-hide { display: none !important; }
  .print-break { break-before: page; }
}`;

export default async function CertificatePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const learner = await requireLearner(slug, `/members/courses/${slug}/certificate`);
  const { course, content, enrolment } = learner;
  const certificate = enrolment?.certificate;
  if (!certificate) redirect(`/members/courses/${slug}`);

  const url = `${site.url.replace(/\/$/, "")}/certificates/${certificate.id}`;
  const linkedIn = `https://www.linkedin.com/profile/add?${new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: certificate.courseTitle,
    organizationName: site.name,
    issueYear: String(certificate.issuedAt.getFullYear()),
    issueMonth: String(certificate.issuedAt.getMonth() + 1),
    certUrl: url,
    certId: certificate.id,
  })}`;
  const progress = new Map((enrolment.lessons ?? []).map((l) => [l.lessonSlug, l]));
  const withdrawn = !!certificate.withdrawnAt;

  return (
    <MemberPage>
      <style>{PRINT_CSS}</style>
      <nav className="print-hide mb-6 text-[14px] text-muted-foreground">
        <Link href="/members/learn" className="hover:text-ink">
          Learn
        </Link>{" "}
        /{" "}
        <Link href={`/members/courses/${slug}`} className="hover:text-ink">
          {course.title}
        </Link>{" "}
        / <span className="text-ink">Certificate</span>
      </nav>

      {withdrawn && (
        <p className="print-hide mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-[15px]">
          This certificate was withdrawn on {longDate(certificate.withdrawnAt!)}
          {certificate.withdrawnNote ? `. ${certificate.withdrawnNote.replace(/\.$/, "")}` : ""}. If you think this is a mistake, write to{" "}
          <a href={`mailto:${site.contactEmail}`} className="underline underline-offset-4">
            {site.contactEmail}
          </a>
          .
        </p>
      )}

      <div id="print-area" className="flex flex-col gap-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <CertificateCard
            reference={certificate.id}
            holderName={certificate.holderName}
            courseTitle={certificate.courseTitle}
            hours={certificate.hours}
            issuedAt={certificate.issuedAt}
            reviewer={course.reviewer ? `${course.reviewer.name}, ${course.reviewer.credentials}` : null}
            withdrawn={withdrawn}
          />

          {!withdrawn && (
            <aside className="print-hide flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <p className="label text-muted-foreground">Share it</p>
                <p className="text-[15px] leading-relaxed text-ink-2">
                  Anyone with the link can check this certificate is genuine. Add it to your website, your LinkedIn profile or a job application.
                </p>
                <CertificateActions url={url} linkedIn={linkedIn} />
              </div>
              <form action={setCertificateOnProfile} className="flex flex-col gap-3 border-t border-rule pt-6">
                <input type="hidden" name="id" value={certificate.id} />
                <input type="hidden" name="show" value={certificate.showOnProfile ? "0" : "1"} />
                <p className="label text-muted-foreground">Your profile badge</p>
                <p className="text-[15px] leading-relaxed text-ink-2">
                  {certificate.showOnProfile
                    ? "A badge for this course shows on your profile and your directory listing, linked to this certificate."
                    : "This course is hidden from your profile and your directory listing."}
                </p>
                <SubmitButton variant="outline" size="default" pending="Saving…">
                  {certificate.showOnProfile ? (
                    <>
                      <EyeOff /> Hide from my profile
                    </>
                  ) : (
                    <>
                      <Eye /> Show on my profile
                    </>
                  )}
                </SubmitButton>
              </form>
            </aside>
          )}
        </div>

        {/* CPD record */}
        <section className="print-break flex flex-col gap-4" aria-labelledby="cpd">
          <SectionLabel>
            <span id="cpd">Your CPD record</span>
          </SectionLabel>
          <div className="rounded-2xl border border-rule bg-card p-5 sm:p-7">
            <dl className="mb-6 grid grid-cols-2 gap-4 text-[14px] sm:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-semibold">{certificate.holderName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Activity</dt>
                <dd className="font-semibold">Online course</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Hours</dt>
                <dd className="font-semibold">{certificate.hours}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Final assessment</dt>
                <dd className="font-semibold">
                  {certificate.score} of {certificate.total}
                </dd>
              </div>
            </dl>
            <ol className="flex flex-col divide-y divide-rule border-t border-rule">
              {content.lessons.map((l, i) => {
                const row = progress.get(l.slug);
                return (
                  <li key={l.slug} className="flex flex-col gap-2 py-5">
                    <p className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold">
                        {i + 1}. {l.title}
                      </span>
                      <span className="text-[13px] text-muted-foreground">
                        {row?.completedAt ? `Completed ${longDate(row.completedAt)}` : ""}
                        {row?.checkScore != null ? ` · Check ${row.checkScore}/${row.checkTotal}` : ""}
                      </span>
                    </p>
                    <p className="text-[14px] text-muted-foreground">Reflection: {l.reflection}</p>
                    <p className="whitespace-pre-line text-[15px] leading-relaxed">
                      {row?.reflection?.trim() || <span className="text-muted-foreground">No reflection written.</span>}
                    </p>
                    {row?.notes?.trim() && (
                      <details className="text-[14px] text-ink-2">
                        <summary className="cursor-pointer text-muted-foreground">Your notes</summary>
                        <p className="mt-2 whitespace-pre-line">{row.notes}</p>
                      </details>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      </div>
    </MemberPage>
  );
}
