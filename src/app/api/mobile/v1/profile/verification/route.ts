import { fail, json, withMember } from "@/lib/mobile/api";
import { requestForm, runFormAction } from "@/lib/mobile/form-action";
import { MAX_PENDING_REQUESTS, statusSentence, statusSummary, verificationKindLabel, VERIFICATION_KINDS } from "@/lib/verification";
import { loadApplicant, loadVerificationRequests, VERIFICATION_ERRORS } from "@/app/members/profile/verification/applicant";
import { submitVerificationAction } from "@/app/members/profile/verification/actions";

/** The verified badge: whether the member can apply, where they stand and the documents they have sent. */
export const GET = withMember(async (_req, ctx) => {
  const applicant = await loadApplicant(ctx);
  if (!applicant) return fail(404, "We couldn't find your account.");
  const requests = await loadVerificationRequests(applicant.userId);
  const summary = statusSummary(requests, applicant.isVerified);
  return json({
    eligible: applicant.eligible,
    isVerified: applicant.isVerified,
    hasListing: applicant.hasListing,
    summary,
    sentence: statusSentence(summary),
    maxPending: MAX_PENDING_REQUESTS,
    pending: requests.filter((r) => r.status === "pending").length,
    limitMessage: VERIFICATION_ERRORS.limit,
    kinds: VERIFICATION_KINDS.map(({ id, label, description }) => ({ id, label, description })),
    requests: requests.map((r) => ({
      id: r.id,
      kind: r.kind,
      kindLabel: verificationKindLabel(r.kind),
      title: r.title,
      fileUrl: r.fileId ? `/api/files/${r.fileId}` : null,
      status: r.status,
      reviewNote: r.reviewNote,
      reviewedAt: r.reviewedAt,
      createdAt: r.createdAt,
    })),
  });
});

/** Multipart: `kind`, `title`, `file` and an optional `note`, as on the website. */
export const POST = withMember(async (req, ctx) => {
  const applicant = await loadApplicant(ctx);
  if (!applicant?.eligible) return fail(403, "Verification is open to Professional and Business members, and to practitioners with a directory listing.");
  const form = await requestForm(req);
  return runFormAction(() => submitVerificationAction(form), VERIFICATION_ERRORS);
});
