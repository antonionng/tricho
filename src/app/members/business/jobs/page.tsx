import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Plus } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, MemberPage, PageHeader } from "@/components/members/MemberPage";
import { shortDate } from "@/components/members/format";
import { prisma } from "@/lib/prisma";
import { employmentLabel, JOB_DAYS, MAX_OPEN_JOBS } from "@/lib/jobs";
import { deleteJob, setJobOpen } from "../actions";
import { loadPoster, Notices } from "./_shared";

export const metadata = { title: "Your job posts" };

function jobState(job: { status: string; hiddenAt: Date | null; expiresAt: Date }, now: Date) {
  if (job.hiddenAt) return { label: "Taken down by Trichollective", live: false };
  if (job.status === "closed") return { label: "Closed", live: false };
  if (job.expiresAt <= now) return { label: "Ended", live: false };
  return { label: `Live until ${shortDate(job.expiresAt)}`, live: true };
}

export default async function BusinessJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; message?: string }>;
}) {
  const { page, active } = await loadPoster("/members/business/jobs");
  const { saved, error, message } = await searchParams;
  const jobs = page ? await prisma.job.findMany({ where: { partnerId: page.id }, orderBy: { createdAt: "desc" } }) : [];
  const now = new Date();
  const ready = !!page?.published && !page.hidden && active;

  return (
    <MemberPage size="narrow">
      <Link href="/members/business" className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Your business
      </Link>
      <PageHeader
        label="Job posts"
        title="Hire people already trained in hair and scalp care."
        lede={`Your roles show on the jobs board and on your business page, members are told when you post one, and each role stays up for ${JOB_DAYS} days.`}
      />

      <Notices saved={saved} error={error} message={message} />

      {!ready ? (
        <Card className="p-5 sm:p-6">
          <p className="text-[15px] leading-relaxed text-ink-2">
            {!active
              ? "Posting roles is part of the Business plan, so you can post as soon as your plan is active."
              : "Publish your business page first, so candidates can see who they would be working for."}
          </p>
          <Button asChild className="mt-4">
            <Link href={!active ? "/for-business#compare" : "/members/business"}>{!active ? "See the Business plan" : "Finish your page"}</Link>
          </Button>
        </Card>
      ) : (
        <Button asChild size="lg" className="mb-6">
          <Link href="/members/business/jobs/new">
            <Plus /> Post a role
          </Link>
        </Button>
      )}

      {jobs.length === 0 ? (
        ready && <EmptyState title="You haven't posted a role yet" body={`You can have up to ${MAX_OPEN_JOBS} roles open at once.`} />
      ) : (
        <ul className="mt-2 flex flex-col gap-3">
          {jobs.map((job) => {
            const state = jobState(job, now);
            return (
              <li key={job.id}>
                <Card className="flex flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Pill tone={state.live ? "positive" : undefined}>{state.label}</Pill>
                    <Pill>{employmentLabel(job.employment)}</Pill>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold leading-snug tracking-[-0.01em]">{job.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {job.location} · posted {shortDate(job.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/members/business/jobs/${job.id}`}>Edit</Link>
                    </Button>
                    {state.live && (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/jobs/${job.slug}`}>
                          View <ArrowUpRight />
                        </Link>
                      </Button>
                    )}
                    {!job.hiddenAt && (
                      <form action={setJobOpen}>
                        <input type="hidden" name="id" value={job.id} />
                        <input type="hidden" name="open" value={state.live ? "0" : "1"} />
                        <Button type="submit" size="sm" variant="outline">
                          {state.live ? "Close the role" : `Reopen for ${JOB_DAYS} days`}
                        </Button>
                      </form>
                    )}
                    <form action={deleteJob}>
                      <input type="hidden" name="id" value={job.id} />
                      <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                        Delete
                      </Button>
                    </form>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </MemberPage>
  );
}
