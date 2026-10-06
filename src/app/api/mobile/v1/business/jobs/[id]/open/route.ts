import { body, formData, withMember } from "@/lib/mobile/api";
import { setJobOpen } from "@/app/members/business/actions";
import { businessAction } from "../../../_outcome";

/** Closes a role ({ open: false }) or reopens it for another 60 days ({ open: true }). */
export const POST = withMember<{ id: string }>(async (req, _ctx, { id }) => {
  const b = await body<{ open: boolean }>(req);
  return businessAction(() => setJobOpen(formData({ id, open: b.open ? "1" : "0" })));
});
