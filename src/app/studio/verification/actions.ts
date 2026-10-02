"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/staff";
import { deliver } from "@/lib/mail/send";
import { verificationApprovedEmail, verificationRejectedEmail } from "@/lib/mail/templates/members";

const PAGE = "/studio/verification";

function s(form: FormData, key: string, max = 2000) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function refresh() {
  revalidatePath(PAGE);
  revalidatePath("/members/profile/verification");
  revalidatePath("/directory", "layout");
}

/** Set the badge on the member's own profile and every directory listing that belongs to them. */
async function setBadge(userId: string, isVerified: boolean) {
  await prisma.$transaction([
    prisma.trichologistProfile.upsert({ where: { userId }, create: { userId, isVerified }, update: { isVerified } }),
    prisma.directoryListing.updateMany({ where: { userId }, data: { isVerified } }),
  ]);
}

export async function approveVerificationAction(form: FormData) {
  const staff = await requirePermission("verification.review");
  const id = s(form, "id", 64);
  const request = await prisma.verificationRequest.findUnique({
    where: { id },
    select: { id: true, status: true, title: true, userId: true, user: { select: { name: true, email: true } } },
  });
  if (!request || request.status !== "pending") redirect(PAGE);

  await prisma.verificationRequest.update({
    where: { id },
    data: { status: "approved", reviewedById: staff.userId, reviewedAt: new Date(), reviewNote: null },
  });
  await setBadge(request.userId, true);

  if (request.user.email) {
    const e = verificationApprovedEmail({ name: request.user.name });
    await deliver(request.user.email, e.subject, e.content, { tag: "verification" });
  }

  await audit(staff, {
    action: "verification.approve",
    targetType: "user",
    targetId: request.userId,
    summary: `Verified ${request.user.name || request.user.email || "a member"} from "${request.title}".`,
    after: { requestId: id, isVerified: true },
  });
  refresh();
  redirect(`${PAGE}?done=approved`);
}

export async function rejectVerificationAction(form: FormData) {
  const staff = await requirePermission("verification.review");
  const id = s(form, "id", 64);
  const reason = s(form, "reason", 1000);
  if (reason.length < 5) redirect(`${PAGE}?error=reason&id=${encodeURIComponent(id)}#r-${id}`);

  const request = await prisma.verificationRequest.findUnique({
    where: { id },
    select: { id: true, status: true, title: true, userId: true, user: { select: { name: true, email: true } } },
  });
  if (!request || request.status !== "pending") redirect(PAGE);

  await prisma.verificationRequest.update({
    where: { id },
    data: { status: "rejected", reviewedById: staff.userId, reviewedAt: new Date(), reviewNote: reason },
  });

  if (request.user.email) {
    const e = verificationRejectedEmail({ name: request.user.name, reason });
    await deliver(request.user.email, e.subject, e.content, { tag: "verification" });
  }

  await audit(staff, {
    action: "verification.reject",
    targetType: "user",
    targetId: request.userId,
    summary: `Did not verify ${request.user.name || request.user.email || "a member"} from "${request.title}".`,
    after: { requestId: id, reason },
  });
  refresh();
  redirect(`${PAGE}?done=rejected`);
}

/** Take the badge away from a verified member. Their past requests are kept as a record. */
export async function revokeVerificationAction(form: FormData) {
  const staff = await requirePermission("verification.review");
  const userId = s(form, "userId", 64);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  if (!user) redirect(PAGE);

  await setBadge(userId, false);
  await audit(staff, {
    action: "verification.revoke",
    targetType: "user",
    targetId: userId,
    summary: `Removed the verified badge from ${user.name || user.email || "a member"}.`,
    before: { isVerified: true },
    after: { isVerified: false },
  });
  refresh();
  redirect(`${PAGE}?done=revoked`);
}
