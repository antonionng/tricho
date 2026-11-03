/**
 * The consumer area: free accounts for members of the public, kept apart from the
 * professional member area. Its name is still to be decided, so every label reads from here.
 */
export const HUB_LABEL = "Your hair hub";

/** Where consumers land, and the only area they can use. */
export const HUB_PATH = "/hub";

/**
 * What someone wants help with, as categories only. Hair-loss concerns are health data
 * (UK GDPR Article 9), so we never ask for free-text symptoms or photos, and we only keep
 * these with separate, explicit consent.
 */
export const CONCERNS = [
  { id: "scalp", label: "A dry, oily, itchy or tight scalp" },
  { id: "shedding", label: "Shedding more hair than usual" },
  { id: "thinning", label: "Hair that is gradually getting thinner" },
  { id: "patches", label: "A bald patch" },
  { id: "care", label: "Looking after a healthy scalp and hair" },
] as const;

export type ConcernId = (typeof CONCERNS)[number]["id"];

export function isConcernId(v: unknown): v is ConcernId {
  return typeof v === "string" && CONCERNS.some((c) => c.id === v);
}

/** Only known category ids, each once. Anything else is dropped. */
export function cleanConcerns(values: unknown[]): ConcernId[] {
  return [...new Set(values.filter(isConcernId))];
}
