import { body, formData, withMember } from "@/lib/mobile/api";
import { runFormAction } from "@/lib/mobile/form-action";
import { PROFILE_ERRORS, PROFILE_MESSAGES } from "@/app/members/profile/_data";
import { saveEmailPreferences } from "@/app/members/profile/actions";

/** { updates, activity }: the two optional email lists. Account, booking and payment emails are always sent. */
export const POST = withMember(async (req) => {
  const { updates, activity } = await body<{ updates: boolean; activity: boolean }>(req);
  const form = formData({ emailUpdates: updates ? "on" : undefined, emailActivity: activity ? "on" : undefined });
  return runFormAction(() => saveEmailPreferences(form), PROFILE_ERRORS, PROFILE_MESSAGES);
});
