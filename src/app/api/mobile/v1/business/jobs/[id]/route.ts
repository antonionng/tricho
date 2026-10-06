import { body, fail, formData, json, withMember } from "@/lib/mobile/api";
import { prisma } from "@/lib/prisma";
import { deleteJob, saveJob } from "@/app/members/business/actions";
import { businessAction, jobFields, ownerEmail } from "../../_outcome";

/** One of the business's roles, for editing. */
export const GET = withMember<{ id: string }>(async (_req, ctx, { id }) => {
  const email = ownerEmail(ctx);
  const page = email ? await prisma.partner.findUnique({ where: { ownerEmail: email }, select: { id: true } }) : null;
  const job = page ? await prisma.job.findFirst({ where: { id, partnerId: page.id } }) : null;
  if (!job) return fail(404, "We couldn't find that role. Please try again.");
  return json({
    id: job.id,
    slug: job.slug,
    title: job.title,
    employment: job.employment,
    workplace: job.workplace,
    location: job.location,
    country: job.country,
    pay: job.pay,
    summary: job.summary,
    description: job.description,
    applyEmail: job.applyEmail,
    applyUrl: job.applyUrl,
  });
});

/** Saves changes to a role. */
export const PATCH = withMember<{ id: string }>(async (req, _ctx, { id }) => {
  const b = await body<Record<string, string>>(req);
  return businessAction(() => saveJob({ attempt: 0 }, formData({ ...jobFields(b), id })));
});

/** Deletes a role. */
export const DELETE = withMember<{ id: string }>(async (_req, _ctx, { id }) => businessAction(() => deleteJob(formData({ id }))));
