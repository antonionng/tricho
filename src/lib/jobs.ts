import type { Prisma } from "@prisma/client";

/** How long a role stays on the board before it closes on its own. Reopening starts the clock again. */
export const JOB_DAYS = 60;
/** Open roles a business can have at once. */
export const MAX_OPEN_JOBS = 10;

export const EMPLOYMENT = {
  full_time: "Full time",
  part_time: "Part time",
  contract: "Contract",
  self_employed: "Self-employed",
  chair_rental: "Chair or room rental",
} as const;
export type Employment = keyof typeof EMPLOYMENT;

export const WORKPLACE = {
  on_site: "On site",
  hybrid: "Hybrid",
  remote: "Remote",
} as const;
export type Workplace = keyof typeof WORKPLACE;

export function employmentLabel(value: string) {
  return EMPLOYMENT[value as Employment] ?? value;
}
export function workplaceLabel(value: string) {
  return WORKPLACE[value as Workplace] ?? value;
}

/** Roles anyone can see: open, in date, not taken down, on a live business page. */
export function liveJobWhere(now = new Date()): Prisma.JobWhereInput {
  return {
    status: "open",
    hiddenAt: null,
    expiresAt: { gt: now },
    partner: { published: true, hidden: false },
  };
}

export function jobExpiry(from = new Date()) {
  return new Date(from.getTime() + JOB_DAYS * 24 * 60 * 60 * 1000);
}

export type JobInput = {
  title: string;
  employment: Employment;
  workplace: Workplace;
  location: string;
  country: string | null;
  pay: string | null;
  summary: string;
  description: string;
  applyUrl: string | null;
  applyEmail: string | null;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanHttpUrl(value: string) {
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Checks a job form. Returns the cleaned role or the first problem, written for the person filling it in. */
export function parseJobForm(get: (key: string) => string): { ok: true; value: JobInput } | { ok: false; error: string } {
  const text = (key: string, max: number) => get(key).trim().slice(0, max);
  const title = text("title", 120);
  const employment = text("employment", 40);
  const workplace = text("workplace", 40) || "on_site";
  const location = text("location", 120);
  const summary = text("summary", 240);
  const description = text("description", 8000);
  const rawUrl = text("applyUrl", 500);
  const applyEmail = text("applyEmail", 160).toLowerCase();

  if (!title) return { ok: false, error: "Please give the role a title." };
  if (!(employment in EMPLOYMENT)) return { ok: false, error: "Please choose the type of role." };
  if (!(workplace in WORKPLACE)) return { ok: false, error: "Please choose where the work happens." };
  if (!location) return { ok: false, error: "Please say where the role is based, such as the town or city." };
  if (!summary) return { ok: false, error: "Please add one sentence that sums up the role." };
  if (description.length < 80) return { ok: false, error: "Please describe the role in a little more detail, so candidates know what it involves." };
  const applyUrl = cleanHttpUrl(rawUrl);
  if (rawUrl && !applyUrl) return { ok: false, error: "Please check the application link." };
  if (applyEmail && !EMAIL.test(applyEmail)) return { ok: false, error: "Please check the application email address." };
  if (!applyUrl && !applyEmail) return { ok: false, error: "Please add an email address or a link where candidates can apply." };

  return {
    ok: true,
    value: {
      title,
      employment: employment as Employment,
      workplace: workplace as Workplace,
      location,
      country: text("country", 80) || null,
      pay: text("pay", 120) || null,
      summary,
      description,
      applyUrl,
      applyEmail: applyEmail || null,
    },
  };
}

/** Paragraphs from a description, split on blank lines. */
export function jobParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
