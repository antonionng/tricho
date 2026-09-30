"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Profession } from "@prisma/client";
import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";
import { PROFESSIONS } from "@/config/rooms";

/** Name, discipline and chapter. Open to anyone signed in, member or not. */
export async function saveMemberDetails(formData: FormData) {
  const ctx = await getMemberContext();
  const userId = ctx.session?.user?.id;
  if (!userId) redirect("/login?next=/members/profile");

  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const profession = String(formData.get("profession") ?? "");
  const chapterSlug = String(formData.get("chapter") ?? "");

  if (name.length < 2) redirect("/members/profile?error=name#about");
  if (profession && !PROFESSIONS.some((p) => p.id === profession)) redirect("/members/profile?error=discipline#about");

  const chapter =
    chapterSlug && chapterSlug !== "none"
      ? await prisma.chapter.findUnique({ where: { slug: chapterSlug }, select: { id: true } })
      : null;

  await prisma.user.update({
    where: { id: userId },
    data: { name, chapterId: chapter?.id ?? null },
  });
  if (profession) {
    await prisma.trichologistProfile.upsert({
      where: { userId },
      create: { userId, profession: profession as Profession },
      update: { profession: profession as Profession },
    });
  }

  revalidatePath("/members", "layout");
  redirect("/members/profile?saved=about#about");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
