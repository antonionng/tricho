import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Empty, Notice, NoAccess, PageHeader, Tag, dateOnly } from "@/components/studio/ui";
import { employmentLabel } from "@/lib/jobs";
import { studioPage } from "../_lib/guard";
import { setJobHiddenAction } from "./actions";

export default async function StudioJobsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  if (!(await studioPage("/studio/jobs", "partners.view"))) return <NoAccess what="job posts" />;
  const { notice } = await searchParams;
  const now = new Date();
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { partner: { select: { id: true, name: true, published: true, hidden: true } } },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Job posts"
        intro="Roles posted by businesses on the Business or Premium plan. They go live as soon as they are posted, so check new ones here and take down anything that doesn't belong."
      />
      {notice && <Notice>{notice}</Notice>}
      {jobs.length === 0 ? (
        <Empty>No roles have been posted yet.</Empty>
      ) : (
        <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
          {jobs.map((job) => {
            const live = !job.hiddenAt && job.status === "open" && job.expiresAt > now && job.partner.published && !job.partner.hidden;
            return (
              <li key={job.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {job.hiddenAt ? <Tag tone="danger">Taken down</Tag> : live ? <Tag tone="positive">Live</Tag> : <Tag>{job.status === "closed" ? "Closed" : "Not showing"}</Tag>}
                    <Tag>{employmentLabel(job.employment)}</Tag>
                  </div>
                  <p className="mt-1.5 font-medium">{job.title}</p>
                  <p className="text-sm text-muted-foreground">
                    <Link href={`/studio/partners/${job.partner.id}`} className="underline underline-offset-4">
                      {job.partner.name}
                    </Link>{" "}
                    · {job.location} · posted {dateOnly(job.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {live && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/jobs/${job.slug}`}>View</Link>
                    </Button>
                  )}
                  <form action={setJobHiddenAction}>
                    <input type="hidden" name="id" value={job.id} />
                    <input type="hidden" name="hide" value={job.hiddenAt ? "0" : "1"} />
                    <Button type="submit" size="sm" variant={job.hiddenAt ? "outline" : "ghost"} className={job.hiddenAt ? "" : "text-destructive"}>
                      {job.hiddenAt ? "Restore" : "Take down"}
                    </Button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
