import { withMember } from "@/lib/mobile/api";
import { requestForm, runFormAction } from "@/lib/mobile/form-action";
import { PROFILE_ERRORS, PROFILE_MESSAGES } from "@/app/members/profile/_data";
import { saveProfilePhotoAction } from "@/app/members/profile/actions";

/** Multipart: `photo` to upload a new profile photo, or `removePhoto=on` to remove the current one. */
export const POST = withMember(async (req) => {
  const form = await requestForm(req);
  return runFormAction(() => saveProfilePhotoAction(form), PROFILE_ERRORS, PROFILE_MESSAGES);
});
