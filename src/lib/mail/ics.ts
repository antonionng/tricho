/**
 * A single-event iCalendar file (RFC 5545), for "Add to calendar" links in
 * event emails. Times are written in UTC so every calendar app agrees.
 */

export type IcsEvent = {
  id: string;
  title: string;
  summary?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  online: boolean;
  venue?: string | null;
  city?: string | null;
  /** The event page, included as the URL and in the description. */
  url: string;
};

/** Escape text values: backslash, semicolon, comma and newlines. */
export function icsEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function icsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Lines longer than 75 octets are folded with CRLF and a space. */
function fold(line: string) {
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = Buffer.byteLength(ch);
    if (bytes + size > (out.length ? 74 : 75)) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

export function eventLocation(e: Pick<IcsEvent, "online" | "venue" | "city">) {
  if (e.online) return "Online";
  return [e.venue, e.city].filter(Boolean).join(", ") || "Venue to be confirmed";
}

export function buildIcs(e: IcsEvent, now = new Date()) {
  // Two hours is a sensible default when no end time has been set.
  const end = e.endsAt && e.endsAt > e.startsAt ? e.endsAt : new Date(e.startsAt.getTime() + 2 * 60 * 60 * 1000);
  const description = [e.summary?.trim(), e.url].filter(Boolean).join("\n\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Trichollective//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@trichollective.net`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(e.startsAt)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsEscape(e.title)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    `LOCATION:${icsEscape(eventLocation(e))}`,
    `URL:${e.url}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
