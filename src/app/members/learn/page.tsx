import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight, Award, Newspaper, Sparkles } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Paywall } from "@/components/members/Paywall";
import { EmptyState, MemberPage, PageHeader, SectionLabel } from "@/components/members/MemberPage";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { courseBySlug, courses } from "@/content/courses";
import { progressOf } from "@/lib/courses";
import { ProgressRing } from "@/components/courses/ProgressRing";
import { images, img } from "@/content/images";

export const metadata = { title: "Learn" };

const AUDIENCE: Record<string, string> = {
  everyone: "Everyone",
  cosmetic: "Cosmetic",
  clinical: "Clinical",
  medical: "Medical",
  brand: "Business",
};

export default async function LearnPage() {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/learn");
  const userId = ctx.session.user.id;
  const enrolments = await prisma.courseEnrolment.findMany({
    where: { userId, status: "active" },
    orderBy: { updatedAt: "desc" },
    include: { lessons: { select: { lessonSlug: true, completedAt: true } }, certificate: true },
  });
  // People who bought a course without joining can still reach their courses here.
  if (!ctx.allowed && enrolments.length === 0) {
    return <Paywall title="Learn" body="The library and member prices on courses are part of membership." />;
  }

  const pieces = ctx.allowed
    ? await prisma.educationPiece.findMany({
        where: { published: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      })
    : [];
  const mine = enrolments
    .map((e) => ({ e, course: courseBySlug(e.courseSlug), progress: progressOf(e.courseSlug, e.lessons, e.lastLessonSlug) }))
    .filter((m): m is typeof m & { course: NonNullable<typeof m.course> } => !!m.course);
  const enrolledSlugs = new Set(mine.map((m) => m.course.slug));
  const earned = mine.filter((m) => m.e.certificate && !m.e.certificate.withdrawnAt);
  const cpdHours = earned.reduce((sum, m) => sum + m.e.certificate!.hours, 0);
  const preferred = ctx.profession || "everyone";
  const rank = (a: string) => (a === preferred ? 0 : a === "everyone" ? 1 : 2);
  const sorted = [...pieces].sort((a, b) => rank(a.audience) - rank(b.audience) || a.sortOrder - b.sortOrder);
  const sortedCourses = [...courses].sort(
    (a, b) => Number(b.discipline === ctx.profession) - Number(a.discipline === ctx.profession)
  );

  return (
    <MemberPage>
      <PageHeader
        label="Learn"
        title="Learn"
        lede="Short, careful pieces you can use this week, and courses written with practitioners from each discipline."
      />

      {ctx.allowed && (
      <div className="mb-10 grid gap-3 sm:grid-cols-2">
        <Link
          href="/members/trichozette"
          className="group flex items-start gap-4 rounded-2xl border border-rule bg-card p-5 transition-colors hover:border-ink/30"
        >
          <Newspaper className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.6]" />
          <span className="min-w-0">
            <span className="block font-semibold">Trichozette</span>
            <span className="mt-1 block text-sm leading-relaxed text-ink-2">
              Read the monthly edition on research, practice and news from across the collective.
            </span>
          </span>
        </Link>
        <Link
          href="/members/assistant"
          className="group flex items-start gap-4 rounded-2xl border border-rule bg-card p-5 transition-colors hover:border-ink/30"
        >
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.6]" />
          <span className="min-w-0">
            <span className="block font-semibold">Assistant</span>
            <span className="mt-1 block text-sm leading-relaxed text-ink-2">
              Ask a question about hair and scalp practice and get a careful, considered answer straight away.
            </span>
          </span>
        </Link>
      </div>
      )}

      {mine.length > 0 && (
        <section className="mb-12">
          <SectionLabel action={cpdHours > 0 ? <span className="text-[13px] text-muted-foreground">{cpdHours} hours of CPD completed</span> : undefined}>
            Your courses
          </SectionLabel>
          <ul className="flex flex-col gap-3">
            {mine.map(({ e, course, progress }) => {
              const certificate = e.certificate && !e.certificate.withdrawnAt ? e.certificate : null;
              const href = certificate ? `/members/courses/${course.slug}/certificate` : `/members/courses/${course.slug}`;
              return (
                <li key={e.id}>
                  <Link href={href} className="group flex items-center gap-4 rounded-2xl border border-rule bg-card p-4 transition-colors hover:border-ink/30 sm:p-5">
                    {certificate ? (
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
                        <Award className="h-6 w-6 stroke-[1.4]" aria-hidden />
                      </span>
                    ) : (
                      <ProgressRing percent={progress.percent} size={56} />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-snug">{course.title}</span>
                      <span className="mt-1 block text-sm text-ink-2">
                        {certificate
                          ? `Completed. Certificate ${certificate.id}, ${certificate.hours} hours CPD.`
                          : progress.done === progress.total
                            ? "Every lesson done. The final assessment is ready for you."
                            : `${progress.done} of ${progress.total} lessons complete.`}
                      </span>
                    </span>
                    <span className="hidden shrink-0 items-center gap-1.5 text-sm font-medium sm:inline-flex">
                      {certificate ? "Certificate" : progress.done === 0 ? "Start" : "Continue"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mb-12">
        <SectionLabel>Courses</SectionLabel>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCourses.map((c) => (
            <li key={c.slug}>
              <Link
                href={enrolledSlugs.has(c.slug) ? `/members/courses/${c.slug}` : `/courses/${c.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-rule bg-card transition-colors hover:border-ink/30"
              >
                <div className="relative aspect-[16/9] bg-paper-2">
                  <Image
                    src={img(images[c.imageKey], 640)}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 100vw"
                    className="object-cover grayscale-[20%]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {enrolledSlugs.has(c.slug) ? (
                      <Pill tone="ink">Enrolled</Pill>
                    ) : c.status === "coming-soon" ? (
                      <Pill>Opening soon</Pill>
                    ) : (
                      <Pill tone="positive">Open</Pill>
                    )}
                    <Pill>{c.hours} hours</Pill>
                  </div>
                  <h3 className="mt-3 font-semibold leading-snug">{c.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-ink-2">{c.summary}</p>
                  <p className="mt-auto flex items-center justify-between pt-4 text-sm">
                    <span className="text-muted-foreground">
                      {c.memberPriceGBP === 0 ? "Free for members" : `£${c.memberPriceGBP} for members`}
                    </span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {ctx.allowed && (
      <section>
        <SectionLabel>The library</SectionLabel>
        {sorted.length === 0 ? (
          <EmptyState
            title="The library is being written"
            body="Pieces are reviewed by a practitioner before they appear here. The first few are on their way."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {sorted.map((piece) => (
              <li key={piece.id}>
                <Link
                  href={`/members/learn/${piece.id}`}
                  className="flex h-full flex-col rounded-2xl border border-rule bg-card p-5 transition-colors hover:border-ink/30"
                >
                  <div className="flex flex-wrap gap-1.5">
                    <Pill>{AUDIENCE[piece.audience] ?? piece.audience}</Pill>
                    <Pill className="capitalize">{piece.kind}</Pill>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold leading-snug tracking-[-0.01em]">{piece.title}</h3>
                  <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink-2">{piece.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      )}
    </MemberPage>
  );
}
