import { formData, withMember } from "@/lib/mobile/api";
import { runFormAction } from "@/lib/mobile/form-action";
import { VERIFICATION_ERRORS } from "@/app/members/profile/verification/applicant";
import { withdrawVerificationAction } from "@/app/members/profile/verification/actions";

/** Withdraws a request that has not been reviewed yet, and deletes its document. */
export const DELETE = withMember<{ id: string }>(async (_req, _ctx, { id }) =>
  runFormAction(() => withdrawVerificationAction(formData({ id })), VERIFICATION_ERRORS)
);
