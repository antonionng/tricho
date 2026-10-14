"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { storeUpload } from "@/lib/storage";
import { createCourse, saveDraft, submitForReview, type SaveResult } from "@/lib/course-builder";
import { submitCoursesBlocker } from "@/lib/educator-rules";
import { alertOwners } from "@/lib/mail/send";

/**
 * The educator portal's actions. Each one loads the signed-in person's own
 * educator profile and checks they own the course, so an id sent from the
 * browser can never reach someone else's course.
 */

async function me() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const profile = await prisma.educatorProfile.findUnique({ where: { userId } });
  return profile ? { userId, profile } : null;
}

async function myCourse(courseId: string) {
  const ctx = await me();
  if (!ctx) return null;
  const course = await prisma.course.findFirst({ where: { id: courseId.slice(0, 40), educatorId: ctx.profile.id }, select: { id: true, title: true } });
  return course ? { ...ctx, course } : null;
}

const clean = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);

export async function saveEducatorProfileAction(form: FormData) {
  const ctx = await me();
  if (!ctx) redirect("/educators");
  const displayName = clean(form, "displayName", 80);
  if (displayName.length < 2) redirect("/members/educator?error=name#profile");
  const website = clean(form, "website", 200);
  if (website && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(website)) redirect("/members/educator?error=website#profile");
  await prisma.educatorProfile.update({
    where: { id: ctx.profile.id },
    data: {
      displayName,
      headline: clean(form, "headline", 160),
      bio: clean(form, "bio", 3000),
      credentials: clean(form, "credentials", 2000),
      topics: clean(form, "topics", 400).split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12),
      website: website || null,
    },
  });
  revalidatePath("/members/educator");
  revalidatePath(`/educators/${ctx.profile.slug}`);
  redirect("/members/educator?saved=profile#profile");
}

export async function createEducatorCourseAction(form: FormData) {
  const ctx = await me();
  if (!ctx) redirect("/educators");
  if (ctx.profile.status === "rejected" || ctx.profile.status === "suspended") redirect("/members/educator?error=status");
  const result = await createCourse({ title: clean(form, "title", 160), createdById: ctx.userId, educatorId: ctx.profile.id });
  if (!result.ok) redirect("/members/educator?error=title#courses");
  redirect(`/members/educator/courses/${result.id}`);
}

export async function saveEducatorDraftAction(id: string, payload: { meta: unknown; content: unknown }): Promise<SaveResult> {
  const ctx = await myCourse(id);
  if (!ctx) return { ok: false, error: "You can only edit your own courses." };
  return saveDraft(ctx.course.id, payload);
}

export async function uploadEducatorFileAction(form: FormData): Promise<{ ok: true; fileId: string; url: string; name: string } | { ok: false; error: string }> {
  const ctx = await me();
  if (!ctx) return { ok: false, error: "Only Educator members can upload course files." };
  const file = form.get("file");
  const asImage = form.get("as") === "image";
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Please choose a file." };
  const stored = await storeUpload({ kind: asImage ? "photo" : "document", file, ownerId: ctx.userId, isPublic: asImage });
  if (!stored) return { ok: false, error: "Please choose a file." };
  if (!stored.ok) return { ok: false, error: stored.message };
  return { ok: true, fileId: stored.file.id, url: stored.file.url, name: file.name };
}

export async function submitEducatorCourseAction(form: FormData) {
  const id = clean(form, "id", 40);
  const ctx = await myCourse(id);
  if (!ctx) redirect("/members/educator");
  const blocker = submitCoursesBlocker(ctx.profile);
  if (blocker) redirect(`/members/educator/courses/${id}?notice=${encodeURIComponent(blocker)}&tone=danger`);
  const result = await submitForReview(id, ctx.userId);
  if (!result.ok) redirect(`/members/educator/courses/${id}?notice=${encodeURIComponent(result.error)}&tone=danger`);
  await alertOwners({
    subject: `Course for review: ${ctx.course.title}`,
    heading: `${ctx.profile.displayName} has sent "${ctx.course.title}" for review.`,
    body: `This is version ${result.number}. Read it in full and approve it, ask for changes or reject it in Studio.`,
    cta: { label: "Open the review", href: `/studio/courses/review/${result.versionId}` },
  });
  revalidatePath("/members/educator");
  redirect(`/members/educator/courses/${id}?notice=${encodeURIComponent(`Version ${result.number} is with the team for review. We'll email you when it's done.`)}`);
}
