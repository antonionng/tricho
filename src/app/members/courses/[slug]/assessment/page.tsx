import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberPage, PageHeader } from "@/components/members/MemberPage";
import { AssessmentForm } from "@/components/courses/AssessmentForm";
import { longDate } from "@/components/members/format";
import { courseBySlug } from "@/content/courses";
import { PASS_MARK, publicQuestions } from "@/lib/courses";
import { requireLearner } from "../_data";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Final assessment · ${courseBySlug(slug)?.title ?? "Course"}` };
}

export default async function AssessmentPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const learner = await requireLearner(slug, `/members/courses/${slug}/assessment`);
  const { course, content, enrolment, progress } = learner;
  const base = `/members/courses/${slug}`;
  const total = content.assessment.length;
  const needed = Math.ceil(total * PASS_MARK);
  const certificate = enrolment?.certificate && !enrolment.certificate.withdrawnAt ? enrolment.certificate : null;
  const remaining = content.lessons.filter((l) => !progress.complete.has(l.slug));
  const locked = remaining.length > 0 && !learner.isStaff;

  return (
    <MemberPage size="narrow">
      <nav className="mb-6 text-[14px] text-muted-foreground">
        <Link href={base} className="hover:text-ink">
          {course.title}
        </Link>{" "}
        / <span className="text-ink">Final assessment</span>
      </nav>
      <PageHeader
        label="Final assessment"
        title="Show what you've learned."
        lede={`${total} questions drawn from every lesson. Score ${needed} or more to pass and earn your certificate. Take your time: there's no timer and no limit on retakes.`}
      />

      {certificate ? (
        <div className="flex flex-col gap-4 rounded-3xl bg-ink p-6 text-paper sm:p-8">
          <Award className="h-8 w-8 stroke-[1.4]" aria-hidden />
          <p className="display text-3xl leading-tight">You passed on {longDate(certificate.issuedAt)}.</p>
          <p className="text-paper/80">
            You scored {certificate.score} out of {certificate.total}, and your certificate is ready to share.
          </p>
          <div>
            <Button asChild size="lg" variant="paper">
              <Link href={`${base}/certificate`}>
                See your certificate <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {certificate && (
        <section aria-labelledby="review" className="mt-10 flex flex-col gap-4">
          <h2 id="review" className="label text-muted-foreground">
            Review every answer
          </h2>
          <ol className="flex flex-col gap-4">
            {content.assessment.map((q, n) => (
              <li key={q.id} className="flex flex-col gap-3 rounded-2xl border border-rule bg-card p-5">
                <p className="font-medium leading-snug">
                  <span className="mr-2 text-muted-foreground tabular-nums">{n + 1}.</span>
                  {q.prompt}
                </p>
                <p className="flex items-start gap-2 rounded-xl bg-positive/10 px-4 py-3 text-[15px]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-positive" aria-hidden />
                  {q.options[q.answer]}
                </p>
                <p className="text-[15px] leading-relaxed text-ink-2">{q.explain}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {certificate ? null : locked ? (
        <div className="flex flex-col gap-5 rounded-3xl border border-rule bg-card p-6 sm:p-8">
          <Lock className="h-6 w-6 stroke-[1.5]" aria-hidden />
          <p className="text-xl font-semibold leading-snug">The assessment opens when you&apos;ve completed every lesson.</p>
          <p className="text-[15px] text-ink-2">
            You have {remaining.length} {remaining.length === 1 ? "lesson" : "lessons"} left. A lesson is complete once you&apos;ve answered its knowledge check.
          </p>
          <ul className="flex flex-col divide-y divide-rule border-y border-rule">
            {remaining.map((l) => (
              <li key={l.slug}>
                <Link href={`${base}/${l.slug}`} className="flex items-center justify-between gap-4 py-3 text-[15px] hover:text-ink-2">
                  {l.title} <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          {!!enrolment?.attempts.length && (
            <p className="mb-6 text-[14px] text-muted-foreground">
              Your previous attempts:{" "}
              {enrolment.attempts.map((a) => `${a.score} of ${a.total} on ${longDate(a.createdAt)}`).join(", ")}.
            </p>
          )}
          <p className="mb-6 rounded-2xl border border-rule bg-card px-5 py-4 text-[15px] text-ink-2">
            Your certificate will be issued in the name <strong className="text-ink">{learner.name?.trim() || "Trichollective member"}</strong>. If that isn&apos;t how
            you want it to read,{" "}
            <Link href="/members/profile#about" className="underline underline-offset-4">
              change your name in your profile
            </Link>{" "}
            before you start.
          </p>
          <AssessmentForm slug={slug} questions={publicQuestions(content.assessment)} needed={needed} />
        </>
      )}
    </MemberPage>
  );
}
