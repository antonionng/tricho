"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/staff";
import { studioAction } from "../_lib/guard";
import { storeUpload } from "@/lib/storage";
import { createCourse, reviewVersion, saveDraft, setListed, submitForReview, type SaveResult } from "@/lib/course-builder";
import { DECISION_LABEL } from "@/lib/course-review";
import { refundSale } from "@/lib/course-ledger";
import { startDraftFromForm } from "@/lib/course-draft-start";

/**
 * Withdraws a certificate (it then shows as withdrawn on its public page and
 * leaves the holder's profile), or restores one.
 */
export async function setCertificateWithdrawnAction(form: FormData) {
  const staff = await studioAction("members.edit");
  const id = String(form.get("id") ?? "").slice(0, 32);
  const withdraw = form.get("withdraw") === "1";
  const note = String(form.get("note") ?? "").trim().slice(0, 300) || null;
  const certificate = await prisma.certificate.findUnique({ where: { id } });
  if (!certificate) redirect("/studio/courses");
  await prisma.certificate.update({
    where: { id },
    data: withdraw ? { withdrawnAt: new Date(), withdrawnNote: note } : { withdrawnAt: null, withdrawnNote: null },
  });
  await audit(staff, {
    action: withdraw ? "certificate.withdraw" : "certificate.restore",
    targetType: "certificate",
    targetId: id,
    summary: `${withdraw ? "Withdrew" : "Restored"} ${certificate.holderName}'s certificate for "${certificate.courseTitle}"${withdraw && note ? `: ${note}` : ""}.`,
  });
  revalidatePath("/studio/courses");
  revalidatePath(`/certificates/${id}`);
  revalidatePath(`/members/people/${certificate.userId}`);
  revalidatePath("/directory", "layout");
  redirect(`/studio/courses?notice=${encodeURIComponent(withdraw ? `Certificate ${id} is withdrawn.` : `Certificate ${id} is restored.`)}`);
}

/** Starts a new course in the builder. Courses made here belong to Trichollective. */
export async function createCourseAction(form: FormData) {
  const staff = await studioAction("courses.edit");
  const result = await createCourse({ title: String(form.get("title") ?? ""), createdById: staff.userId });
  if (!result.ok) redirect(`/studio/courses?notice=${encodeURIComponent(result.error)}&tone=danger`);
  await audit(staff, { action: "course.create", targetType: "course", targetId: result.id, summary: `Started a new course, "${String(form.get("title")).trim()}".` });
  redirect(`/studio/courses/${result.id}`);
}

/** Saves the builder's draft. Called from the builder, not a form. */
export async function saveCourseDraftAction(id: string, payload: { meta: unknown; content: unknown }): Promise<SaveResult> {
  let staff;
  try {
    staff = await studioAction("courses.edit");
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "You can't edit courses." };
  }
  // The first time the team edits an educator's course, note who built it (once, not on every autosave).
  const marked = await prisma.course.updateMany({ where: { id, educatorId: { not: null }, builtById: null }, data: { builtById: staff.userId } });
  if (marked.count) {
    await audit(staff, { action: "course.edit_for_educator", targetType: "course", targetId: id, summary: "Started editing an educator's course on their behalf." });
  }
  return saveDraft(id, payload);
}

export type UploadState = { ok: true; fileId: string; url: string; name: string } | { ok: false; error: string };

/** A PDF handout (private, served only to learners) or an image (public) for a lesson. */
export async function uploadCourseFileAction(form: FormData): Promise<UploadState> {
  let staff;
  try {
    staff = await studioAction("courses.edit");
  } catch {
    return { ok: false, error: "You can't edit courses." };
  }
  const file = form.get("file");
  const asImage = form.get("as") === "image";
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Please choose a file." };
  const stored = await storeUpload({ kind: asImage ? "photo" : "document", file, ownerId: staff.userId, isPublic: asImage });
  if (!stored) return { ok: false, error: "Please choose a file." };
  if (!stored.ok) return { ok: false, error: stored.message };
  return { ok: true, fileId: stored.file.id, url: stored.file.url, name: file.name };
}

export async function submitCourseAction(form: FormData) {
  const staff = await studioAction("courses.edit");
  const id = String(form.get("id") ?? "").slice(0, 40);
  const result = await submitForReview(id, staff.userId);
  if (!result.ok) redirect(`/studio/courses/${id}?notice=${encodeURIComponent(result.error)}&tone=danger`);
  await audit(staff, { action: "course.submit", targetType: "course", targetId: id, summary: `Sent version ${result.number} of a course for review.` });
  revalidatePath("/studio/courses");
  redirect(`/studio/courses/${id}?notice=${encodeURIComponent(`Version ${result.number} is waiting for review.`)}`);
}

export async function reviewCourseAction(form: FormData) {
  const staff = await studioAction("courses.review");
  const versionId = String(form.get("versionId") ?? "").slice(0, 40);
  const decision = String(form.get("decision") ?? "");
  if (decision !== "approve" && decision !== "changes" && decision !== "reject") redirect("/studio/courses/review");
  const result = await reviewVersion({ versionId, decision, note: String(form.get("note") ?? "").slice(0, 4000), reviewerId: staff.userId });
  if (!result.ok) redirect(`/studio/courses/review/${versionId}?notice=${encodeURIComponent(result.error)}&tone=danger`);
  await audit(staff, {
    action: `course.${decision}`,
    targetType: "course",
    targetId: result.course.id,
    summary: `${decision === "approve" ? "Approved" : decision === "changes" ? "Asked for changes to" : "Rejected"} version ${result.number} of "${result.course.title}".`,
    after: { version: result.number, course: result.outcome.course },
  });
  revalidatePath("/studio/courses");
  redirect(`/studio/courses/review?notice=${encodeURIComponent(`"${result.course.title}" was ${DECISION_LABEL[decision]}.`)}`);
}

export async function setCourseListedAction(form: FormData) {
  const staff = await studioAction("courses.review");
  const id = String(form.get("id") ?? "").slice(0, 40);
  const listed = form.get("listed") === "1";
  const result = await setListed(id, listed);
  if (!result.ok) redirect(`/studio/courses/${id}?notice=${encodeURIComponent(result.error)}&tone=danger`);
  await audit(staff, { action: listed ? "course.list" : "course.unlist", targetType: "course", targetId: id, summary: listed ? "Put a course back on sale." : "Took a course off sale; its learners keep access." });
  revalidatePath("/studio/courses");
  redirect(`/studio/courses/${id}?notice=${encodeURIComponent(listed ? "The course is on sale again." : "The course is off sale. Its learners keep access.")}`);
}

/** Refunds a course sale in full. For an educator's course, Stripe also takes back their share. */
export async function refundSaleAction(form: FormData) {
  const staff = await studioAction("courses.review");
  const id = String(form.get("id") ?? "").slice(0, 40);
  const sale = await prisma.courseSale.findUnique({ where: { id }, select: { courseSlug: true, gross: true, educatorId: true } });
  if (!sale) redirect("/studio/courses#sales");
  const result = await refundSale(id).catch((error) => {
    console.error("[COURSE_REFUND]", error);
    return { ok: false as const, error: "Stripe didn't accept the refund. Check the payment in Stripe." };
  });
  if (!result.ok) redirect(`/studio/courses?notice=${encodeURIComponent(result.error)}&tone=danger#sales`);
  await audit(staff, {
    action: "course_sale.refund",
    targetType: "course_sale",
    targetId: id,
    summary: `Refunded a sale of ${sale.courseSlug} in full${sale.educatorId ? ", taking back the educator's share" : ""}.`,
  });
  revalidatePath("/studio/courses");
  redirect(`/studio/courses?notice=${encodeURIComponent("The refund is on its way. The ledger updates as soon as Stripe confirms it.")}#sales`);
}

export async function startStudioDraftAction(form: FormData) {
  const staff = await studioAction("courses.edit");
  const id = String(form.get("id") ?? "").slice(0, 40);
  const course = await prisma.course.findUnique({ where: { id }, select: { id: true, title: true } });
  if (!course) redirect("/studio/courses");
  const result = await startDraftFromForm(form, { courseId: course.id, title: course.title, userId: staff.userId, unlimited: true });
  if (!result.ok) redirect(`/studio/courses/${id}?notice=${encodeURIComponent(result.error)}&tone=danger`);
  await audit(staff, { action: "course.ai_draft", targetType: "course", targetId: id, summary: `Started an AI draft of "${course.title}".` });
  redirect(`/studio/courses/${id}`);
}
