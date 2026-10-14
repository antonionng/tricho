"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CourseRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/staff";
import { createCourse } from "@/lib/course-builder";
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
  const request = await prisma.courseRequest.findUnique({ where: { id }, include: { educator: { select: { id: true, userId: true, displayName: true } } } });
  if (!request) redirect("/studio/educators/requests");
  if (request.courseId) redirect(`/studio/courses/${request.courseId}`);
  const created = await createCourse({ title: request.title, createdById: request.educator.userId, educatorId: request.educator.id });
  if (!created.ok) redirect(`/studio/educators/requests?notice=${encodeURIComponent(created.error)}&tone=danger`);
  await prisma.$transaction([
    prisma.course.update({ where: { id: created.id }, data: { builtById: staff.userId, audience: request.audience.slice(0, 300) } }),
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
