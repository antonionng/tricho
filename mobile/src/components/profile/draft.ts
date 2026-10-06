import type { EditableProfile } from "./types";

/**
 * The profile as the app's forms edit it, and the website's form fields each
 * part posts (the names profileDataFromForm reads). Pure, so it is tested
 * alongside the server in src/lib/mobile/app-helpers.test.ts.
 */
export type Draft = {
  name: string;
  profession: string;
  chapter: string;
  headline: string;
  practiceName: string;
  city: string;
  country: string;
  bio: string;
  specialisms: string;
  services: string;
  yearsInPractice: string;
  quals: { title: string; year: string }[];
  memberships: string[];
  membershipsOther: string;
  phone: string;
  website: string;
  socials: Record<string, string>;
  addressLine1: string;
  addressLine2: string;
  postcode: string;
  showPhone: boolean;
  showAddress: boolean;
  goals: string[];
  interests: string[];
};

export function draftFrom(
  p: EditableProfile,
  {
    name = "",
    profession = "",
    chapter = "",
    fallbackCity = "",
    knownBodies = [],
    extraRows = 2,
  }: { name?: string | null; profession?: string | null; chapter?: string | null; fallbackCity?: string | null; knownBodies?: string[]; extraRows?: number } = {}
): Draft {
  const known = new Set(knownBodies);
  const saved = p.qualifications.map((q) => ({ title: q.title, year: q.year ? String(q.year) : "" }));
  const blanks = Math.max(extraRows, 3 - saved.length);
  return {
    name: name ?? "",
    profession: profession ?? "",
    chapter: chapter ?? "",
    headline: p.headline ?? "",
    practiceName: p.practiceName ?? "",
    city: p.city ?? fallbackCity ?? "",
    country: p.country ?? "",
    bio: p.bio ?? "",
    specialisms: p.specialisms.join(", "),
    services: p.services.join(", "),
    yearsInPractice: p.yearsInPractice == null ? "" : String(p.yearsInPractice),
    quals: [...saved, ...Array.from({ length: blanks }, () => ({ title: "", year: "" }))],
    memberships: p.memberships.filter((m) => known.has(m)),
    membershipsOther: p.memberships.filter((m) => !known.has(m)).join(", "),
    phone: p.phone ?? "",
    website: p.website ?? "",
    socials: { ...p.socials },
    addressLine1: p.addressLine1 ?? "",
    addressLine2: p.addressLine2 ?? "",
    postcode: p.postcode ?? "",
    showPhone: p.showPhone,
    showAddress: p.showAddress,
    goals: [...p.goals],
    interests: [...p.interests],
  };
}

export type FieldGroup = "about" | "identity" | "bio" | "practice" | "qualifications" | "contact" | "goals";

type Fields = Record<string, string | string[] | undefined>;

/**
 * The form fields for some parts of the profile. Checkbox groups and toggles
 * send `_present` so an empty choice still saves, as the website's forms do.
 */
export function fieldsFor(groups: FieldGroup[], d: Draft, socialKeys: string[] = []): Fields {
  const out: Fields = {};
  const present: string[] = [];
  for (const group of groups) {
    switch (group) {
      case "about":
        Object.assign(out, { name: d.name.trim(), profession: d.profession, chapter: d.chapter || "none" });
        break;
      case "identity":
        Object.assign(out, { headline: d.headline, practiceName: d.practiceName, city: d.city, country: d.country });
        break;
      case "bio":
        out.bio = d.bio;
        break;
      case "practice":
        Object.assign(out, { specialisms: d.specialisms, services: d.services, yearsInPractice: d.yearsInPractice });
        break;
      case "qualifications": {
        // At least one row, so an emptied list still clears the saved qualifications.
        const rows = d.quals.length ? d.quals : [{ title: "", year: "" }];
        out.qualTitle = rows.map((r) => r.title);
        out.qualYear = rows.map((r) => r.year);
        out.memberships = d.memberships;
        out.membershipsOther = d.membershipsOther;
        present.push("memberships");
        break;
      }
      case "contact":
        Object.assign(out, {
          phone: d.phone,
          website: d.website,
          addressLine1: d.addressLine1,
          addressLine2: d.addressLine2,
          postcode: d.postcode,
          showPhone: d.showPhone ? "on" : undefined,
          showAddress: d.showAddress ? "on" : undefined,
        });
        for (const key of socialKeys) out[`social_${key}`] = d.socials[key] ?? "";
        present.push("showPhone", "showAddress");
        break;
      case "goals":
        out.goals = d.goals;
        out.interests = d.interests;
        present.push("goals", "interests");
        break;
    }
  }
  if (present.length) out._present = present;
  return out;
}

/** Adds or removes an id from a list of ticked choices. */
export const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
