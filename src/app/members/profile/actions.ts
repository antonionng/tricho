"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Profession } from "@prisma/client";
import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";
import { PROFESSIONS } from "@/config/rooms";
import { asCreateData, profileDataFromForm, saveProfilePhoto, syncListingFromProfile } from "@/lib/profile";

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

  await syncListingFromProfile(userId, { full: ctx.professional });
  revalidateProfile();
  redirect("/members/profile?saved=about#about");
}

function revalidateProfile() {
  revalidatePath("/members", "layout");
  revalidatePath("/directory");
  revalidatePath("/directory/p/[slug]", "page");
}

const SECTIONS = new Set(["practice", "qualifications", "contact", "goals"]);

/**
 * Save one section of the profile. Members can always save to their own
 * profile; the directory listing only takes the public fields while the
 * member has a full profile (see syncListingFromProfile).
 */
export async function saveProfileSection(formData: FormData) {
  const ctx = await getMemberContext();
  const userId = ctx.session?.user?.id;
  if (!userId) redirect("/login?next=/members/profile");
  const section = String(formData.get("section") ?? "");
  const anchor = SECTIONS.has(section) ? section : "practice";

  const data = profileDataFromForm(formData);
  await prisma.trichologistProfile.upsert({
    where: { userId },
    create: { userId, ...asCreateData(data) },
    update: data,
  });
  await syncListingFromProfile(userId, { full: ctx.professional });
  revalidateProfile();
  redirect(`/members/profile?saved=${anchor}#${anchor}`);
}

/** Upload a new profile photo, or remove the current one. */
export async function saveProfilePhotoAction(formData: FormData) {
  const ctx = await getMemberContext();
  const userId = ctx.session?.user?.id;
  if (!userId) redirect("/login?next=/members/profile");

  const result = await saveProfilePhoto(userId, formData);
  if (result && !result.ok) redirect("/members/profile?error=photo#photo");
  if (!result) redirect("/members/profile?error=nophoto#photo");
  await syncListingFromProfile(userId, { full: ctx.professional });
  revalidateProfile();
  redirect("/members/profile?saved=photo#photo");
}

/** The two optional email lists. Account, booking and payment emails are always sent. */
export async function saveEmailPreferences(formData: FormData) {
  const ctx = await getMemberContext();
  const userId = ctx.session?.user?.id;
  if (!userId) redirect("/login?next=/members/profile");

  const emailUpdates = formData.get("emailUpdates") === "on";
  const emailActivity = formData.get("emailActivity") === "on";
  const user = await prisma.user.update({
    where: { id: userId },
    data: { emailUpdates, emailActivity },
    select: { email: true },
  });
  // The newsletter list is shared with the public sign-up form, so keep it in step.
  if (user.email) {
    await prisma.subscriber.updateMany({
      where: { email: user.email.toLowerCase() },
      data: { unsubscribedAt: emailUpdates ? null : new Date() },
    });
  }

  revalidatePath("/members/profile");
  redirect("/members/profile?saved=emails#emails");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
