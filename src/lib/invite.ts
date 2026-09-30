import { LISTING_COUNTRIES } from "@/content/chapters";

export type InviteDiscipline = "cosmetic" | "clinical" | "medical";

export type InviteLine = {
  /** 1-based line number in the pasted text, for error messages. */
  line: number;
  name: string;
  email: string;
  profession: InviteDiscipline;
  city: string;
  country: (typeof LISTING_COUNTRIES)[number];
};

export type InviteLineProblem = {
  line: number;
  text: string;
  reason: string;
};

export type ParsedInvites = {
  valid: InviteLine[];
  problems: InviteLineProblem[];
};

const EMAIL = /^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]{2,}$/;

/** Words people actually type, mapped to the three directory disciplines. */
const DISCIPLINE_WORDS: [RegExp, InviteDiscipline][] = [
  [/^cosmetic$/, "cosmetic"],
  [/^clinical$/, "clinical"],
  [/^medical$/, "medical"],
  [/trichologist|trichology/, "clinical"],
  [/doctor|^dr\.?$|dermatolog|\bgp\b|nurse|surgeon/, "medical"],
  [/stylist|hairdresser|head ?spa|scalp therap|barber/, "cosmetic"],
];

export function mapDiscipline(value: string): InviteDiscipline | null {
  const v = value.trim().toLowerCase();
  if (!v) return null;
  for (const [pattern, id] of DISCIPLINE_WORDS) if (pattern.test(v)) return id;
  return null;
}

const COUNTRY_ALIASES: Record<string, (typeof LISTING_COUNTRIES)[number]> = {
  roi: "Ireland",
  "republic of ireland": "Ireland",
  eire: "Ireland",
  ni: "Northern Ireland",
  us: "United States",
  usa: "United States",
  "united states of america": "United States",
};

export function mapCountry(value: string): (typeof LISTING_COUNTRIES)[number] | null {
  const v = value.trim().toLowerCase().replace(/\.$/, "");
  if (!v) return "Ireland";
  const exact = LISTING_COUNTRIES.find((c) => c.toLowerCase() === v);
  return exact ?? COUNTRY_ALIASES[v] ?? null;
}

/**
 * Turn a pasted block of "Name, email, discipline, town, country" lines into
 * invitations. Only name and email are required. Discipline defaults to clinical
 * and country to Ireland. Blank lines and lines starting with # are ignored.
 * Repeated emails within the paste are reported once and skipped.
 */
export function parseInviteLines(text: string): ParsedInvites {
  const valid: InviteLine[] = [];
  const problems: InviteLineProblem[] = [];
  const seen = new Set<string>();

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = index + 1;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    // Commas, or tabs when pasted from a spreadsheet.
    const parts = (trimmed.includes("\t") ? trimmed.split("\t") : trimmed.split(",")).map((p) => p.trim());
    const [name = "", emailRaw = "", disciplineRaw = "", city = "", countryRaw = ""] = parts;
    const email = emailRaw.replace(/^mailto:/i, "").toLowerCase();
    const problem = (reason: string) => problems.push({ line, text: trimmed.slice(0, 200), reason });

    if (name.length < 2) return problem("A name is needed.");
    if (!EMAIL.test(email)) return problem("That email address doesn't look right.");
    if (seen.has(email)) return problem("This email appears more than once in the list.");

    const profession = disciplineRaw ? mapDiscipline(disciplineRaw) : "clinical";
    if (!profession) return problem(`"${disciplineRaw}" isn't a discipline we recognise. Use cosmetic, clinical or medical.`);

    const country = mapCountry(countryRaw);
    if (!country) return problem(`"${countryRaw}" isn't one of the directory countries: ${LISTING_COUNTRIES.join(", ")}.`);

    seen.add(email);
    valid.push({ line, name: name.slice(0, 80), email: email.slice(0, 120), profession, city: city.slice(0, 80), country });
  });

  return { valid, problems };
}

export function firstName(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = /^(dr|mr|mrs|ms|miss|prof)\.?$/i.test(parts[0] ?? "") && parts[1] ? parts[1] : parts[0];
  return first || name.trim();
}

/** "5 October", from the launch date in the site config. */
function launchDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "Europe/Dublin" });
}

export function inviteLink(baseUrl: string, token: string) {
  return `${baseUrl.replace(/\/$/, "")}/directory/list?invite=${encodeURIComponent(token)}`;
}

/**
 * The invitation email, written in the founder's voice for her to approve. It
 * says nothing about her beyond the invitation itself; anything personal goes
 * in her own note, which is added word for word.
 */
export function composeInviteEmail({
  name,
  token,
  note,
  founderFull,
  baseUrl,
  launchTitle,
  launchStartsAt,
  freeDays,
}: {
  name: string;
  token: string;
  note?: string;
  founderFull: string;
  baseUrl: string;
  launchTitle: string;
  launchStartsAt: string;
  freeDays: number;
}) {
  const subject = "An invitation to the Trichollective founding directory";
  const personal = note?.trim();
  const body = [
    `Dear ${firstName(name)},`,
    `I'm ${founderFull}, the founder of Trichollective, and I'd like to invite you to join our founding directory.`,
    "Trichollective brings cosmetic, clinical and medical hair and scalp professionals together, and the directory is where people looking for help find the right practitioner near them. I'm inviting a small number of practitioners to be among the first listed.",
    `A basic listing is free for good. It shows your name, discipline and town, so people searching in your area can find you. For your first ${freeDays} days you also have the full profile, with your photo, services and website, and enquiries from the public come straight to you. After that, the Professional plan keeps the full profile and enquiries, or you can simply stay on the free basic listing.`,
    `The form takes about a minute, and I've filled in the details I already have, so you only need to check them:\n${inviteLink(baseUrl, token)}`,
    ...(personal ? [personal] : []),
    `We launch at ${launchTitle} on ${launchDay(launchStartsAt)}, and it would be lovely to have you listed from the start. If you have any questions, just reply to this email.`,
    `Warm wishes,\n${founderFull}\nFounder, Trichollective`,
  ].join("\n\n");
  return { subject, body };
}
