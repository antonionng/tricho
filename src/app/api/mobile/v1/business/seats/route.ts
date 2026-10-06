import { body, formData, withMember } from "@/lib/mobile/api";
import { addSeat } from "@/app/members/business/actions";
import { businessAction } from "../_outcome";

/** Gives a team member one of the business's Professional seats: { email }. They are emailed straight away. */
export const POST = withMember(async (req) => {
  const b = await body<{ email: string }>(req);
  return businessAction(() => addSeat(formData({ email: b.email })));
});
