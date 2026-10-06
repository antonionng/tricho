import { body, fail, formData, json, withMember } from "@/lib/mobile/api";
import { EMPLOYMENT, employmentLabel, JOB_DAYS, jobPhase, MAX_OPEN_JOBS, WORKPLACE, workplaceLabel } from "@/lib/jobs";
import { listBusinessJobs, loadJobPoster } from "@/app/members/business/_data";
import { saveJob } from "@/app/members/business/actions";
import { businessAction, jobFields, ownerEmail } from "../_outcome";

/** Every role the business has posted, and whether it can post now. */
export const GET = withMember(async (_req, ctx) => {
  const email = ownerEmail(ctx);
  if (!email) return fail(400, "Your account has no email address, so it cannot hold a business page.");
  const { page, active, ready } = await loadJobPoster(email);
  const jobs = page ? await listBusinessJobs(page.id) : [];
  const now = new Date();
  return json({
    ready,
    active,
    hasPage: !!page,
    pageName: page?.name ?? null,
    jobDays: JOB_DAYS,
    maxOpen: MAX_OPEN_JOBS,
    employment: Object.entries(EMPLOYMENT).map(([value, label]) => ({ value, label })),
    workplace: Object.entries(WORKPLACE).map(([value, label]) => ({ value, label })),
    jobs: jobs.map((job) => ({
      id: job.id,
      slug: job.slug,
      title: job.title,
      location: job.location,
      employment: job.employment,
      employmentLabel: employmentLabel(job.employment),
      workplaceLabel: workplaceLabel(job.workplace),
      phase: jobPhase(job, now),
      expiresAt: job.expiresAt,
      createdAt: job.createdAt,
    })),
  });
});

/** Posts a new role. It goes live at once and members are told about it. */
export const POST = withMember(async (req) => {
  const b = await body<Record<string, string>>(req);
  return businessAction(() => saveJob({ attempt: 0 }, formData(jobFields(b))));
});

