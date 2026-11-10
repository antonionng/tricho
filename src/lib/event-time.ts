/**
 * Each event's time zone. Pure, so pages, emails, client components and tests
 * can all import it. Dublin and London share a wall clock, so both read as
 * "Irish and UK time"; the zone still matters for anything that converts times.
 */

export const DEFAULT_EVENT_TIMEZONE = "Europe/London";

/** The zones Studio offers, with how each reads after a time. */
export const EVENT_TIMEZONES: { id: string; label: string }[] = [
  { id: "Europe/London", label: "UK time (London)" },
  { id: "Europe/Dublin", label: "Irish time (Dublin)" },
];

/** A zone we can format in, falling back to London for anything unknown or missing. */
export function eventTimeZone(tz: string | null | undefined) {
  if (!tz) return DEFAULT_EVENT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_EVENT_TIMEZONE;
  }
}

/** "Irish and UK time" for the shared Dublin and London clock, otherwise the zone's city. */
export function timeZoneLabel(tz: string | null | undefined) {
  const zone = eventTimeZone(tz);
  if (zone === "Europe/London" || zone === "Europe/Dublin") return "Irish and UK time";
  return `${zone.split("/").pop()!.replace(/_/g, " ")} time`;
}

/** A Google Maps search link for a venue and its address. */
export function mapHref(parts: (string | null | undefined)[]) {
  const query = parts.map((p) => p?.trim()).filter(Boolean).join(", ");
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}
