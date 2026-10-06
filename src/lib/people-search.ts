import type { Prisma, Profession } from "@prisma/client";
import { PROFESSIONS } from "@/config/rooms";

/** Pure helpers for the member directory, shared by the website and the app's API. */

/** Cleans the search box: trimmed and at most 80 characters. */
export const cleanQuery = (q: unknown) => (typeof q === "string" ? q : "").trim().slice(0, 80);

/** A discipline id from a filter, or null when it isn't one of ours. */
export function parseProfession(value: unknown): Profession | null {
  return typeof value === "string" && PROFESSIONS.some((p) => p.id === value) ? (value as Profession) : null;
}

/**
 * Matches a member by name, city, practice, specialism, headline or discipline.
 * Typing "trichologist" finds clinical members because it matches the discipline's description.
 */
export function peopleSearchWhere(q: string): Prisma.UserWhereInput | undefined {
  if (!q) return undefined;
  const lower = q.toLowerCase();
  const professionMatches = PROFESSIONS.filter((p) => p.label.toLowerCase().includes(lower) || p.blurb.toLowerCase().includes(lower)).map(
    (p) => p.id as Profession
  );
  return {
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { chapter: { city: { contains: q, mode: "insensitive" } } },
      { profile: { location: { contains: q, mode: "insensitive" } } },
      { profile: { specialization: { contains: q, mode: "insensitive" } } },
      { profile: { practiceName: { contains: q, mode: "insensitive" } } },
      { profile: { city: { contains: q, mode: "insensitive" } } },
      { profile: { headline: { contains: q, mode: "insensitive" } } },
      { profile: { specialisms: { has: q } } },
      ...(professionMatches.length ? [{ profile: { profession: { in: professionMatches } } }] : []),
    ],
  };
}

/** The line under a member's name: discipline, practice or specialism, and place. */
export function personSubtitle(p: {
  discipline?: string | null;
  practiceName?: string | null;
  specialization?: string | null;
  place?: string | null;
}) {
  return [p.discipline, p.practiceName || p.specialization, p.place].filter(Boolean).join(" · ") || "Member";
}
