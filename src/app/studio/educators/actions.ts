"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/staff";
import { decideEducator, refundEducatorMembership, type EducatorDecision } from "@/lib/educators";
import { studioAction } from "../_lib/guard";

const DONE: Record<EducatorDecision, string> = {
  approve: "approved",
  reject: "rejected",
  suspend: "suspended",
  reinstate: "reinstated",
};

export async function decideEducatorAction(form: FormData) {
  const staff = await studioAction("courses.review");
  const id = String(form.get("id") ?? "").slice(0, 40);
  const decision = String(form.get("decision") ?? "") as EducatorDecision;
  if (!(decision in DONE)) redirect("/studio/educators");
  const note = String(form.get("note") ?? "").slice(0, 2000);
  const result = await decideEducator({ id, decision, note, reviewerId: staff.userId });
  if (!result.ok) redirect(`/studio/educators?notice=${encodeURIComponent(result.error)}&tone=danger#e-${id}`);

  let refundNote = "";
  if (decision === "reject" && form.get("refund") === "on") {
    const refund = await refundEducatorMembership(id).catch((error) => {
      console.error("[EDUCATOR_REFUND]", error);
      return { ok: false as const, error: "The refund didn't go through. Refund it in Stripe." };
    });
    refundNote = refund.ok ? (refund.refunded ? " Their fee has been refunded and the subscription cancelled." : " The subscription is cancelled; there was no payment to refund.") : ` ${refund.error}`;
  }
  await audit(staff, {
    action: `educator.${decision}`,
    targetType: "educator",
    targetId: id,
    summary: `${DONE[decision][0].toUpperCase()}${DONE[decision].slice(1)} ${result.profile.displayName} as an Educator.${refundNote}`,
  });
  revalidatePath("/studio/educators");
  redirect(`/studio/educators?notice=${encodeURIComponent(`${result.profile.displayName} is ${DONE[decision]}.${refundNote}`)}`);
}

export async function setEducatorShareAction(form: FormData) {
  const staff = await studioAction("courses.review");
  const id = String(form.get("id") ?? "").slice(0, 40);
  const pct = Math.round(Number(form.get("sharePct")));
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) redirect(`/studio/educators?notice=${encodeURIComponent("The share must be between 0 and 100.")}&tone=danger`);
  const before = await prisma.educatorProfile.findUnique({ where: { id }, select: { displayName: true, sharePct: true } });
  if (!before) redirect("/studio/educators");
  await prisma.educatorProfile.update({ where: { id }, data: { sharePct: pct } });
  await audit(staff, {
    action: "educator.share",
    targetType: "educator",
    targetId: id,
    summary: `Changed ${before.displayName}'s share of course sales from ${before.sharePct}% to ${pct}%.`,
    before: { sharePct: before.sharePct },
    after: { sharePct: pct },
  });
  revalidatePath("/studio/educators");
  redirect(`/studio/educators?notice=${encodeURIComponent(`${before.displayName} now receives ${pct}% of each sale.`)}#e-${id}`);
}
