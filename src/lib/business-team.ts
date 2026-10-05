import "server-only";
import type { BusinessSeat } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fileUrl } from "@/lib/files";

export type SeatWithPhoto = BusinessSeat & { photoUrl: string | null };

/** A team member as shown in "Meet the team" on a business page. */
export type TeamMember = { id: string; name: string; role: string | null; bio: string | null; photo: string | null };

/** Adds each seat's photo address, looked up in one query. */
export async function withPhotoUrls(seats: BusinessSeat[]): Promise<SeatWithPhoto[]> {
  const ids = seats.map((s) => s.photoFileId).filter((id): id is string => !!id);
  const files = ids.length
    ? await prisma.storedFile.findMany({
        where: { id: { in: ids } },
        select: { id: true, driver: true, bucket: true, path: true, isPublic: true },
      })
    : [];
  const urls = new Map(files.map((f) => [f.id, fileUrl(f)]));
  return seats.map((s) => ({ ...s, photoUrl: s.photoFileId ? (urls.get(s.photoFileId) ?? null) : null }));
}

/** The team a business has chosen to show on its page. Only people with a name are shown. */
export async function publicTeam(ownerEmail: string | null | undefined): Promise<TeamMember[]> {
  if (!ownerEmail) return [];
  const seats = await prisma.businessSeat.findMany({
    where: { ownerEmail, showOnPage: true, name: { not: null } },
    orderBy: { createdAt: "asc" },
  });
  const withPhotos = await withPhotoUrls(seats.filter((s) => s.name?.trim()));
  return withPhotos.map((s) => ({ id: s.id, name: s.name!.trim(), role: s.role, bio: s.bio, photo: s.photoUrl }));
}
