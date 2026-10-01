"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Profession } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";
import { PROFESSIONS } from "@/config/rooms";

async function requireUser() {
  const ctx = await getMemberContext();
  const userId = ctx.session?.user?.id;
  if (!userId) redirect("/login?next=/members/onboarding");
  return { ctx, userId };
}

export async function saveDiscipline(formData: FormData) {
  const { userId } = await requireUser();
  const profession = String(formData.get("profession") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (!PROFESSIONS.some((p) => p.id === profession)) redirect("/members/onboarding?step=1&error=discipline");

  if (name.length >= 2) await prisma.user.update({ where: { id: userId }, data: { name } });
  await prisma.trichologistProfile.upsert({
    where: { userId },
    create: { userId, profession: profession as Profession },
    update: { profession: profession as Profession },
  });
  redirect("/members/onboarding?step=2");
}

export async function saveChapter(formData: FormData) {
  const { userId } = await requireUser();
  const slug = String(formData.get("chapter") ?? "");
  const chapter = slug && slug !== "none" ? await prisma.chapter.findUnique({ where: { slug }, select: { id: true } }) : null;
  if (slug !== "none" && !chapter) redirect("/members/onboarding?step=2&error=chapter");

  await prisma.user.update({ where: { id: userId }, data: { chapterId: chapter?.id ?? null } });
  redirect("/members/onboarding?step=3");
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
        title: `Hello from ${(user.name || "a new member").split(" ")[0]}`,
        content: intro,
        category: "discussion",
        space: "introductions",
        chapterId: user.chapterId ?? ctx.chapterId,
        authorId: userId,
      },
    });
  }

  revalidatePath("/members", "layout");
  redirect("/members?welcome=1");
}
