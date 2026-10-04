"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { removePhoto } from "@/lib/photos";
import { deleteStoredFile } from "@/lib/storage";
import { audit } from "@/lib/staff";
import { studioAction } from "../_lib/guard";

function revalidate() {
  revalidatePath("/studio/photos");
  revalidatePath("/partners", "layout");
  revalidatePath("/directory", "layout");
}

/** Takes down one gallery photo: partner photos need partners.manage, member photos listings.review. */
export async function removePhotoAction(form: FormData) {
  const id = String(form.get("id") ?? "");
  const photo = await prisma.profilePhoto.findUnique({ where: { id }, include: { partner: { select: { name: true } }, user: { select: { name: true } } } });
  if (!photo) return;
  const staff = await studioAction(photo.partnerId ? "partners.manage" : "listings.review");
  await removePhoto(id);
  await audit(staff, {
    action: "photo.remove",
    targetType: photo.partnerId ? "partner" : "user",
    targetId: photo.partnerId ?? photo.userId ?? id,
    summary: `Removed a gallery photo from ${photo.partner?.name ?? photo.user?.name ?? "a profile"}${photo.caption ? ` ("${photo.caption}")` : ""}.`,
  });
  revalidate();
}

/** Takes down a cover photo on a partner page or a member's profile. */
export async function removeCoverAction(form: FormData) {
  const partnerId = String(form.get("partnerId") ?? "");
  const userId = String(form.get("userId") ?? "");
  if (partnerId) {
    const staff = await studioAction("partners.manage");
    const page = await prisma.partner.findUnique({ where: { id: partnerId }, select: { name: true, coverFileId: true } });
    if (!page) return;
    await prisma.partner.update({ where: { id: partnerId }, data: { coverUrl: null, coverFileId: null } });
    await deleteStoredFile(page.coverFileId);
    await audit(staff, { action: "photo.remove_cover", targetType: "partner", targetId: partnerId, summary: `Removed the cover photo from ${page.name}.` });
  } else if (userId) {
    const staff = await studioAction("listings.review");
    const profile = await prisma.trichologistProfile.findUnique({ where: { userId }, select: { coverFileId: true, user: { select: { name: true } } } });
    if (!profile?.coverFileId) return;
    await prisma.trichologistProfile.update({ where: { userId }, data: { coverFileId: null } });
    await deleteStoredFile(profile.coverFileId);
    await audit(staff, { action: "photo.remove_cover", targetType: "user", targetId: userId, summary: `Removed the cover photo from ${profile.user.name ?? "a member"}'s profile.` });
  }
  revalidate();
}
