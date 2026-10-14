import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Empty, Notice, NoAccess, PageHeader, Section, Stat, Tag, dateOnly } from "@/components/studio/ui";
import { formatMoney } from "@/lib/mail/templates/billing";
import { getContent, listCourses } from "@/lib/course-catalogue";
import { studioPage } from "../_lib/guard";
import { createCourseAction, refundSaleAction, setCertificateWithdrawnAction } from "./actions";
import { totals } from "@/lib/revenue-split";

const money = (pence: number) => formatMoney(pence, "gbp") ?? "£0.00";

const STATE_LABEL: Record<string, { label: string; tone: "default" | "ink" | "positive" | "warn" | "danger" }> = {
  draft: { label: "Draft", tone: "default" },
  in_review: { label: "Waiting for review", tone: "warn" },
  published: { label: "On sale", tone: "positive" },
  unlisted: { label: "Off sale", tone: "default" },
};

export default async function StudioCoursesPage({ searchParams }: { searchParams: Promise<{ notice?: string; tone?: string }> }) {
  const staff = await studioPage("/studio/courses", "courses.view");
  if (!staff) return <NoAccess what="courses" />;
  const { notice, tone } = await searchParams;
  const canEdit = staff.perms.has("courses.edit");

  const canRefund = staff.perms.has("courses.review");
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const sales = await prisma.courseSale
    .findMany({ orderBy: { createdAt: "desc" }, take: 500, include: { educator: { select: { id: true, displayName: true } } } })
    .catch(() => []);
  const allTotals = totals(sales);
  const monthTotals = totals(sales.filter((x) => x.createdAt >= monthStart));
  const byEducator = new Map<string, { name: string; rows: (typeof sales)[number][] }>();
  for (const x of sales) {
    const key = x.educator?.id ?? "own";
    const group = byEducator.get(key) ?? { name: x.educator?.displayName ?? "Trichollective's own courses", rows: [] };
    group.rows.push(x);
    byEducator.set(key, group);
  }
  const [enrolments, certificates, built, waiting, courses] = await Promise.all([
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
    prisma.course
      .findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, slug: true, title: true, status: true, educatorId: true, updatedAt: true, _count: { select: { versions: true } } } })
      .catch(() => []),
    prisma.courseVersion.count({ where: { status: "submitted" } }).catch(() => 0),
    listCourses({ includeClosed: true }),
  ]);
  const lessonCounts = new Map(await Promise.all(courses.map(async (c) => [c.slug, (await getContent(c.slug))?.lessons.length ?? 0] as const)));

  const stats = courses.map((c) => {
    const rows = enrolments.filter((e) => e.courseSlug === c.slug && e.status === "active");
    const revenue = rows.reduce((sum, e) => sum + e.amount, 0);
    return { course: c, enrolled: rows.length, completed: rows.filter((e) => e.certificate).length, revenue };
  });

  return (
    <div className="space-y-10">
      <PageHeader
        title="Courses"
        intro="Build courses, review them before they go on sale, and see who has enrolled, how far they've got and the certificates issued."
        actions={
          <Button asChild variant={waiting ? "default" : "outline"}>
            <Link href="/studio/courses/review">Review queue{waiting ? ` (${waiting})` : ""}</Link>
          </Button>
        }
      />
      {notice && <Notice tone={tone === "danger" ? "danger" : "default"}>{notice}</Notice>}

      <Section title="Course builder" intro="Courses written on the site. Nothing reaches learners until a version has been reviewed and approved.">
        {canEdit && (
          <form action={createCourseAction} className="mb-4 flex flex-col gap-2 rounded-2xl border border-rule bg-card p-4 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="new-course-title">
              New course title
            </label>
            <input
              id="new-course-title"
              name="title"
              required
              minLength={3}
              maxLength={160}
              placeholder="Title of a new course"
              className="h-10 flex-1 rounded-lg border border-rule bg-paper px-3 text-sm"
            />
            <Button type="submit">Start a new course</Button>
          </form>
        )}
        {built.length === 0 ? (
          <Empty>No courses have been built here yet.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {built.map((c) => (
              <li key={c.id}>
                <Link href={`/studio/courses/${c.id}`} className="flex flex-col gap-1 p-4 hover:bg-paper-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0">
                    <span className="block font-medium">{c.title}</span>
                    <span className="block text-sm text-muted-foreground">
                      {c.educatorId ? "Educator's course" : "Trichollective course"} · {c._count.versions} {c._count.versions === 1 ? "version" : "versions"} sent for review · edited {dateOnly(c.updatedAt)}
                    </span>
                  </span>
                  <Tag tone={STATE_LABEL[c.status]?.tone ?? "default"}>{STATE_LABEL[c.status]?.label ?? c.status}</Tag>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Sales"
        intro="Every paid course place, how it was split and where the money went. Educators' shares are transferred by Stripe when the learner pays."
        actions={
          canRefund && sales.length ? (
            <Button asChild variant="outline" size="sm">
              <a href="/studio/courses/sales.csv">Download CSV</a>
            </Button>
          ) : undefined
        }
      >
        <div id="sales" className="scroll-mt-20" />
        {sales.length === 0 ? (
          <Empty>No course places have been sold yet.</Empty>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Paid by learners, this month" value={money(monthTotals.gross)} note={`${monthTotals.sales} sales`} />
              <Stat label="Paid by learners, all time" value={money(allTotals.gross)} note={`${allTotals.sales} sales`} />
              <Stat label="Educators' share" value={money(allTotals.educator)} note="After refunds" />
              <Stat label="Trichollective keeps" value={money(allTotals.net)} note={`After ${money(allTotals.stripeFees)} Stripe fees and ${money(allTotals.refunded)} refunds`} />
            </div>
            <div className="overflow-x-auto rounded-2xl border border-rule bg-card">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-rule text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Who</th>
                    <th className="px-4 py-2.5 font-medium">Sales</th>
                    <th className="px-4 py-2.5 font-medium">Paid by learners</th>
                    <th className="px-4 py-2.5 font-medium">To the educator</th>
                    <th className="px-4 py-2.5 font-medium">Kept, after fees and refunds</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {[...byEducator.values()].map((g) => {
                    const t = totals(g.rows);
                    return (
                      <tr key={g.name}>
                        <td className="px-4 py-2.5 font-medium">{g.name}</td>
                        <td className="px-4 py-2.5 tabular-nums">{t.sales}</td>
                        <td className="px-4 py-2.5 tabular-nums">{money(t.gross)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{money(t.educator)}</td>
                        <td className="px-4 py-2.5 tabular-nums">{money(t.net)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <details>
              <summary className="cursor-pointer text-sm text-muted-foreground">Recent sales and refunds</summary>
              <ul className="mt-2 divide-y divide-rule rounded-2xl border border-rule bg-card">
                {sales.slice(0, 50).map((x) => (
                  <li key={x.id} className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      {x.courseSlug} · {dateOnly(x.createdAt)} · {money(x.gross)} ({x.priceType})
                      {x.educator ? ` · ${money(x.educatorAmount)} to ${x.educator.displayName}` : ""}
                      {x.stripeFee != null ? ` · Stripe fee ${money(x.stripeFee)}` : ""}
                    </span>
                    <span className="flex items-center gap-2">
                      {x.status !== "paid" && <Tag tone={x.status === "disputed" ? "danger" : "default"}>{x.status.replace("_", " ")}</Tag>}
                      {canRefund && x.refundedAmount < x.gross && x.status !== "disputed" && (
                        <form action={refundSaleAction}>
                          <input type="hidden" name="id" value={x.id} />
                          <button type="submit" className="rounded-full px-3 py-1 text-destructive hover:bg-destructive/5">
                            Refund
                          </button>
                        </form>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </Section>

      <div className="grid gap-3 xl:grid-cols-3">
        {stats.map((s) => (
          <div key={s.course.slug} className="flex flex-col gap-3 rounded-2xl border border-rule bg-card p-4">
            <p className="font-medium leading-snug">{s.course.title}</p>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Enrolled" value={s.enrolled} />
              <Stat label="Completed" value={s.completed} />
              <Stat label="Paid" value={formatMoney(s.revenue, "gbp")} />
            </div>
            {s.course.source === "static" && !s.course.reviewer && <Tag tone="warn">No named reviewer yet</Tag>}
            {s.course.status === "closed" && <Tag>Off sale</Tag>}
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
              const total = lessonCounts.get(e.courseSlug) ?? 0;
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
