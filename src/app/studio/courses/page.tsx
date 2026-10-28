import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Empty, Notice, NoAccess, PageHeader, Section, Stat, Tag, dateOnly } from "@/components/studio/ui";
import { formatMoney } from "@/lib/mail/templates/billing";
import { courses } from "@/content/courses";
import { lessonsOf } from "@/lib/courses";
import { studioPage } from "../_lib/guard";
import { setCertificateWithdrawnAction } from "./actions";

export default async function StudioCoursesPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  if (!(await studioPage("/studio/courses", "members.view"))) return <NoAccess what="courses" />;
  const { notice } = await searchParams;

  const [enrolments, certificates] = await Promise.all([
    prisma.courseEnrolment.findMany({
      where: { status: { in: ["active", "refunded"] } },
      orderBy: { activatedAt: "desc" },
      take: 300,
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { lessons: { where: { completedAt: { not: null } } } } },
        certificate: { select: { id: true } },
      },
    }),
    prisma.certificate.findMany({ orderBy: { issuedAt: "desc" }, take: 200 }),
  ]);

  const stats = courses.map((c) => {
    const rows = enrolments.filter((e) => e.courseSlug === c.slug && e.status === "active");
    const revenue = rows.reduce((sum, e) => sum + e.amount, 0);
    return { course: c, enrolled: rows.length, completed: rows.filter((e) => e.certificate).length, revenue };
  });

  return (
    <div className="space-y-10">
      <PageHeader
        title="Courses"
        intro="Who has enrolled on each course, how far they've got and the certificates issued. Withdraw a certificate if it was issued in error; its public page then says so, and it leaves the holder's profile."
      />
      {notice && <Notice>{notice}</Notice>}

      <div className="grid gap-3 md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.course.slug} className="flex flex-col gap-3 rounded-2xl border border-rule bg-card p-4">
            <p className="font-medium leading-snug">{s.course.title}</p>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Enrolled" value={s.enrolled} />
              <Stat label="Completed" value={s.completed} />
              <Stat label="Paid" value={formatMoney(s.revenue, "gbp")} />
            </div>
            {!s.course.reviewer && <Tag tone="warn">No named reviewer yet</Tag>}
            <Link href={`/members/courses/${s.course.slug}`} className="text-sm underline underline-offset-4">
              Read the course as a learner
            </Link>
          </div>
        ))}
      </div>

      <Section title="Enrolments">
        {enrolments.length === 0 ? (
          <Empty>No one has enrolled on a course yet.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {enrolments.map((e) => {
              const course = courses.find((c) => c.slug === e.courseSlug);
              const total = lessonsOf(e.courseSlug)?.lessons.length ?? 0;
              return (
                <li key={e.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">
                      <Link href={`/studio/members/${e.user.id}`} className="underline underline-offset-4">
                        {e.user.name || e.user.email}
                      </Link>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {course?.title ?? e.courseSlug} · enrolled {dateOnly(e.activatedAt ?? e.createdAt)} ·{" "}
                      {e.amount > 0 ? `${formatMoney(e.amount, e.currency)} (${e.priceType} price)` : "free"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    {e.status === "refunded" && <Tag tone="danger">Refunded</Tag>}
                    {e.certificate ? (
                      <Tag tone="positive">Certificate {e.certificate.id}</Tag>
                    ) : (
                      <Tag>
                        {e._count.lessons} of {total} lessons
                      </Tag>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Certificates">
        {certificates.length === 0 ? (
          <Empty>No certificates have been issued yet.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {certificates.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {c.withdrawnAt ? <Tag tone="danger">Withdrawn</Tag> : <Tag tone="positive">Valid</Tag>}
                    {!c.showOnProfile && <Tag>Hidden from profile</Tag>}
                  </div>
                  <p className="mt-1.5 font-medium">
                    {c.holderName}, {c.courseTitle}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <Link href={`/certificates/${c.id}`} className="font-mono underline underline-offset-4">
                      {c.id}
                    </Link>{" "}
                    · issued {dateOnly(c.issuedAt)} · scored {c.score} of {c.total}
                    {c.withdrawnNote ? ` · ${c.withdrawnNote}` : ""}
                  </p>
                </div>
                <form action={setCertificateWithdrawnAction} className="flex shrink-0 items-center gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="withdraw" value={c.withdrawnAt ? "0" : "1"} />
                  {!c.withdrawnAt && (
                    <input name="note" placeholder="Reason (shown to the holder)" className="h-9 w-56 rounded-lg border border-rule bg-paper px-3 text-sm" />
                  )}
                  <Button type="submit" size="sm" variant={c.withdrawnAt ? "outline" : "ghost"} className={c.withdrawnAt ? "" : "text-destructive"}>
                    {c.withdrawnAt ? "Restore" : "Withdraw"}
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
