import { body, fail, formData, json, withMember } from "@/lib/mobile/api";
import { captureRedirect } from "@/lib/mobile/form-action";
import { redirectParams } from "@/lib/mobile/redirect-outcome";
import { respondToReferral } from "@/app/members/referrals/actions";

/** Accepts or declines a referral: { decision: "accept" | "decline", note? }. Only the recipient can answer. */
export const POST = withMember<{ id: string }>(
  async (req, _ctx, { id }) => {
    const b = await body<{ decision: string; note: string }>(req);
    const { redirect } = await captureRedirect(() =>
      respondToReferral(formData({ id: id.slice(0, 64), decision: b.decision === "accept" ? "accept" : "decline", note: b.note }))
    );
    const params = redirectParams(redirect);
    const error = params.get("error");
    if (error) return fail(400, error.slice(0, 200));
    if (!params.get("answered")) return fail(404, "We could not find this referral.");
    return json({ ok: true });
  },
  { members: true }
);
