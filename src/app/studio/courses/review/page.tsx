import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Empty, NoAccess, Notice, PageHeader, Section, Tag, dateOnly } from "@/components/studio/ui";
import { studioPage } from "../../_lib/guard";

const DECIDED: Record<string, { label: string; tone: "positive" | "warn" | "danger" | "default" }> = {
  approved: { label: "Approved", tone: "positive" },
  superseded: { label: "Approved, since replaced", tone: "default" },
  changes_requested: { label: "Changes asked for", tone: "warn" },
  rejected: { label: "Rejected", tone: "danger" },
};

export default async function CourseReviewQueuePage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  if (!(await studioPage("/studio/courses/review", "courses.review"))) return <NoAccess what="course reviews" />;
  const { notice } = await searchParams;
  const [waiting, recent] = await Promise.all([
    prisma.courseVersion.findMany({
      where: { status: "submitted" },
      orderBy: { submittedAt: "asc" },
      include: { course: { select: { title: true, educatorId: true, publishedVersionId: true } } },
    }),
    prisma.courseVersion.findMany({
      where: { status: { not: "submitted" } },
      orderBy: { reviewedAt: "desc" },
      take: 20,
      include: { course: { select: { title: true } } },
    }),
  ]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Course reviews"
        intro="Every course is read in full before it goes on sale, and again whenever it changes. Check it is accurate, stays within each learner's scope of practice and reads in the Trichollective voice."
      />
      {notice && <Notice>{notice}</Notice>}
      <Section title="Waiting for review">
        {waiting.length === 0 ? (
          <Empty>Nothing is waiting for review.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {waiting.map((v) => (
              <li key={v.id}>
                <Link href={`/studio/courses/review/${v.id}`} className="flex flex-col gap-1 p-4 hover:bg-paper-2 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    <span className="block font-medium">{v.course.title}</span>
                    <span className="block text-sm text-muted-foreground">
                      Version {v.number} · sent {dateOnly(v.submittedAt)} · {v.course.educatorId ? "an educator's course" : "a Trichollective course"}
                    </span>
                  </span>
                  <Tag tone={v.course.publishedVersionId ? "default" : "warn"}>{v.course.publishedVersionId ? "Update to a live course" : "New course"}</Tag>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Recently reviewed">
        {recent.length === 0 ? (
          <Empty>No reviews yet.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {recent.map((v) => (
              <li key={v.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <Link href={`/studio/courses/review/${v.id}`} className="font-medium underline-offset-4 hover:underline">
                    {v.course.title}
                  </Link>
                  <span className="block text-sm text-muted-foreground">
                    Version {v.number} · reviewed {dateOnly(v.reviewedAt)}
                  </span>
                </span>
                <Tag tone={DECIDED[v.status]?.tone ?? "default"}>{DECIDED[v.status]?.label ?? v.status}</Tag>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
