import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ROOMS, type Room } from "@/config/rooms";

type RoomRow = {
  id: string;
  label: string;
  blurb: string;
  prompt: string;
  professionalOnly: boolean;
  noBrands: boolean;
  aiModeration: boolean;
  archivedAt: Date | null;
};

function toRoom(row: RoomRow): Room {
  return {
    id: row.id,
    label: row.label,
    blurb: row.blurb,
    prompt: row.prompt,
    professionalOnly: row.professionalOnly || undefined,
    noBrands: row.noBrands || undefined,
    aiModeration: row.aiModeration || undefined,
    archived: row.archivedAt ? true : undefined,
  };
}

/**
 * Every room, archived ones included, in display order. Use this to label and
 * permission-check existing posts, so an archived professional room stays private.
 * Falls back to the built-in rooms if the table is empty or unreachable.
 */
export const getAllRooms = cache(async (): Promise<Room[]> => {
  try {
    const rows = await prisma.communityRoom.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
    if (!rows.length) return DEFAULT_ROOMS;
    return rows.map(toRoom);
  } catch (error) {
    console.error("[rooms] could not load rooms, using the built-in list", error);
    return DEFAULT_ROOMS;
  }
});

/** Active rooms in display order: the rooms members can browse and post in. */
export const getRooms = cache(async (): Promise<Room[]> => {
  return (await getAllRooms()).filter((r) => !r.archived);
});

/** Raw rows for Studio, archived rooms included. Not cached, so edits show straight away. */
export async function getAllRoomsForStudio() {
  return prisma.communityRoom.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
}
