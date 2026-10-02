export type ProfessionId = "cosmetic" | "clinical" | "medical" | "brand";

export const PROFESSIONS: {
  id: ProfessionId;
  label: string;
  blurb: string;
}[] = [
  { id: "cosmetic", label: "Cosmetic", blurb: "Head spa therapists, stylists, barbers, aestheticians, and beauty and nail therapists" },
  { id: "clinical", label: "Clinical", blurb: "Trichologists and clinical hair specialists" },
  { id: "medical", label: "Medical", blurb: "GPs, dermatologists, nurses and aesthetic doctors" },
  { id: "brand", label: "Business", blurb: "Clinics, salons, brands and device makers" },
];

/** The rooms that ship with the platform. Code that maps by room (prompt banks, agent copy) keys on these. */
export type KnownRoomId =
  | "lounge"
  | "introductions"
  | "head-spa"
  | "hair-loss"
  | "case-room"
  | "devices"
  | "business"
  | "wins";

/** Rooms are managed in Studio, so any slug is a valid room id. */
export type RoomId = string;

export type Room = {
  id: RoomId;
  label: string;
  blurb: string;
  /** Only Professional (or Business) members may read and post. */
  professionalOnly?: boolean;
  /** Business members may read but not post (keeps clinical discussion clean). */
  noBrands?: boolean;
  /** Suggested post prompt in the composer. */
  prompt: string;
  /** New posts and replies are checked by the moderation assistant. */
  aiModeration?: boolean;
  /** Archived rooms keep their old posts readable but are hidden from navigation and posting. */
  archived?: boolean;
};

/** The built-in community spaces, used until rooms exist in the database. Order is the order shown in the app. */
export const DEFAULT_ROOMS: (Room & { id: KnownRoomId })[] = [
  {
    id: "lounge",
    label: "The Lounge",
    blurb: "Everyday conversation across the whole collective.",
    prompt: "What's on your mind this week?",
  },
  {
    id: "introductions",
    label: "Introductions",
    blurb: "New here? Say hello and tell us what you do.",
    prompt: "Tell us who you are, where you practise and what you'd love to learn.",
  },
  {
    id: "head-spa",
    label: "Head Spa & Scalp Care",
    blurb: "Techniques, routines, products and the craft of scalp care.",
    prompt: "Share a technique, a question or something you've noticed in the treatment room.",
  },
  {
    id: "hair-loss",
    label: "Hair Loss & Trichology",
    blurb: "Shedding, thinning and scalp conditions, discussed carefully.",
    noBrands: true,
    prompt: "Ask a question or share what's working in your practice.",
  },
  {
    id: "case-room",
    label: "Case Room",
    blurb: "Anonymised cases for verified professionals. Never share anything that identifies a client.",
    professionalOnly: true,
    noBrands: true,
    aiModeration: true,
    prompt: "Describe the case without names, photos of faces or anything identifying.",
  },
  {
    id: "devices",
    label: "Devices & Technology",
    blurb: "Scopes, LED and UV devices, and the evidence behind them.",
    prompt: "Which device are you asking about, and what do you want to know?",
  },
  {
    id: "business",
    label: "Business & Marketing",
    blurb: "Pricing, menus, marketing and running a practice.",
    prompt: "What's a business question you'd like help with?",
  },
  {
    id: "wins",
    label: "Wins",
    blurb: "Good news, big and small. Celebrate each other.",
    prompt: "Share something that went well.",
  },
];

/** Kept for older imports. Server code should prefer getRooms() from src/lib/rooms. */
export const ROOMS: Room[] = DEFAULT_ROOMS;

export function roomById(id: string, rooms: Room[] = DEFAULT_ROOMS) {
  return rooms.find((r) => r.id === id);
}

export function professionById(id: string) {
  return PROFESSIONS.find((p) => p.id === id);
}

/** Space names from earlier builds, and the room each now belongs to. */
export const LEGACY_SPACES: Record<string, KnownRoomId> = {
  everyone: "lounge",
  consultation: "case-room",
  cosmetic: "head-spa",
  clinical: "hair-loss",
  medical: "case-room",
};

/**
 * Map a stored space to a room so old posts keep a home. Legacy names win, so a
 * new room can never take over posts that belonged to the Case Room. Anything
 * not in `rooms` lands in the Lounge.
 */
export function normalizeSpace(space: string, rooms: Room[] = DEFAULT_ROOMS): RoomId {
  if (LEGACY_SPACES[space]) return LEGACY_SPACES[space];
  if (rooms.some((r) => r.id === space)) return space;
  return "lounge";
}

export function canReadRoom(roomId: RoomId, professional: boolean, rooms: Room[] = DEFAULT_ROOMS) {
  const room = roomById(roomId, rooms);
  if (!room) return false;
  return !room.professionalOnly || professional;
}

export function canPostInRoom(
  roomId: RoomId,
  opts: { professional: boolean; profession?: ProfessionId | null; unlocked?: boolean },
  rooms: Room[] = DEFAULT_ROOMS
) {
  const room = roomById(roomId, rooms);
  if (room?.archived) return false;
  if (opts.unlocked) return true;
  if (!room) return false;
  if (room.professionalOnly && !opts.professional) return false;
  if (room.noBrands && opts.profession === "brand") return false;
  return true;
}
