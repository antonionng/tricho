"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Profession } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";
import { PROFESSIONS } from "@/config/rooms";
import {
  ONBOARDING_STEPS,
  asCreateData,
  profileDataFromForm,
  saveProfilePhoto,
  syncListingFromProfile,
} from "@/lib/profile";
import { PROGRESS_COOKIE, readProgress } from "./progress";
import { shortName } from "@/lib/names";

async function requireUser() {
  const ctx = await getMemberContext();
  const userId = ctx.session?.user?.id;
  if (!userId) redirect("/login?next=/members/onboarding");
  return { ctx, userId };
}

/** Remember the furthest step saved or skipped, so a member who leaves can pick up where they were. */
async function markReached(userId: string, step: number) {
  const jar = await cookies();
  const reached = Math.max(step, readProgress(jar.get(PROGRESS_COOKIE)?.value, userId));
  jar.set(PROGRESS_COOKIE, `${userId}.${reached}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/members",
    maxAge: 60 * 60 * 24 * 90,
  });
}

function goTo(step: number, error?: string): never {
  redirect(`/members/onboarding?step=${step}${error ? `&error=${error}` : ""}`);
}

export async function saveDiscipline(formData: FormData) {
  const { userId } = await requireUser();
  const profession = String(formData.get("profession") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (!PROFESSIONS.some((p) => p.id === profession)) goTo(1, "discipline");

  if (name.length >= 2) await prisma.user.update({ where: { id: userId }, data: { name } });
  await prisma.trichologistProfile.upsert({
    where: { userId },
    create: { userId, profession: profession as Profession },
    update: { profession: profession as Profession },
  });
  await syncListingFromProfile(userId);
  await markReached(userId, 1);
  goTo(2);
}

/**
 * Steps 2 to 6: each form posts only its own fields, plus a hidden `step`.
 * "Skip for now" posts `intent=skip` and moves on without saving.
 */
export async function saveProfileStep(formData: FormData) {
  const { ctx, userId } = await requireUser();
  const step = Math.min(6, Math.max(2, Number(formData.get("step")) || 2));

  if (formData.get("intent") !== "skip") {
    if (step === 2) {
      const photo = await saveProfilePhoto(userId, formData);
      if (photo && !photo.ok) goTo(2, "photo");
    }
    const data = profileDataFromForm(formData);
    if (Object.keys(data).length > 0) {
      await prisma.trichologistProfile.upsert({
        where: { userId },
        create: { userId, ...asCreateData(data) },
        update: data,
      });
    }
    await syncListingFromProfile(userId, { full: ctx.professional });
  }
  await markReached(userId, step);
  goTo(step + 1);
}

export async function saveChapter(formData: FormData) {
  const { userId } = await requireUser();
  const chapterStep = ONBOARDING_STEPS.findIndex((s) => s.id === "chapter") + 1;
  if (formData.get("intent") !== "skip") {
    const slug = String(formData.get("chapter") ?? "");
    const chapter = slug && slug !== "none" ? await prisma.chapter.findUnique({ where: { slug }, select: { id: true } }) : null;
    if (slug !== "none" && !chapter) goTo(chapterStep, "chapter");
    await prisma.user.update({ where: { id: userId }, data: { chapterId: chapter?.id ?? null } });
  }
  await markReached(userId, chapterStep);
  goTo(chapterStep + 1);
}

export async function finishOnboarding(formData: FormData) {
  const { ctx, userId } = await requireUser();
  const intro = String(formData.get("intro") ?? "").trim().slice(0, 3000);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { onboardedAt: new Date() },
    select: { name: true, chapterId: true },
  });

  // Only members can post; free accounts skip the introduction.
  if (ctx.allowed && intro.length >= 2) {
    await prisma.communityPost.create({
      data: {
        title: `Hello from ${shortName(user.name, "a new member")}`,
        content: intro,
        category: "discussion",
        space: "introductions",
        chapterId: user.chapterId ?? ctx.chapterId,
        authorId: userId,
      },
    });
  }
  await markReached(userId, ONBOARDING_STEPS.length);

  revalidatePath("/members", "layout");
  redirect("/members?welcome=1");
}
