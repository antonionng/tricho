import type { EventKind } from "@prisma/client";

/** Pure helpers for turning event form values (or an AI draft) into Event fields. */

export const EVENT_KINDS: EventKind[] = ["gathering", "masterclass", "case_round", "chapter_meetup", "welcome"];

/** datetime-local values are London wall-clock time. */
export function londonToDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const guess = new Date(`${value}:00Z`);
  if (Number.isNaN(guess.getTime())) return null;
  const inLondon = new Date(guess.toLocaleString("en-US", { timeZone: "Europe/London" }));
  const inUtc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(guess.getTime() - (inLondon.getTime() - inUtc.getTime()));
}

/** A date as the London wall-clock value a datetime-local input expects: "YYYY-MM-DDTHH:mm". */
export function dateToLondonInput(d: Date | null | undefined) {
  if (!d || Number.isNaN(d.getTime())) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function cleanUrl(value: string) {
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    return null;
  }
}

export function pounds(value: string) {
  const n = Math.round(Number(value || 0));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export type EventInput = {
  title: string;
  kind: EventKind;
  summary: string;
  body: string | null;
  startsAt: Date;
  endsAt: Date | null;
  online: boolean;
  city: string | null;
  venue: string | null;
  priceGBP: number;
  memberPriceGBP: number;
  capacity: number | null;
  ticketUrl: string | null;
  published: boolean;
};

export type RequiredEventField = "title" | "kind" | "summary" | "startsAt";

export type EventValidation =
  | { ok: true; data: EventInput }
  | { ok: false; missing: RequiredEventField[]; data: Partial<EventInput> };

type Raw = Record<string, string | boolean | undefined>;

function text(raw: Raw, key: string, max = 20000) {
  const v = raw[key];
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

/** Checkbox values arrive as "on" from a form, or as booleans from code. */
function flag(raw: Raw, key: string) {
  const v = raw[key];
  return v === true || v === "on" || v === "true";
}

/**
 * Validate and normalise event fields. Shared by the Studio form and the AI
 * prefill, so both apply exactly the same rules.
 */
export function validateEventInput(raw: Raw): EventValidation {
  const title = text(raw, "title", 160);
  const kindRaw = text(raw, "kind", 32) as EventKind;
  const kind = EVENT_KINDS.includes(kindRaw) ? kindRaw : undefined;
  const summary = text(raw, "summary", 400);
  const startsAt = londonToDate(text(raw, "startsAt", 32));
  const endsAt = londonToDate(text(raw, "endsAt", 32));
  const online = flag(raw, "online");
  const capacityRaw = text(raw, "capacity", 8);

  const rest = {
    body: text(raw, "body") || null,
    endsAt,
    online,
    city: online ? null : text(raw, "city", 80) || null,
    venue: online ? null : text(raw, "venue", 160) || null,
    priceGBP: pounds(text(raw, "priceGBP", 8)),
    memberPriceGBP: pounds(text(raw, "memberPriceGBP", 8)),
    capacity: capacityRaw ? Math.max(0, Math.round(Number(capacityRaw))) || null : null,
    ticketUrl: cleanUrl(text(raw, "ticketUrl", 500)),
    published: flag(raw, "published"),
  };

  const missing: RequiredEventField[] = [];
  if (!title) missing.push("title");
  if (!kind) missing.push("kind");
  if (!summary) missing.push("summary");
  if (!startsAt) missing.push("startsAt");

  if (missing.length || !kind || !startsAt) {
    return {
      ok: false,
      missing,
      data: {
        ...rest,
        ...(title ? { title } : {}),
        ...(kind ? { kind } : {}),
        ...(summary ? { summary } : {}),
        ...(startsAt ? { startsAt } : {}),
      },
    };
  }
  return { ok: true, data: { title, kind, summary, startsAt, ...rest } };
}

/** The event form's values as strings, used to pre-fill it from a stored draft. */
export type EventFormValues = {
  title: string;
  kind: string;
  summary: string;
  body: string;
  startsAt: string;
  endsAt: string;
  online: boolean;
  city: string;
  venue: string;
  priceGBP: string;
  memberPriceGBP: string;
  capacity: string;
  ticketUrl: string;
  published: boolean;
};

/** Read stored prefill fields back into form values, ignoring anything unexpected. */
export function formValuesFromPayload(payload: unknown): EventFormValues | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const p = payload as Record<string, unknown>;
  const str = (k: string) => (typeof p[k] === "string" ? (p[k] as string) : typeof p[k] === "number" ? String(p[k]) : "");
  const kind = str("kind");
  return {
    title: str("title"),
    kind: EVENT_KINDS.includes(kind as EventKind) ? kind : "gathering",
    summary: str("summary"),
    body: str("body"),
    startsAt: str("startsAt"),
    endsAt: str("endsAt"),
    online: p.online === true,
    city: str("city"),
    venue: str("venue"),
    priceGBP: str("priceGBP") || "0",
    memberPriceGBP: str("memberPriceGBP") || "0",
    capacity: str("capacity"),
    ticketUrl: str("ticketUrl"),
    published: p.published === true,
  };
}

/** Which required fields a set of form values still lacks. */
export function missingEventFields(values: EventFormValues): RequiredEventField[] {
  const result = validateEventInput(values);
  return result.ok ? [] : result.missing;
}
