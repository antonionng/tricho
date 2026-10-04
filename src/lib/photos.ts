import "server-only";
import type { ProfilePhoto } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile, storeUpload } from "@/lib/storage";

/** Whose gallery: a partner page or a member's directory profile. */
export type PhotoOwner = { partnerId: string } | { userId: string };

const where = (owner: PhotoOwner) => ("partnerId" in owner ? { partnerId: owner.partnerId } : { userId: owner.userId });

export async function listPhotos(owner: PhotoOwner): Promise<ProfilePhoto[]> {
  return prisma.profilePhoto
    .findMany({ where: where(owner), orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] })
    .catch(() => [] as ProfilePhoto[]);
}

export type PhotoResult = { ok: true } | { ok: false; message: string };

/**
 * Applies a gallery form: an optional new photo ("photo" + "photoCaption"), caption edits
 * ("caption:{id}"), moves ("move" = "{id}:up|down") and removals ("remove" = id).
 * The limit is checked here, on the server, whatever the form shows.
 */
export async function applyPhotosFromForm(form: FormData, owner: PhotoOwner, limit: number, uploaderId: string | null): Promise<PhotoResult> {
  const existing = await listPhotos(owner);

  const removeId = String(form.get("remove") ?? "");
  const target = existing.find((p) => p.id === removeId);
  if (target) {
    await prisma.profilePhoto.delete({ where: { id: target.id } });
    await deleteStoredFile(target.fileId);
    return { ok: true };
  }

  // Captions, saved together.
  for (const p of existing) {
    const value = form.get(`caption:${p.id}`);
    if (typeof value !== "string") continue;
    const caption = value.trim().slice(0, 140) || null;
    if (caption !== p.caption) await prisma.profilePhoto.update({ where: { id: p.id }, data: { caption } });
  }

  const [moveId, direction] = String(form.get("move") ?? "").split(":");
  const index = existing.findIndex((p) => p.id === moveId);
  if (index >= 0) {
    const order = [...existing];
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap >= 0 && swap < order.length) {
      [order[index], order[swap]] = [order[swap], order[index]];
      await prisma.$transaction(order.map((p, i) => prisma.profilePhoto.update({ where: { id: p.id }, data: { sortOrder: i } })));
    }
    return { ok: true };
  }

  const file = form.get("photo") as File | null;
  if (file && typeof file !== "string" && file.size > 0) {
    if (existing.length >= limit) {
      return { ok: false, message: `Your page can show up to ${limit} photos. Remove one to add another.` };
    }
    const upload = await storeUpload({ kind: "photo", file, ownerId: uploaderId });
    if (upload && !upload.ok) return upload;
    if (upload?.ok) {
      const caption = String(form.get("photoCaption") ?? "").trim().slice(0, 140) || null;
      const last = existing.at(-1)?.sortOrder ?? -1;
      await prisma.profilePhoto.create({
        data: { ...where(owner), fileId: upload.file.id, url: upload.file.url, caption, sortOrder: last + 1 },
      });
    }
  }
  return { ok: true };
}

/** Removes one photo, for the Studio. Returns whether anything was removed. */
export async function removePhoto(id: string) {
  const photo = await prisma.profilePhoto.findUnique({ where: { id } });
  if (!photo) return null;
  await prisma.profilePhoto.delete({ where: { id } });
  await deleteStoredFile(photo.fileId);
  return photo;
}

export type CoverResult = { ok: true; changed: false } | { ok: true; changed: true; file: { id: string; url: string } | null } | { ok: false; message: string };

/** A cover upload ("cover") or removal ("removeCover"). The caller saves the id and deletes the old file. */
export async function coverFromForm(form: FormData, uploaderId: string | null): Promise<CoverResult> {
  const upload = await storeUpload({ kind: "cover", file: form.get("cover") as File | null, ownerId: uploaderId });
  if (upload && !upload.ok) return upload;
  if (upload?.ok) return { ok: true, changed: true, file: upload.file };
  if (form.get("removeCover") === "on") return { ok: true, changed: true, file: null };
  return { ok: true, changed: false };
}
