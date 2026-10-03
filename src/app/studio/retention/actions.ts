"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requirePermission } from "@/lib/staff";
import { isRetentionSegment, SEGMENT_INFO } from "@/lib/retention";
import { NUDGE_CAP, draftRetentionNudges, loadRetention, type NudgeOutcome } from "@/lib/retention-data";

function back(segment: string, notice: string, tone?: "danger"): never {
  const params = new URLSearchParams({ segment, notice });
  if (tone) params.set("tone", tone);
  redirect(`/studio/retention?${params.toString()}`);
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function describe(o: NudgeOutcome) {
  const parts = [
    o.created
      ? `${plural(o.created, "draft is", "drafts are")} waiting in the inbox for approval. Nothing has been sent.`
      : "No new drafts were needed.",
  ];
  if (o.existing) parts.push(`${plural(o.existing, "member already has", "members already have")} a nudge for this list this month.`);
  if (o.optedOut) parts.push(`${plural(o.optedOut, "member has", "members have")} opted out of optional emails, so they were left out.`);
  if (o.notInSegment) parts.push(`${plural(o.notInSegment, "member is", "members are")} no longer in this list.`);
  return parts.join(" ");
}

/** Draft one nudge, or one for everyone in the list (up to the cap). Never sends. */
export async function draftNudgesAction(form: FormData) {
  const staff = await requirePermission("members.edit");
  const segment = String(form.get("segment") ?? "");
  if (!isRetentionSegment(segment)) back("cancelling", "That list isn't recognised.", "danger");

  const one = String(form.get("userId") ?? "").slice(0, 64);
  const ids = one ? [one] : (await loadRetention()).rows.filter((r) => r.segments.includes(segment)).map((r) => r.id).slice(0, NUDGE_CAP);
  if (ids.length === 0) back(segment, "There is nobody in this list to write to.");

  const outcome = await draftRetentionNudges(segment, ids);
  await audit(staff, {
    action: "retention.draft",
    targetType: one ? "user" : "retention",
    targetId: one || segment,
    summary: `Drafted ${plural(outcome.created, "retention email", "retention emails")} for the ${SEGMENT_INFO[segment].label.toLowerCase()} list.`,
  });
  revalidatePath("/studio", "layout");
  back(segment, describe(outcome));
}
