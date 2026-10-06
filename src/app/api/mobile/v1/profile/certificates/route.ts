import { body, formData, json, withMember } from "@/lib/mobile/api";
import { setCertificateOnProfile } from "@/app/members/courses/[slug]/actions";

/** { id, show }: shows or hides a course badge on the member's profiles. */
export const POST = withMember(async (req) => {
  const { id, show } = await body<{ id: string; show: boolean }>(req);
  await setCertificateOnProfile(formData({ id, show: show ? "1" : "0" }));
  return json({ ok: true });
});
