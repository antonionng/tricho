export type ProfessionId = "cosmetic" | "clinical" | "medical" | "brand";

export const PROFESSIONS: {
  id: ProfessionId;
  label: string;
  blurb: string;
}[] = [
  { id: "cosmetic", label: "Cosmetic", blurb: "Head spa therapists, stylists and scalp care specialists" },
  { id: "clinical", label: "Clinical", blurb: "Trichologists and clinical hair specialists" },
  { id: "medical", label: "Medical", blurb: "GPs, dermatologists, nurses and aesthetic doctors" },
  { id: "brand", label: "Business", blurb: "Clinics, salons, brands and device makers" },
];

export type RoomId =
  | "lounge"
  | "introductions"
  | "head-spa"
  | "hair-loss"
  | "case-room"
  | "devices"
  | "business"
  | "wins";

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
};

/** Community spaces. Order is the order shown in the app. */
export const ROOMS: Room[] = [
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

export function roomById(id: string) {
  return ROOMS.find((r) => r.id === id);
}

export function professionById(id: string) {
  return PROFESSIONS.find((p) => p.id === id);
}

/** Map space names from earlier builds so old posts keep a home. */
export function normalizeSpace(space: string): RoomId {
  const legacy: Record<string, RoomId> = {
    everyone: "lounge",
    consultation: "case-room",
    cosmetic: "head-spa",
    clinical: "hair-loss",
    medical: "case-room",
  };
  if (legacy[space]) return legacy[space];
  if (ROOMS.some((r) => r.id === space)) return space as RoomId;
  return "lounge";
}

export function canReadRoom(roomId: RoomId, professional: boolean) {
  const room = roomById(roomId);
  if (!room) return false;
  return !room.professionalOnly || professional;
}

export function canPostInRoom(
  roomId: RoomId,
  opts: { professional: boolean; profession?: ProfessionId | null; unlocked?: boolean }
) {
  if (opts.unlocked) return true;
  const room = roomById(roomId);
  if (!room) return false;
  if (room.professionalOnly && !opts.professional) return false;
  if (room.noBrands && opts.profession === "brand") return false;
  return true;
}
