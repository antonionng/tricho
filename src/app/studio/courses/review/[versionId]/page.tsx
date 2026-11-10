import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { NoAccess, Notice, PageHeader, Tag, dateOnly } from "@/components/studio/ui";
import { LessonBlocks } from "@/components/courses/LessonBlocks";
import { courseMetaSchema, parseCourseContent, readinessIssues } from "@/content/course-schema";
import type { CourseContent, Question } from "@/content/course-types";
import { draftImageUrls } from "@/lib/course-builder-assets";
import { studioPage } from "../../../_lib/guard";
import { reviewCourseAction } from "../../actions";

/** What changed between the live version and this one, lesson by lesson. */
function changesSince(live: CourseContent | null, next: CourseContent) {
  if (!live) return null;
  const before = new Map(live.lessons.map((l) => [l.slug, JSON.stringify(l)]));
  const after = new Set(next.lessons.map((l) => l.slug));
  return {
    added: next.lessons.filter((l) => !before.has(l.slug)).map((l) => l.title),
    changed: next.lessons.filter((l) => before.has(l.slug) && before.get(l.slug) !== JSON.stringify(l)).map((l) => l.title),
    removed: live.lessons.filter((l) => !after.has(l.slug)).map((l) => l.title),
    assessment: JSON.stringify(live.assessment) !== JSON.stringify(next.assessment),
  };
}

export default async function ReviewVersionPage({ params, searchParams }: { params: Promise<{ versionId: string }>; searchParams: Promise<{ notice?: string; tone?: string }> }) {
  const { versionId } = await params;
  const staff = await studioPage(`/studio/courses/review/${versionId}`, "courses.review");
  if (!staff) return <NoAccess what="course reviews" />;
  const { notice, tone } = await searchParams;

  const version = await prisma.courseVersion.findUnique({
    where: { id: versionId },
    include: { course: { select: { id: true, slug: true, publishedVersionId: true, educatorId: true } } },
  });
  if (!version) notFound();
  const meta = courseMetaSchema.safeParse(version.meta);
  const content = parseCourseContent(version.content);
  if (!meta.success || !content) notFound();

  const live = version.course.publishedVersionId && version.course.publishedVersionId !== version.id
    ? await prisma.courseVersion.findUnique({ where: { id: version.course.publishedVersionId }, select: { content: true, number: true } })
    : null;
  const diff = changesSince(live ? parseCourseContent(live.content) : null, content);
  const [submitter, issues, imageUrls] = await Promise.all([
    version.submittedById ? prisma.user.findUnique({ where: { id: version.submittedById }, select: { name: true, email: true } }) : null,
    readinessIssues(meta.data, content),
    draftImageUrls(content),
  ]);
  const m = meta.data;
  const waiting = version.status === "submitted";

  return (
    <div className="space-y-8">
      <nav className="text-sm text-muted-foreground">
        <Link href="/studio/courses/review" className="hover:text-ink">
          Course reviews
        </Link>{" "}
        / <span className="text-ink">{m.title}</span>
      </nav>
      <PageHeader
        title={m.title}
        intro={`Version ${version.number}, sent ${dateOnly(version.submittedAt)}${submitter ? ` by ${submitter.name || submitter.email}` : ""}. ${version.course.educatorId ? "An educator's course." : "A Trichollective course."}`}
        actions={
          <Link href={`/studio/courses/${version.course.id}`} className="text-sm underline underline-offset-4">
            Open in the builder
          </Link>
        }
      />
      {notice && <Notice tone={tone === "danger" ? "danger" : "default"}>{notice}</Notice>}
      {!waiting && <Notice>This version has already been reviewed{version.reviewNote ? `: ${version.reviewNote}` : "."}</Notice>}
      {issues.length > 0 && <Notice tone="danger">This version has {issues.length} unfinished parts: {issues.slice(0, 3).join(" ")}</Notice>}

      <section className="grid gap-4 rounded-2xl border border-rule bg-card p-5 text-sm sm:grid-cols-4">
        <Fact label="Price">£{m.priceGBP}, members £{m.memberPriceGBP}</Fact>
        <Fact label="Study hours">{m.hours}</Fact>
        <Fact label="Discipline">{m.discipline}</Fact>
        <Fact label="Lessons">{content.lessons.length}, with {content.assessment.length} assessment questions</Fact>
        <div className="sm:col-span-4">
          <p className="text-muted-foreground">Summary</p>
          <p className="mt-1">{m.summary}</p>
          <p className="mt-3 text-muted-foreground">For: {m.audience}</p>
          <ul className="mt-2 list-disc pl-5">
            {m.outcomes.filter((o) => o.trim()).map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      </section>

      {diff && (
        <section className="rounded-2xl border border-rule bg-paper-2 p-5 text-sm">
          <p className="font-medium">Changes since the live version {live?.number}</p>
          <ul className="mt-2 flex flex-col gap-1 text-ink-2">
            {diff.added.length > 0 && <li>New lessons: {diff.added.join(", ")}</li>}
            {diff.changed.length > 0 && <li>Changed lessons: {diff.changed.join(", ")}</li>}
            {diff.removed.length > 0 && <li>Removed lessons: {diff.removed.join(", ")}</li>}
            {diff.assessment && <li>The final assessment has changed.</li>}
            {!diff.added.length && !diff.changed.length && !diff.removed.length && !diff.assessment && <li>Only the course details have changed.</li>}
          </ul>
        </section>
      )}

      {content.lessons.map((lesson, i) => (
        <article key={lesson.slug} className="space-y-6 rounded-2xl border border-rule bg-paper p-5 sm:p-8">
          <header className="space-y-2">
            <p className="label text-muted-foreground">
              Lesson {i + 1} · {lesson.minutes} minutes {diff?.changed.includes(lesson.title) && <Tag tone="warn">Changed</Tag>} {diff?.added.includes(lesson.title) && <Tag tone="warn">New</Tag>}
            </p>
            <h2 className="display text-3xl">{lesson.title}</h2>
            <p className="text-ink-2">{lesson.detail}</p>
            <ul className="list-disc pl-5 text-sm text-ink-2">
              {lesson.objectives.filter((o) => o.trim()).map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </header>
          <LessonBlocks blocks={lesson.blocks} imageUrls={imageUrls} fileHref={(id) => `/api/courses/${version.course.slug}/files/${id}`} />
          <div className="space-y-2 border-t border-rule pt-4 text-sm">
            <p className="font-medium">Takeaways</p>
            <ol className="list-decimal pl-5">
              {lesson.takeaways.filter((t) => t.trim()).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
            <p className="pt-2 font-medium">Reflection</p>
            <p className="text-ink-2">{lesson.reflection}</p>
          </div>
          <Questions title="Knowledge check" questions={lesson.check} />
        </article>
      ))}

      <article className="space-y-4 rounded-2xl border border-rule bg-paper p-5 sm:p-8">
        <h2 className="display text-3xl">Final assessment</h2>
        <Questions title={`${content.assessment.length} questions`} questions={content.assessment} />
      </article>

      {waiting && (
        <section className="grid gap-4 rounded-2xl border border-rule bg-card p-5 sm:grid-cols-[auto_1fr] sm:items-start">
          <form action={reviewCourseAction}>
            <input type="hidden" name="versionId" value={version.id} />
            <input type="hidden" name="decision" value="approve" />
            <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink/85">
              Approve and publish
            </button>
          </form>
          <form action={reviewCourseAction} className="flex flex-col gap-3 sm:border-l sm:border-rule sm:pl-4">
            <input type="hidden" name="versionId" value={version.id} />
            <fieldset className="flex flex-wrap gap-4 text-sm">
              <legend className="sr-only">Decision</legend>
              <label className="flex items-center gap-1.5">
                <input type="radio" name="decision" value="changes" defaultChecked /> Ask for changes
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" name="decision" value="reject" /> Reject
              </label>
            </fieldset>
            <textarea
              name="note"
              rows={3}
              required
              minLength={10}
              className="rounded-xl border border-rule bg-paper px-3 py-2 text-sm"
              placeholder="Say exactly what to change and why. The author sees this note."
            />
            <button type="submit" className="self-start rounded-full border border-ink/20 px-4 py-2 text-sm font-medium hover:border-ink">
              Send to the author
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{children}</p>
    </div>
  );
}

function Questions({ title, questions }: { title: string; questions: Question[] }) {
  return (
    <section className="space-y-3 border-t border-rule pt-4">
      <p className="font-medium">{title}</p>
      <ol className="space-y-4">
        {questions.map((q, n) => (
          <li key={q.id} className="space-y-2 text-sm">
            <p className="font-medium">
              {n + 1}. {q.prompt}
            </p>
            <ul className="space-y-1">
              {q.options.map((o, i) => (
                <li key={i} className={i === q.answer ? "flex gap-2 font-medium text-positive" : "flex gap-2 pl-6 text-ink-2"}>
                  {i === q.answer && <Check className="h-4 w-4 shrink-0" />}
                  {o}
                </li>
              ))}
            </ul>
            <p className="rounded-lg bg-paper-2 px-3 py-2 text-ink-2">{q.explain}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
