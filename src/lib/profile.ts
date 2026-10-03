/**
 * The member profile: constants, form parsers and the completeness meter.
 *
 * The TrichologistProfile row is the source of truth for everything a member
 * says about themselves. Their directory listing is kept in step with it by
 * `syncListingFromProfile`. Everything here is pure except the three server
 * helpers at the bottom, which load their dependencies lazily so this module
 * stays safe to import in tests.
 */
import type { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MEMBERSHIP_BODIES = [
  { id: "IAT", label: "International Association of Trichologists (IAT)" },
  { id: "WTS", label: "World Trichology Society (WTS)" },
  { id: "IOT", label: "The Institute of Trichologists" },
  { id: "TS", label: "The Trichological Society" },
  { id: "BAD", label: "British Association of Dermatologists (BAD)" },
  { id: "IAD", label: "Irish Association of Dermatologists (IAD)" },
  { id: "BCAM", label: "British College of Aesthetic Medicine (BCAM)" },
  { id: "NHBF", label: "National Hair and Beauty Federation (NHBF)" },
] as const;

export const GOALS = [
  { id: "referrals", label: "Referrals from other disciplines" },
  { id: "learning", label: "Learning and CPD" },
  { id: "business", label: "Growing my business" },
  { id: "peers", label: "Meeting peers" },
  { id: "cases", label: "Case discussion" },
  { id: "visibility", label: "Being found by clients" },
  { id: "teaching", label: "Sharing what I know" },
] as const;

export const INTEREST_GROUPS = [
  {
    topic: "Hair loss",
    items: [
      { id: "androgenetic-alopecia", label: "Androgenetic alopecia" },
      { id: "alopecia-areata", label: "Alopecia areata" },
      { id: "telogen-effluvium", label: "Telogen effluvium" },
      { id: "scarring-alopecia", label: "Scarring alopecias" },
      { id: "traction-alopecia", label: "Traction alopecia" },
    ],
  },
  {
    topic: "Scalp health",
    items: [
      { id: "seborrhoeic-dermatitis", label: "Seborrhoeic dermatitis" },
      { id: "scalp-psoriasis", label: "Scalp psoriasis" },
      { id: "scalp-microbiome", label: "The scalp microbiome" },
      { id: "head-spa", label: "Head spa and scalp care" },
    ],
  },
  {
    topic: "Treatments",
    items: [
      { id: "medical-treatment", label: "Topical and oral treatments" },
      { id: "regenerative", label: "PRP and regenerative treatments" },
      { id: "laser", label: "Low-level laser therapy" },
      { id: "transplant", label: "Hair transplant surgery" },
      { id: "smp", label: "Scalp micropigmentation" },
      { id: "hair-systems", label: "Hair systems and wigs" },
    ],
  },
  {
    topic: "Assessment",
    items: [
      { id: "trichoscopy", label: "Trichoscopy" },
      { id: "nutrition-bloods", label: "Nutrition and blood tests" },
      { id: "hormones", label: "Hormones and women's health" },
      { id: "wellbeing", label: "Mental health and hair loss" },
    ],
  },
  {
    topic: "Business",
    items: [
      { id: "marketing", label: "Marketing and social media" },
      { id: "clinic-operations", label: "Running a clinic or salon" },
      { id: "pricing", label: "Pricing and services" },
      { id: "retail", label: "Products and retail" },
    ],
  },
] as const;

export const INTERESTS: readonly { id: string; label: string }[] = INTEREST_GROUPS.flatMap((g): readonly { id: string; label: string }[] => g.items);

export const SOCIAL_KEYS = ["instagram", "tiktok", "linkedin", "facebook", "youtube"] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];
export type Socials = Partial<Record<SocialKey, string>>;

export const SOCIAL_NETWORKS: Record<SocialKey, { label: string; hosts: string[]; profile: (handle: string) => string }> = {
  instagram: { label: "Instagram", hosts: ["instagram.com"], profile: (h) => `https://www.instagram.com/${h}` },
  tiktok: { label: "TikTok", hosts: ["tiktok.com"], profile: (h) => `https://www.tiktok.com/@${h}` },
  linkedin: { label: "LinkedIn", hosts: ["linkedin.com"], profile: (h) => `https://www.linkedin.com/in/${h}` },
  facebook: { label: "Facebook", hosts: ["facebook.com", "fb.com"], profile: (h) => `https://www.facebook.com/${h}` },
  youtube: { label: "YouTube", hosts: ["youtube.com", "youtu.be"], profile: (h) => `https://www.youtube.com/@${h}` },
};

export type Qualification = { title: string; body?: string; year?: number };

const labelOf = (list: readonly { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? id;
export const membershipLabel = (id: string) => labelOf(MEMBERSHIP_BODIES, id);
export const goalLabel = (id: string) => labelOf(GOALS, id);
export const interestLabel = (id: string) => labelOf(INTERESTS, id);

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function text(value: unknown, max: number) {
  return (typeof value === "string" ? value : value == null ? "" : String(value)).replace(/\s+/g, " ").trim().slice(0, max);
}

/** "Head spa, Scalp analysis\nhead spa" -> ["Head spa", "Scalp analysis"]: trimmed, unique, at most `max`. */
export function parseList(value: unknown, max = 12, maxLength = 60): string[] {
  const raw = Array.isArray(value) ? value.join("\n") : typeof value === "string" ? value : "";
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,\n;]/)) {
    const item = text(part, maxLength);
    if (!item || seen.has(item.toLowerCase())) continue;
    seen.add(item.toLowerCase());
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

function parseYear(value: unknown, now = new Date()) {
  const year = Number(text(value, 4));
  return Number.isInteger(year) && year >= 1950 && year <= now.getFullYear() + 1 ? year : undefined;
}

/**
 * Qualifications from either text ("Diploma in Trichology, 2019" per line) or
 * structured rows ({ title, year, body }). Rows without a title are dropped.
 */
export function parseQualifications(
  input: string | { title?: unknown; year?: unknown; body?: unknown }[],
  max = 12,
  now = new Date()
): Qualification[] {
  const rows =
    typeof input === "string"
      ? input.split("\n").map((line) => {
          const m = line.trim().match(/^(.*?)[\s,–—(-]+((?:19|20)\d{2})\)?\s*$/);
          return m ? { title: m[1], year: m[2] } : { title: line };
        })
      : input;
  const out: Qualification[] = [];
  for (const row of rows) {
    const title = text(row.title, 140).replace(/[,\s–—-]+$/, "");
    if (!title) continue;
    const year = parseYear(row.year, now);
    const body = "body" in row ? text(row.body, 140) : "";
    out.push({ title, ...(body ? { body } : {}), ...(year ? { year } : {}) });
    if (out.length >= max) break;
  }
  return out;
}

/** A single social link from a handle ("@jane.hair") or a URL, as a normalised https URL. */
export function parseSocial(key: SocialKey, value: unknown): string | undefined {
  const raw = text(value, 300);
  if (!raw) return undefined;
  const net = SOCIAL_NETWORKS[key];
  const looksLikeUrl = /^https?:\/\//i.test(raw) || net.hosts.some((h) => raw.toLowerCase().includes(`${h}/`) || raw.toLowerCase().startsWith(h));
  if (looksLikeUrl) {
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      const host = url.hostname.toLowerCase().replace(/^www\.|^m\./, "");
      if (!net.hosts.some((h) => host === h || host.endsWith(`.${h}`))) return undefined;
      url.protocol = "https:";
      url.hash = "";
      return url.toString().replace(/\/$/, "");
    } catch {
      return undefined;
    }
  }
  const handle = raw.replace(/^@/, "");
  return /^[A-Za-z0-9._-]{1,60}$/.test(handle) ? net.profile(handle) : undefined;
}

/** Every social link that parses; unknown keys and invalid values are dropped. */
export function parseSocials(input: Partial<Record<string, unknown>>): Socials {
  const out: Socials = {};
  for (const key of SOCIAL_KEYS) {
    const url = parseSocial(key, input[key]);
    if (url) out[key] = url;
  }
  return out;
}

/** "example.com" -> "https://example.com". Anything that isn't a web address is dropped. */
export function parseWebsite(value: unknown): string | null {
  const raw = text(value, 200);
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!url.hostname.includes(".") || /\s/.test(raw)) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function parseYearsInPractice(value: unknown): number | null {
  const s = text(value, 3);
  if (!s) return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 && n <= 70 ? n : null;
}

/** Safe readers for the JSON columns. */
export function readQualifications(value: unknown): Qualification[] {
  return Array.isArray(value) ? parseQualifications(value.filter((v) => v && typeof v === "object")) : [];
}
export function readSocials(value: unknown): Socials {
  return value && typeof value === "object" && !Array.isArray(value) ? parseSocials(value as Record<string, unknown>) : {};
}

/**
 * Every profile field present in a form, ready to save. Fields a form doesn't
 * include are left alone, so each step and section can save only its own part.
 * Checkbox groups and toggles post nothing when empty, so their forms include
 * `<input type="hidden" name="_present" value="goals">` to say they were shown.
 */
export function profileDataFromForm(fd: FormData) {
  const shown = new Set(fd.getAll("_present").map(String));
  const has = (key: string) => fd.has(key) || shown.has(key);
  const data: Prisma.TrichologistProfileUpdateInput = {};
  const str = (key: string, max: number) => text(fd.get(key), max) || null;

  if (has("headline")) data.headline = str("headline", 140);
  if (has("practiceName")) data.practiceName = str("practiceName", 120);
  if (has("city")) data.city = data.location = str("city", 80);
  if (has("country")) data.country = str("country", 60);
  if (has("bio")) data.bio = String(fd.get("bio") ?? "").trim().slice(0, 800) || null;
  if (has("specialisms")) {
    const list = parseList(fd.get("specialisms"), 8, 60);
    data.specialisms = list;
    data.specialization = list.slice(0, 3).join(", ").slice(0, 120) || null;
  } else if (has("specialization")) {
    // The older single "Specialism" field.
    data.specialization = str("specialization", 120);
    data.specialisms = parseList(fd.get("specialization"), 8, 60);
  }
  if (has("services")) data.services = parseList(fd.get("services"), 12, 60);
  if (has("yearsInPractice")) data.yearsInPractice = parseYearsInPractice(fd.get("yearsInPractice"));
  if (has("qualTitle")) {
    const titles = fd.getAll("qualTitle");
    const years = fd.getAll("qualYear");
    data.qualifications = parseQualifications(titles.map((title, i) => ({ title, year: years[i] })));
  }
  if (has("memberships")) {
    const known = new Set<string>(MEMBERSHIP_BODIES.map((b) => b.id));
    const ticked = fd.getAll("memberships").map(String).filter((id) => known.has(id));
    data.memberships = [...new Set([...ticked, ...parseList(fd.get("membershipsOther"), 6, 80)])].slice(0, 12);
  }
  if (has("phone")) data.phone = str("phone", 40);
  if (has("website")) data.website = parseWebsite(fd.get("website"));
  if (SOCIAL_KEYS.some((k) => has(`social_${k}`))) {
    data.socials = parseSocials(Object.fromEntries(SOCIAL_KEYS.map((k) => [k, fd.get(`social_${k}`)])));
  }
  if (has("addressLine1")) data.addressLine1 = str("addressLine1", 120);
  if (has("addressLine2")) data.addressLine2 = str("addressLine2", 120);
  if (has("postcode")) data.postcode = str("postcode", 20);
  if (has("showPhone")) data.showPhone = fd.get("showPhone") === "on";
  if (has("showAddress")) data.showAddress = fd.get("showAddress") === "on";
  if (has("goals")) {
    const known = new Set<string>(GOALS.map((g) => g.id));
    data.goals = [...new Set(fd.getAll("goals").map(String))].filter((id) => known.has(id));
  }
  if (has("interests")) {
    const known = new Set<string>(INTERESTS.map((g) => g.id));
    data.interests = [...new Set(fd.getAll("interests").map(String))].filter((id) => known.has(id));
  }
  return data;
}

/** Prisma update data is also valid create data for these scalar fields. */
export function asCreateData(data: Prisma.TrichologistProfileUpdateInput) {
  return data as Omit<Prisma.TrichologistProfileUncheckedCreateInput, "userId">;
}

// ---------------------------------------------------------------------------
// Completeness and onboarding progress
// ---------------------------------------------------------------------------

export type ProfileLike = {
  photoFileId?: string | null;
  profession?: string | null;
  headline?: string | null;
  practiceName?: string | null;
  city?: string | null;
  location?: string | null;
  country?: string | null;
  bio?: string | null;
  specialisms?: string[];
  services?: string[];
  yearsInPractice?: number | null;
  qualifications?: unknown;
  memberships?: string[];
  phone?: string | null;
  website?: string | null;
  socials?: unknown;
  addressLine1?: string | null;
  goals?: string[];
  interests?: string[];
} | null;

export type UserLike = { name?: string | null; image?: string | null; chapterId?: string | null } | null;

/** For the "complete your profile" meter. `missing` is in the order worth doing. */
export function profileCompleteness(profile: ProfileLike, user: UserLike) {
  const p = profile ?? {};
  const checks: [string, boolean][] = [
    ["your name", (user?.name ?? "").trim().length >= 2],
    ["your discipline", !!p.profession],
    ["a photo", !!p.photoFileId || !!user?.image],
    ["a headline", !!p.headline],
    ["the town you practise in", !!(p.city || p.location)],
    ["a few lines about your practice", !!p.bio],
    ["your specialisms", (p.specialisms?.length ?? 0) > 0],
    ["your services", (p.services?.length ?? 0) > 0],
    ["your qualifications", readQualifications(p.qualifications).length > 0],
    ["your professional memberships", (p.memberships?.length ?? 0) > 0],
    ["your website or social links", !!p.website || Object.keys(readSocials(p.socials)).length > 0],
    ["what you want from the community", (p.goals?.length ?? 0) > 0],
  ];
  const done = checks.filter(([, ok]) => ok).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter(([, ok]) => !ok).map(([label]) => label),
  };
}

export const ONBOARDING_STEPS = [
  { id: "discipline", label: "Discipline" },
  { id: "photo", label: "Photo" },
  { id: "practice", label: "Practice" },
  { id: "qualifications", label: "Training" },
  { id: "contact", label: "Contact" },
  { id: "goals", label: "Goals" },
  { id: "chapter", label: "Chapter" },
  { id: "finish", label: "Hello" },
] as const;
export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]["id"];

/** Which steps already have something saved. Step numbers are 1-based. */
export function filledSteps(profile: ProfileLike, user: UserLike): Record<number, boolean> {
  const p = profile ?? {};
  return {
    1: !!p.profession,
    2: !!(p.photoFileId || user?.image || p.headline || p.city || p.location),
    3: (p.specialisms?.length ?? 0) > 0 || (p.services?.length ?? 0) > 0 || p.yearsInPractice != null,
    4: readQualifications(p.qualifications).length > 0 || (p.memberships?.length ?? 0) > 0,
    5: !!(p.phone || p.website || p.addressLine1) || Object.keys(readSocials(p.socials)).length > 0,
    6: (p.goals?.length ?? 0) > 0 || (p.interests?.length ?? 0) > 0,
    7: !!user?.chapterId,
    8: false,
  };
}

/**
 * Where to resume: the first step after the furthest one reached (saved or
 * skipped) that has nothing saved yet. Step 1 is always required.
 */
export function resumeStep(filled: Record<number, boolean>, reached: number) {
  if (!filled[1]) return 1;
  for (let s = Math.max(2, reached + 1); s < ONBOARDING_STEPS.length; s++) {
    if (!filled[s]) return s;
  }
  return ONBOARDING_STEPS.length;
}

// ---------------------------------------------------------------------------
// Server helpers (dependencies load lazily; never call these from the browser)
// ---------------------------------------------------------------------------

/**
 * Save an uploaded profile photo, or remove the current one. The photo also
 * becomes User.image, so every avatar in the app shows it, and the previous
 * file is deleted. Returns null when nothing changed.
 */
export async function saveProfilePhoto(
  userId: string,
  fd: FormData,
  { field = "photo", removeField = "removePhoto" }: { field?: string; removeField?: string } = {}
): Promise<{ ok: true } | { ok: false; message: string } | null> {
  const [{ prisma }, { storeUpload, deleteStoredFile }] = await Promise.all([import("@/lib/prisma"), import("@/lib/storage")]);
  const current = await prisma.trichologistProfile.findUnique({ where: { userId }, select: { photoFileId: true } });
  const file = fd.get(field);
  const upload = await storeUpload({ kind: "avatar", file: file instanceof File ? file : null, ownerId: userId });

  if (upload && !upload.ok) return upload;
  if (upload?.ok) {
    await prisma.trichologistProfile.upsert({
      where: { userId },
      create: { userId, photoFileId: upload.file.id },
      update: { photoFileId: upload.file.id },
    });
    await prisma.user.update({ where: { id: userId }, data: { image: upload.file.url } });
    if (current?.photoFileId && current.photoFileId !== upload.file.id) await deleteStoredFile(current.photoFileId);
    return { ok: true };
  }
  if (fd.get(removeField) === "on") {
    if (current) await prisma.trichologistProfile.update({ where: { userId }, data: { photoFileId: null } });
    await prisma.user.update({ where: { id: userId }, data: { image: null } });
    await prisma.directoryListing.updateMany({ where: { userId }, data: { photoUrl: null } });
    await deleteStoredFile(current?.photoFileId);
    return { ok: true };
  }
  return null;
}

/**
 * Copy the member's profile onto their directory listing so both stay in step.
 * Basic fields always follow the profile. Full-profile fields (headline, bio,
 * website, services, photo) are only written while the listing has a full
 * profile, or when `full` is true for a paying member. Does nothing when the
 * member has no listing. Returns the listing id.
 */
export async function syncListingFromProfile(userId: string, { full = false }: { full?: boolean } = {}) {
  const [{ prisma }, { urlForFile }, { hasFullProfile }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/storage"),
    import("@/lib/directory"),
  ]);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, profile: true },
  });
  if (!user) return null;
  const email = user.email?.toLowerCase();
  const listing = await prisma.directoryListing.findFirst({
    where: { OR: [{ userId }, ...(email ? [{ email, userId: null }] : [])] },
    orderBy: { updatedAt: "desc" },
    select: { id: true, kind: true, freeUntil: true },
  });
  const profile = user.profile;
  if (!listing || !profile) return listing?.id ?? null;

  const city = profile.city || profile.location;
  const photoUrl = await urlForFile(profile.photoFileId);
  const writeFull = full || hasFullProfile(listing);

  await prisma.directoryListing.update({
    where: { id: listing.id },
    data: {
      userId,
      ...(user.name && user.name.trim().length >= 2 ? { name: user.name.trim() } : {}),
      ...(profile.profession ? { profession: profile.profession } : {}),
      ...(city ? { city } : {}),
      ...(profile.country ? { country: profile.country } : {}),
      specialization: profile.specialization || profile.specialisms[0] || null,
      phone: profile.phone,
      ...(profile.isVerified ? { isVerified: true } : {}),
      ...(writeFull
        ? {
            headline: profile.headline,
            bio: profile.bio,
            website: profile.website,
            services: profile.services,
            // A photo pasted as a link before uploads existed is kept until one is uploaded.
            ...(photoUrl ? { photoUrl } : {}),
          }
        : {}),
    },
  });
  return listing.id;
}
