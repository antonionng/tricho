"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CourseRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/staff";
import { createCourse } from "@/lib/course-builder";
import { deliver } from "@/lib/mail/send";
import { courseBuildQuoteEmail } from "@/lib/mail/templates/educators";
import { parseQuote, requestSharePct, statusBlocker } from "@/lib/course-build";
import { buildTierById } from "@/config/course-build";
import { studioAction } from "../../_lib/guard";

const STATUSES: CourseRequestStatus[] = ["new", "scoping", "building", "with_educator", "done", "declined"];

const TELL_EDUCATOR: Partial<Record<CourseRequestStatus, string>> = {
  with_educator: "Your tailored course is ready for you to review in the course builder.",
  done: "Your tailored course request is complete.",
  declined: "We aren't able to build your tailored course. Check your email for the details.",
};

export async function updateRequestAction(form: FormData) {
  const staff = await studioAction("courses.edit");
  const id = String(form.get("id") ?? "").slice(0, 40);
  const status = String(form.get("status") ?? "") as CourseRequestStatus;
  const before = await prisma.courseRequest.findUnique({ where: { id }, include: { educator: { select: { userId: true } } } });
  if (!before) redirect("/studio/educators/requests");
  const blocker = STATUSES.includes(status) && status !== before.status ? statusBlocker(before, status) : null;
  if (blocker) back(blocker, id, "danger");
  const data = {
    ...(STATUSES.includes(status) ? { status } : {}),
    notes: String(form.get("notes") ?? "").slice(0, 6000) || null,
    ...(form.get("assign") === "me" ? { assignedToId: staff.userId } : {}),
  };
  await prisma.courseRequest.update({ where: { id }, data });
  if (data.status && data.status !== before.status) {
    await audit(staff, { action: "course_request.status", targetType: "course_request", targetId: id, summary: `Moved the request "${before.title}" from ${before.status} to ${data.status}.` });
    const message = TELL_EDUCATOR[data.status];
    if (message) {
      await prisma.notification.create({
        data: { userId: before.educator.userId, kind: "course", title: message, href: before.courseId ? `/members/educator/courses/${before.courseId}` : "/members/educator#tailored" },
      });
    }
  }
  revalidatePath("/studio/educators/requests");
  redirect(`/studio/educators/requests?notice=${encodeURIComponent("Saved.")}#r-${id}`);
}

/** Starts the course for the educator: it belongs to them, and the team builds it in Studio. */
export async function startRequestCourseAction(form: FormData) {
  const staff = await studioAction("courses.edit");
  const id = String(form.get("id") ?? "").slice(0, 40);
  const request = await prisma.courseRequest.findUnique({ where: { id }, include: { educator: { select: { id: true, userId: true, displayName: true, sharePct: true } } } });
  if (!request) redirect("/studio/educators/requests");
  if (request.courseId) redirect(`/studio/courses/${request.courseId}`);
  const blocker = statusBlocker(request, "building");
  if (blocker) back(blocker, id, "danger");
  const created = await createCourse({ title: request.title, createdById: request.educator.userId, educatorId: request.educator.id });
  if (!created.ok) redirect(`/studio/educators/requests?notice=${encodeURIComponent(created.error)}&tone=danger`);
  await prisma.$transaction([
    prisma.course.update({
      where: { id: created.id },
      // A paid build can carry its own share, agreed in the quote; otherwise the course uses the educator's rate.
      data: { builtById: staff.userId, audience: request.audience.slice(0, 300), sharePct: request.tier || request.sharePct !== null ? requestSharePct(request, request.educator.sharePct) : null },
    }),
    prisma.courseRequest.update({ where: { id }, data: { courseId: created.id, status: "building", assignedToId: request.assignedToId ?? staff.userId } }),
  ]);
  await audit(staff, {
    action: "course_request.start",
    targetType: "course_request",
    targetId: id,
    summary: `Started building "${request.title}" for ${request.educator.displayName}.`,
  });
  redirect(`/studio/courses/${created.id}`);
}

function back(notice: string, id: string, tone?: "danger"): never {
  redirect(`/studio/educators/requests?notice=${encodeURIComponent(notice)}${tone ? `&tone=${tone}` : ""}#r-${id}`);
}

/**
 * Saves the team's quote for building a course, and sends it to the educator
 * when asked. A quote that has been paid or waived can't be changed.
 */
export async function saveQuoteAction(form: FormData) {
  const staff = await studioAction("courses.edit");
  const id = String(form.get("id") ?? "").slice(0, 40);
  const send = form.get("intent") === "send";
  const request = await prisma.courseRequest.findUnique({
    where: { id },
    include: { educator: { select: { userId: true, displayName: true, sharePct: true, user: { select: { name: true, email: true } } } } },
  });
  if (!request) redirect("/studio/educators/requests");
  if (request.quoteStatus === "paid" || request.quoteStatus === "waived") back("This request is already paid for or waived, so its quote can't change.", id, "danger");
  const parsed = parseQuote({
    tier: String(form.get("tier") ?? ""),
    amount: String(form.get("amount") ?? ""),
    sharePct: String(form.get("sharePct") ?? ""),
    note: String(form.get("quoteNote") ?? ""),
  });
  if (!parsed.ok) back(parsed.error, id, "danger");
  const { quote } = parsed;
  await prisma.courseRequest.update({
    where: { id },
    data: {
      tier: quote.tier,
      quoteAmount: quote.amountPence,
      sharePct: quote.sharePct,
      quoteNote: quote.note,
      quoteStatus: send ? "sent" : request.quoteStatus === "sent" ? "sent" : "draft",
      ...(send ? { quoteSentAt: new Date(), ...(request.status === "new" ? { status: "scoping" as const } : {}) } : {}),
    },
  });
  const tierName = buildTierById(quote.tier)?.name ?? quote.tier;
  const pounds = (quote.amountPence / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" });
  await audit(staff, {
    action: send ? "course_request.quote_sent" : "course_request.quote_saved",
    targetType: "course_request",
    targetId: id,
    summary: `${send ? "Sent" : "Saved"} a ${tierName} quote of ${pounds} for "${request.title}".`,
  });
  if (send) {
    const sharePct = requestSharePct(quote, request.educator.sharePct);
    if (request.educator.user.email) {
      const email = courseBuildQuoteEmail({ name: request.educator.user.name, title: request.title, tierName, amountPence: quote.amountPence, note: quote.note, sharePct });
      await deliver(request.educator.user.email, email.subject, email.content, { tag: "course-build" });
    }
    await prisma.notification.create({
      data: { userId: request.educator.userId, kind: "course", title: `Your quote for "${request.title}" is ready. Accept and pay to start the build.`, href: "/members/educator#tailored" },
    });
  }
  revalidatePath("/studio/educators/requests");
  revalidatePath("/members/educator");
  back(send ? `Quote sent to ${request.educator.displayName}.` : "Quote saved. The educator can't see it until you send it.", id);
}

/** Lets the work start without payment, for example a build included in a partnership. The reason is kept. */
export async function waiveFeeAction(form: FormData) {
  const staff = await studioAction("courses.edit");
  const id = String(form.get("id") ?? "").slice(0, 40);
  const reason = String(form.get("reason") ?? "").trim().slice(0, 500);
  const request = await prisma.courseRequest.findUnique({ where: { id }, select: { title: true, quoteStatus: true } });
  if (!request) redirect("/studio/educators/requests");
  if (request.quoteStatus === "paid") back("This request is already paid for.", id, "danger");
  if (reason.length < 10) back("Please say in a sentence why the fee is waived.", id, "danger");
  await prisma.courseRequest.update({ where: { id }, data: { quoteStatus: "waived", waivedReason: reason } });
  await audit(staff, { action: "course_request.fee_waived", targetType: "course_request", targetId: id, summary: `Waived the build fee for "${request.title}": ${reason}` });
  revalidatePath("/studio/educators/requests");
  revalidatePath("/members/educator");
  back("Fee waived. You can start the course now.", id);
}

/** Takes back a quote that hasn't been paid, so the educator can no longer pay it. */
export async function withdrawQuoteAction(form: FormData) {
  const staff = await studioAction("courses.edit");
  const id = String(form.get("id") ?? "").slice(0, 40);
  const request = await prisma.courseRequest.findUnique({ where: { id }, select: { title: true, quoteStatus: true } });
  if (!request) redirect("/studio/educators/requests");
  if (request.quoteStatus === "paid") back("This quote is paid, so it can't be withdrawn. Refund it in Stripe if you need to.", id, "danger");
  await prisma.courseRequest.update({ where: { id }, data: { quoteStatus: "withdrawn" } });
  await audit(staff, { action: "course_request.quote_withdrawn", targetType: "course_request", targetId: id, summary: `Withdrew the quote for "${request.title}".` });
  revalidatePath("/studio/educators/requests");
  revalidatePath("/members/educator");
  back("Quote withdrawn.", id);
}
