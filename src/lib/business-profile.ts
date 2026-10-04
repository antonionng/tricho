/**
 * The guided setup a brand goes through after paying for Business or Premium Business, and
 * how complete their profile is. Pure, so the portal pages and tests share one definition.
 */

export const SETUP_STEPS = [
  { id: "details", label: "Brand details", required: true },
  { id: "logo", label: "Logo, cover and colour", required: false },
  { id: "story", label: "Your story", required: false },
  { id: "offerings", label: "Products and services", required: false },
  { id: "photos", label: "Photos", required: false },
  { id: "extras", label: "Video and features", required: false },
  { id: "contact", label: "Contact details", required: false },
  { id: "address", label: "Business address", required: false },
  { id: "perk", label: "Member perk", required: false },
  { id: "team", label: "Team seats", required: false },
  { id: "publish", label: "Preview and publish", required: true },
] as const;

export type SetupStepId = (typeof SETUP_STEPS)[number]["id"];

export function isSetupStep(value: unknown): value is SetupStepId {
  return SETUP_STEPS.some((s) => s.id === value);
}

export type ProfileSnapshot = {
  page: {
    name: string;
    category: string;
    blurb: string;
    logoUrl: string | null;
    perk: string | null;
    contactEmail: string | null;
    published: boolean;
    coverUrl?: string | null;
    tagline?: string | null;
    story?: string | null;
    offerings?: unknown;
    sections?: unknown;
    videoUrl?: string | null;
  } | null;
  org: {
    phone: string | null;
    socials: unknown;
    addressLine1: string | null;
    postcode: string | null;
    country: string | null;
  } | null;
  seats: number;
  /** How many gallery photos the page has. */
  photos?: number;
};

/** True when the page has what it needs to go live: a name, a category and a real description. */
export function readyToPublish(page: ProfileSnapshot["page"]) {
  return !!page && page.name.trim().length >= 2 && !!page.category && page.blurb.trim().length >= 20;
}

function hasSocials(value: unknown) {
  return !!value && typeof value === "object" && Object.values(value as Record<string, unknown>).some((v) => typeof v === "string" && v.trim());
}

/** Which setup steps are done. */
export function setupProgress({ page, org, seats, photos = 0 }: ProfileSnapshot): Record<SetupStepId, boolean> {
  const filled = (v: unknown) => Array.isArray(v) && v.length > 0;
  return {
    details: readyToPublish(page),
    logo: !!page?.logoUrl && !!page?.coverUrl,
    story: !!(page?.tagline?.trim() && page?.story?.trim()),
    offerings: filled(page?.offerings),
    photos: photos > 0,
    extras: !!page?.videoUrl || filled(page?.sections),
    contact: !!(page?.contactEmail || org?.phone || hasSocials(org?.socials)),
    address: !!(org?.addressLine1 && org?.postcode && org?.country),
    perk: !!page?.perk?.trim(),
    team: seats > 0,
    publish: !!page?.published,
  };
}

/** Where to resume: the first step not yet done, or the preview when everything is. */
export function nextSetupStep(progress: Record<SetupStepId, boolean>): SetupStepId {
  return SETUP_STEPS.find((s) => !progress[s.id])?.id ?? "publish";
}

/** The step after this one, for the Continue buttons. */
export function stepAfter(step: SetupStepId): SetupStepId {
  const i = SETUP_STEPS.findIndex((s) => s.id === step);
  return SETUP_STEPS[Math.min(i + 1, SETUP_STEPS.length - 1)].id;
}

export const SOCIAL_NETWORKS = [
  { id: "instagram", label: "Instagram", host: "instagram.com" },
  { id: "linkedin", label: "LinkedIn", host: "linkedin.com" },
  { id: "tiktok", label: "TikTok", host: "tiktok.com" },
  { id: "facebook", label: "Facebook", host: "facebook.com" },
  { id: "youtube", label: "YouTube", host: "youtube.com" },
] as const;
export type SocialId = (typeof SOCIAL_NETWORKS)[number]["id"];

/**
 * A social profile as a safe https link on that network. Accepts a full link, a link without
 * the scheme, or a handle such as "@brand". Null when it can't be made into one.
 */
export function socialUrl(network: SocialId, raw: string | null | undefined) {
  const value = (raw ?? "").trim();
  if (!value) return null;
  const net = SOCIAL_NETWORKS.find((n) => n.id === network)!;
  const handle = value.replace(/^@/, "");
  if (/^[A-Za-z0-9._-]{1,60}$/.test(handle) && !handle.includes(".")) {
    const path = network === "tiktok" || network === "youtube" ? `@${handle}` : network === "linkedin" ? `company/${handle}` : handle;
    return `https://www.${net.host}/${path}`;
  }
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (host !== net.host && !host.endsWith(`.${net.host}`)) return null;
    url.protocol = "https:";
    return url.toString();
  } catch {
    return null;
  }
}

/** The saved socials as safe links, in a fixed order, for the public page. */
export function socialLinks(value: unknown) {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  return SOCIAL_NETWORKS.flatMap((n) => {
    const url = typeof record[n.id] === "string" ? socialUrl(n.id, record[n.id] as string) : null;
    return url ? [{ id: n.id, label: n.label, url }] : [];
  });
}
