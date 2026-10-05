import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Award, Check, Clock, FileCheck2, Lock, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/site/primitives";
import { Card, MemberPage, PageHeader, SectionLabel } from "@/components/members/MemberPage";
import { ProgressRing } from "@/components/courses/ProgressRing";
import { longDate } from "@/components/members/format";
import { courseBySlug } from "@/content/courses";
import { PASS_MARK } from "@/lib/courses";
import { cn } from "@/lib/utils";
import { loadLearner } from "./_data";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: courseBySlug(slug)?.title ?? "Course" };
}

export default async function CourseHomePage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<{ enrolled?: string }> }) {
  const { slug } = await params;
  const { enrolled } = await searchParams;
  const learner = await loadLearner(slug, `/members/courses/${slug}`);
  const { course, content, enrolment, progress, status } = learner;

  // Back from Stripe before the webhook has landed: say so, and refresh shortly.
  if (status === "pending" && !learner.isStaff) {
    return (
      <MemberPage size="narrow">
        <meta httpEquiv="refresh" content="4" />
        <PageHeader
          label="Confirming your place"
          title="We're confirming your payment."
          lede={`This usually takes a few seconds. The page will refresh on its own, and your place on ${course.title} will be ready as soon as Stripe confirms the payment.`}
        />
        <p className="text-[15px] text-ink-2">
          If you closed the payment page without paying, you can{" "}
          <Link href={`/courses/${slug}#enrol`} className="underline underline-offset-4">
            go back to the course
          </Link>{" "}
          and try again.
        </p>
      </MemberPage>
    );
  }
  if (!learner.active) redirect(`/courses/${slug}#enrol`);

  const byLesson = new Map((enrolment?.lessons ?? []).map((l) => [l.lessonSlug, l]));
  const allDone = progress.total > 0 && progress.done === progress.total;
  const best = enrolment?.attempts.reduce<number | null>((m, a) => Math.max(m ?? 0, a.score), null) ?? null;
  const certificate = enrolment?.certificate && !enrolment.certificate.withdrawnAt ? enrolment.certificate : null;
  const reflections = (enrolment?.lessons ?? []).filter((l) => l.reflection?.trim()).length;
  const nextLesson = content.lessons.find((l) => l.slug === progress.next);

  return (
    <MemberPage>
      <nav className="mb-6 text-[14px] text-muted-foreground">
        <Link href="/members/learn" className="hover:text-ink">
          Learn
        </Link>{" "}
        / <span className="text-ink">Your course</span>
      </nav>

      {enrolled && (
        <p role="status" className="mb-6 rounded-2xl bg-positive/10 px-5 py-4 text-[15px] text-ink">
          <strong>Welcome to the course.</strong> Every lesson is open to you now, and we&apos;ve sent the details to your inbox.
        </p>
      )}
      {learner.isStaff && !enrolment && (
        <p className="mb-6 rounded-2xl border border-rule bg-paper-2 px-5 py-4 text-[15px] text-ink-2">
          You&apos;re viewing this course as a member of the team, so your answers and notes aren&apos;t saved.
        </p>
      )}

      <PageHeader
        label="Your course"
        title={course.title}
        lede={course.summary}
        action={
          certificate ? (
            <Button asChild size="lg">
              <Link href={`/members/courses/${slug}/certificate`}>
                <Award /> Your certificate
              </Link>
            </Button>
          ) : nextLesson ? (
            <Button asChild size="lg">
              <Link href={`/members/courses/${slug}/${nextLesson.slug}`}>
                {progress.done === 0 ? "Start the course" : "Continue"} <ArrowRight />
              </Link>
            </Button>
          ) : allDone ? (
            <Button asChild size="lg">
              <Link href={`/members/courses/${slug}/assessment`}>
                Take the assessment <ArrowRight />
              </Link>
            </Button>
          ) : null
        }
      />

      <Card className="mb-10 grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-7">
        <ProgressRing percent={certificate ? 100 : Math.round((progress.done / (progress.total + 1)) * 100)} size={88} />
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[14px] sm:grid-cols-4">
          <Stat label="Lessons" value={`${progress.done} of ${progress.total}`} />
          <Stat label="Study time" value={`About ${course.hours} hours`} />
          <Stat label="Reflections" value={`${reflections} written`} />
          <Stat
            label="Assessment"
            value={certificate ? "Passed" : best != null ? `Best ${best} of ${content.assessment.length}` : allDone ? "Ready" : "Locked"}
            detail={`Pass mark ${Math.round(PASS_MARK * 100)}%`}
          />
        </dl>
      </Card>

      <section className="mb-10">
        <SectionLabel>Lessons</SectionLabel>
        <ol className="flex flex-col divide-y divide-rule overflow-hidden rounded-2xl border border-rule bg-card">
          {content.lessons.map((lesson, i) => {
            const row = byLesson.get(lesson.slug);
            const done = !!row?.completedAt;
            const current = lesson.slug === progress.next;
            return (
              <li key={lesson.slug}>
                <Link
                  href={`/members/courses/${slug}/${lesson.slug}`}
                  className={cn("group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper-2", current && "bg-paper-2/60")}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold tabular-nums",
                      done ? "border-positive bg-positive text-paper" : current ? "border-ink" : "border-rule text-muted-foreground"
                    )}
                    aria-hidden
                  >
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-snug">{lesson.title}</span>
                    <span className="mt-0.5 block text-[14px] text-ink-2">{lesson.detail}</span>
                  </span>
                  <span className="hidden shrink-0 flex-col items-end gap-1 text-[13px] text-muted-foreground sm:flex">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden /> {lesson.minutes} min
                    </span>
                    {done && row?.checkScore != null && (
                      <span>
                        Check {row.checkScore}/{row.checkTotal}
                      </span>
                    )}
                    {row?.reflection?.trim() && (
                      <span className="inline-flex items-center gap-1">
                        <NotebookPen className="h-3.5 w-3.5" aria-hidden /> Reflected
                      </span>
                    )}
                  </span>
                  <span className="sr-only">{done ? "Completed" : current ? "Up next" : "Not started"}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            );
          })}
          <li>
            {allDone || learner.isStaff ? (
              <Link href={`/members/courses/${slug}/assessment`} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper-2">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                    certificate ? "border-positive bg-positive text-paper" : "border-ink"
                  )}
                  aria-hidden
                >
                  {certificate ? <Check className="h-4 w-4" /> : <FileCheck2 className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-snug">Final assessment</span>
                  <span className="mt-0.5 block text-[14px] text-ink-2">
                    {content.assessment.length} questions. Score {Math.round(PASS_MARK * 100)}% or more to earn your certificate.
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            ) : (
              <div className="flex items-center gap-4 px-5 py-4 text-muted-foreground">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rule" aria-hidden>
                  <Lock className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-snug text-ink">Final assessment</span>
                  <span className="mt-0.5 block text-[14px]">Opens when you&apos;ve completed every lesson.</span>
                </span>
              </div>
            )}
          </li>
        </ol>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Card className="flex flex-col gap-2 p-5">
          <p className="label text-muted-foreground">What you&apos;ll be able to do</p>
          <ul className="flex flex-col gap-2 text-[15px]">
            {course.outcomes.map((o) => (
              <li key={o} className="flex gap-2.5">
                <Check className="mt-1 h-4 w-4 shrink-0" aria-hidden /> {o}.
              </li>
            ))}
          </ul>
        </Card>
        <Card className="flex flex-col gap-3 p-5">
          <p className="label text-muted-foreground">Your record</p>
          {certificate ? (
            <>
              <p className="inline-flex items-center gap-2 font-semibold">
                <Award className="h-4 w-4" aria-hidden /> Completed on {longDate(certificate.issuedAt)}
              </p>
              <p className="text-[15px] text-ink-2">
                Certificate {certificate.id}, {certificate.hours} hours of study. Your reflections are on the certificate page, ready to print for your CPD log.
              </p>
            </>
          ) : (
            <p className="text-[15px] leading-relaxed text-ink-2">
              Your knowledge check scores, notes and reflections are kept here as you go. When you pass the assessment they become a printable CPD record alongside your certificate.
            </p>
          )}
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <Pill>{course.hours} hours CPD</Pill>
            {enrolment?.activatedAt && <Pill>Enrolled {longDate(enrolment.activatedAt)}</Pill>}
          </div>
        </Card>
      </section>

    </MemberPage>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
      {detail && <dd className="text-[12px] text-muted-foreground">{detail}</dd>}
    </div>
  );
}
