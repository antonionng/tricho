export type ProfessionId = "cosmetic" | "clinical" | "medical" | "brand";
export type RoomId = "everyone" | "cosmetic" | "clinical" | "medical";

export const PROFESSIONS: {
  id: ProfessionId;
  label: string;
  blurb: string;
  homeRoom: RoomId;
}[] = [
  {
    id: "cosmetic",
    label: "Cosmetic",
    blurb: "Stylists and cosmetic practitioners",
    homeRoom: "cosmetic",
  },
  {
    id: "clinical",
    label: "Clinical",
    blurb: "Trichologists and clinical hair specialists",
    homeRoom: "clinical",
  },
  {
    id: "medical",
    label: "Medical",
    blurb: "Doctors and medical referrers",
    homeRoom: "medical",
  },
  {
    id: "brand",
    label: "Brand",
    blurb: "Exhibitors and industry partners",
    homeRoom: "everyone",
  },
];

export const ROOMS: {
  id: RoomId;
  label: string;
  blurb: string;
  /** Who may post. Everyone can always read Everyone. */
  postRoles: Array<"any" | ProfessionId>;
  accent: string;
}[] = [
  {
    id: "everyone",
    label: "Everyone",
    blurb: "Introductions and practice life across the network.",
    postRoles: ["any"],
    accent: "#5F7A6A",
  },
  {
    id: "cosmetic",
    label: "Cosmetic",
    blurb: "Styling, salon cases, and when to refer on.",
    postRoles: ["cosmetic", "clinical", "medical"],
    accent: "#C4A4B8",
  },
  {
    id: "clinical",
    label: "Clinical",
    blurb: "Consult structure, red flags, and clinical discussion.",
    postRoles: ["clinical", "medical"],
    accent: "#7BA3B5",
  },
  {
    id: "medical",
    label: "Medical",
    blurb: "Referral pathways and letters between clinicians.",
    postRoles: ["medical", "clinical"],
    accent: "#E09A8E",
  },
];

export function roomById(id: string) {
  return ROOMS.find((r) => r.id === id);
}

export function professionById(id: string) {
  return PROFESSIONS.find((p) => p.id === id);
}

export function canPostInRoom(
  roomId: RoomId,
  profession?: ProfessionId | null,
  unlocked = false
) {
  if (unlocked) return true;
  const room = roomById(roomId);
  if (!room) return false;
  if (room.postRoles.includes("any")) return true;
  if (!profession) return false;
  return room.postRoles.includes(profession);
}

/** Map legacy space names from the first Hub build. */
export function normalizeSpace(space: string): RoomId {
  if (space === "lounge") return "everyone";
  if (space === "consultation") return "clinical";
  if (ROOMS.some((r) => r.id === space)) return space as RoomId;
  return "everyone";
}
