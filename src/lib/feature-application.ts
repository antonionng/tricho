/**
 * Applications to be featured on the podcast or Trichollective TV.
 * Pure parsing, so the form, the server action and the tests share one set of rules.
 */

export const FEATURE_FORMATS = [
  {
    id: "podcast",
    label: "The podcast",
    hint: "An audio conversation, published with a transcript.",
  },
  {
    id: "tv",
    label: "Trichollective TV",
    hint: "A filmed feature you can record on a phone or camera you already have.",
  },
  {
    id: "either",
    label: "Either format",
    hint: "You are happy for the team to choose.",
  },
] as const;

export const FEATURE_ROLES = [
  {
    id: "interview",
    label: "I'd like to be interviewed",
    hint: "You share your expertise, story or work, and we ask the questions.",
  },
  {
    id: "host",
    label: "I'd like to lead the feature",
    hint: "You propose it and host it, recording from where you already work.",
  },
] as const;

export type FeatureFormatId = (typeof FEATURE_FORMATS)[number]["id"];
export type FeatureRoleId = (typeof FEATURE_ROLES)[number]["id"];

export type FeatureFields = {
  name: string;
  email: string;
  share: string;
  format: string;
  role: string;
  place: string;
};

export type FeatureApplication = {
  name: string;
  email: string;
  share: string;
  format: FeatureFormatId;
  formatLabel: string;
  role: FeatureRoleId;
  roleLabel: string;
  place: string;
};

export type ParsedFeature =
  | { ok: true; ignored: true }
  | { ok: true; application: FeatureApplication; fields: FeatureFields }
  | { ok: false; message: string; fields: FeatureFields };

function field(formData: FormData, name: string, max: number) {
  return String(formData.get(name) ?? "").trim().slice(0, max);
}

const formatById = (id: string) => FEATURE_FORMATS.find((f) => f.id === id);
const roleById = (id: string) => FEATURE_ROLES.find((r) => r.id === id);

/** Reads the Be Featured form. A filled honeypot is treated as success and ignored. */
export function parseFeatureApplication(formData: FormData): ParsedFeature {
  const fields: FeatureFields = {
    name: field(formData, "name", 120),
    email: field(formData, "email", 160).toLowerCase(),
    share: field(formData, "share", 4000),
    format: field(formData, "format", 40),
    role: field(formData, "role", 40),
    place: field(formData, "place", 120),
  };

  if (field(formData, "company_site", 200)) return { ok: true, ignored: true };

  if (fields.name.length < 2) {
    return { ok: false, message: "Please tell us your name.", fields };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return { ok: false, message: "Please check your email address.", fields };
  }
  if (fields.share.length < 20) {
    return { ok: false, message: "Please tell us what you'd like to share, in a sentence or two.", fields };
  }
  const format = formatById(fields.format);
  if (!format) {
    return { ok: false, message: "Please choose the podcast, Trichollective TV, or either.", fields };
  }
  const role = roleById(fields.role);
  if (!role) {
    return { ok: false, message: "Please tell us whether you'd like to be interviewed or to lead the feature.", fields };
  }

  return {
    ok: true,
    fields,
    application: {
      name: fields.name,
      email: fields.email,
      share: fields.share,
      format: format.id,
      formatLabel: format.label,
      role: role.id,
      roleLabel: role.label,
      place: fields.place,
    },
  };
}
