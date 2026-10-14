/**
 * How to address someone by name in a sentence. A title stays with the
 * surname, so "Dr Sample Okafor" becomes "Dr Okafor", never "Dr".
 */
export function shortName(name: string | null | undefined, fallback = "") {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  if (/^(dr|mr|mrs|ms|miss|mx|prof|professor)\.?$/i.test(parts[0])) {
    return parts.length > 1 ? `${parts[0].replace(/\.$/, "")} ${parts[parts.length - 1]}` : fallback;
  }
  return parts[0];
}

/** A name typed into a form, tidied, or null if it is too short to be one. */
export function cleanName(v: unknown) {
  if (typeof v !== "string") return null;
  const n = v.replace(/\s+/g, " ").trim().slice(0, 80);
  return n.length >= 2 ? n : null;
}
