import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { courseBySlug } from "@/content/courses";
import { lessonsOf } from "@/lib/courses";
import { LessonBlocks } from "@/components/courses/LessonBlocks";
import { KnowledgeCheck } from "@/components/courses/KnowledgeCheck";
import { LessonNotes } from "@/components/courses/LessonNotes";
import { ProgressRing } from "@/components/courses/ProgressRing";
import { cn } from "@/lib/utils";
import { requireLearner } from "../_data";

type Params = { slug: string; lesson: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, lesson } = await params;
  const l = lessonsOf(slug)?.lessons.find((x) => x.slug === lesson);
  return { title: l ? `${l.title} · ${courseBySlug(slug)?.title ?? "Course"}` : "Lesson" };
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { slug, lesson: lessonSlug } = await params;
  const learner = await requireLearner(slug, `/members/courses/${slug}/${lessonSlug}`);
  const { content, enrolment, progress } = learner;

  const index = content.lessons.findIndex((l) => l.slug === lessonSlug);
  if (index < 0) notFound();
  const lesson = content.lessons[index];
  const prev = content.lessons[index - 1];
  const next = content.lessons[index + 1];
  const row = enrolment?.lessons.find((l) => l.lessonSlug === lessonSlug);
  const done = !!row?.completedAt;

  // Remember where they are, so "Continue" brings them back here.
  if (enrolment && enrolment.lastLessonSlug !== lessonSlug) {
    await prisma.courseEnrolment.update({ where: { id: enrolment.id }, data: { lastLessonSlug: lessonSlug } }).catch(() => null);
  }

  const base = `/members/courses/${slug}`;
  const nextHref = next ? `${base}/${next.slug}` : `${base}/assessment`;
  const nextLabel = next ? "Next lesson" : "Go to the assessment";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10">
      <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
        {/* Course outline */}
        <aside className="order-last lg:order-first">
          <div className="flex flex-col gap-5 lg:sticky lg:top-6">
            <Link href={base} className="flex items-center gap-3 rounded-2xl border border-rule bg-card p-4 transition-colors hover:border-ink/30">
              <ProgressRing percent={progress.percent} size={44} />
              <span className="min-w-0">
                <span className="block text-[12px] text-muted-foreground">Your course</span>
                <span className="line-clamp-2 block text-[14px] font-semibold leading-snug">{learner.course.title}</span>
              </span>
            </Link>
            <nav aria-label="Lessons">
              <ol className="flex flex-col gap-0.5">
                {content.lessons.map((l, i) => {
                  const complete = progress.complete.has(l.slug);
                  const here = l.slug === lessonSlug;
                  return (
                    <li key={l.slug}>
                      <Link
                        href={`${base}/${l.slug}`}
                        aria-current={here ? "page" : undefined}
                        className={cn(
                          "flex items-start gap-3 rounded-xl px-3 py-2.5 text-[14px] leading-snug transition-colors",
                          here ? "bg-ink text-paper" : "hover:bg-paper-2"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums",
                            complete ? (here ? "border-paper bg-paper text-ink" : "border-positive bg-positive text-paper") : here ? "border-paper/50" : "border-rule"
                          )}
                          aria-hidden
                        >
                          {complete ? <Check className="h-3 w-3" /> : i + 1}
                        </span>
                        <span>{l.title}</span>
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <Link href={`${base}/assessment`} className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-[14px] leading-snug text-ink-2 hover:bg-paper-2">
                    <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-rule text-[11px]" aria-hidden>
                      ★
                    </span>
                    Final assessment
                  </Link>
                </li>
              </ol>
            </nav>
          </div>
        </aside>

        {/* The lesson */}
        <article className="flex min-w-0 max-w-[44rem] flex-col gap-10">
          <header className="flex flex-col gap-5 animate-rise">
            <p className="label text-muted-foreground">
              Lesson {index + 1} of {content.lessons.length}
            </p>
            <h1 className="display text-[2.4rem] leading-[1.02] sm:text-[3.2rem]">{lesson.title}</h1>
            <p className="lede">{lesson.detail}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden /> About {lesson.minutes} minutes
              </span>
              {done && (
                <span className="inline-flex items-center gap-1.5 text-positive">
                  <Check className="h-4 w-4" aria-hidden /> Completed
                </span>
              )}
            </div>
          </header>

          <section aria-labelledby="objectives" className="rounded-3xl border border-rule bg-card p-5 sm:p-7">
            <p id="objectives" className="label mb-3 inline-flex items-center gap-2 text-muted-foreground">
              <Target className="h-3.5 w-3.5" aria-hidden /> By the end of this lesson you will be able to
            </p>
            <ul className="flex flex-col gap-2 text-[16px]">
              {lesson.objectives.map((o) => (
                <li key={o} className="flex gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0" aria-hidden />
                  {o}
                </li>
              ))}
            </ul>
          </section>

          <LessonBlocks blocks={lesson.blocks} />

          <section aria-labelledby="takeaways" className="flex flex-col gap-4 border-y border-ink py-7">
            <h2 id="takeaways" className="label text-muted-foreground">
              Remember these three things
            </h2>
            <ol className="flex flex-col gap-4">
              {lesson.takeaways.map((t, i) => (
                <li key={t} className="flex gap-4 text-[17px] leading-relaxed">
                  <span className="display w-6 shrink-0 text-2xl leading-none">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
          </section>

          <KnowledgeCheck
            slug={slug}
            lessonSlug={lesson.slug}
            questions={lesson.check.map(({ id, prompt, options }) => ({ id, prompt, options }))}
            done={done}
            nextHref={nextHref}
            nextLabel={nextLabel}
          />

          <LessonNotes
            slug={slug}
            lessonSlug={lesson.slug}
            reflectionPrompt={lesson.reflection}
            initialNotes={row?.notes ?? ""}
            initialReflection={row?.reflection ?? ""}
            canSave={!!enrolment && enrolment.status === "active"}
          />

          <nav aria-label="Lesson navigation" className="flex flex-col gap-3 border-t border-rule pt-6 sm:flex-row sm:justify-between">
            {prev ? (
              <Link href={`${base}/${prev.slug}`} className="group flex items-center gap-3 rounded-2xl px-1 py-2 text-[15px]">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
                <span>
                  <span className="block text-[12px] text-muted-foreground">Previous</span>
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            <Link href={nextHref} className="group flex items-center justify-end gap-3 rounded-2xl px-1 py-2 text-right text-[15px]">
              <span>
                <span className="block text-[12px] text-muted-foreground">{next ? "Next" : "Last step"}</span>
                {next ? next.title : "Final assessment"}
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </nav>
        </article>
      </div>
    </div>
  );
}
