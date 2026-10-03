import type { ReferralStatus } from "@prisma/client";

/**
 * Client referrals between practitioners. A referral passes a client's needs from
 * one member to another without ever carrying who the client is: the sender
 * describes the concern, and the client is introduced outside the platform.
 * Everything here is pure so it can be tested without a database.
 */

export const SUMMARY_MIN = 20;
export const SUMMARY_MAX = 2000;
export const REASON_MAX = 300;
export const CONTEXT_MAX = 120;
export const NOTE_MAX = 1000;

export type ReferralInput = { summary: string; reason: string | null; clientContext: string | null };

export type Finding = {
  kind: "email" | "phone" | "date" | "name" | "postcode";
  /** Emails and phone numbers block the referral; everything else is a warning the sender can override. */
  severity: "block" | "warn";
  message: string;
};

const clean = (v: unknown) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "");

/** Checks the lengths of a referral and returns tidy values, or the first problem in a full sentence. */
export function validateReferral(raw: { summary?: unknown; reason?: unknown; clientContext?: unknown }):
  | { ok: true; data: ReferralInput }
  | { ok: false; error: string } {
  const summary = clean(raw.summary);
  const reason = clean(raw.reason).replace(/\s+/g, " ");
  const clientContext = clean(raw.clientContext).replace(/\s+/g, " ");
  if (summary.length < SUMMARY_MIN) {
    return { ok: false, error: `Please describe the client's concern in at least ${SUMMARY_MIN} characters, so your colleague can judge whether they can help.` };
  }
  if (summary.length > SUMMARY_MAX) {
    return { ok: false, error: `Please keep the summary to ${SUMMARY_MAX.toLocaleString("en-GB")} characters or fewer.` };
  }
  if (reason.length > REASON_MAX) {
    return { ok: false, error: `Please keep the reason for this referral to ${REASON_MAX} characters or fewer.` };
  }
  if (clientContext.length > CONTEXT_MAX) {
    return { ok: false, error: `Please keep the client context to ${CONTEXT_MAX} characters or fewer, such as "Woman in her 40s".` };
  }
  return { ok: true, data: { summary, reason: reason || null, clientContext: clientContext || null } };
}

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
// Runs of digits joined by spaces, dots, dashes or brackets. Counted as a phone number at nine digits or more.
const PHONE_RUN = /\+?\(?\d[\d\s().-]{6,}\d/g;
const DOB_WORDS = /\b(d\.?o\.?b\.?|date of birth|birthday|born on|born in \d{4})\b/i;
const NUMERIC_DATE = /\b\d{1,2}[/.-]\d{1,2}[/.-](\d{4}|\d{2})\b/;
const MONTHS = "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";
const WORD_DATE = new RegExp(`\\b\\d{1,2}(st|nd|rd|th)?\\s+(${MONTHS})\\s+(19|20)\\d{2}\\b`, "i");
// Doctors are left out: a referral often names the client's GP or dermatologist, which is fine.
const HONORIFIC_NAME = /\b(?:[Mm]rs?|[Mm]s|[Mm]iss|[Mm]x|[Mm]aster)\.?\s+[A-Z][a-z'’-]+/;
const NAMED = /\b(?:[Hh]er|[Hh]is|[Tt]heir|[Cc]lient'?s|[Pp]atient'?s) name is\s+[A-Z]|\b(?:called|named)\s+[A-Z][a-z'’-]+/;
// UK and Irish (Eircode) postcodes.
const POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}|[AC-FHKNPRTV-Y]\d{2}\s?[AC-FHKNPRTV-Y\d]{4})\b/;

// Capitalised words that often sit side by side in clinical writing and are not names.
const NOT_NAMES = new Set(
  (
    "I The A An She He They Her His Their Client Patient Female Male Pattern Hair Loss Alopecia Areata Androgenetic Telogen Anagen " +
    "Effluvium Frontal Fibrosing Lichen Planopilaris Traction Scarring Discoid Lupus Seborrhoeic Dermatitis Psoriasis Tinea Capitis " +
    "Central Centrifugal Cicatricial Polycystic Ovary Syndrome PCOS Iron Vitamin Ferritin Thyroid HRT GP NHS HSE Monday Tuesday " +
    "Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December " +
    "Dublin London Ireland England Scotland Wales Northern Irish British UK Minoxidil Finasteride Dutasteride Spironolactone PRP LLLT " +
    "Afro Caribbean Asian Black White European Trichologist Trichology Dermatologist Dermatology Hairdresser Salon Clinic Consultant Dr"
  ).split(" ")
);

function phoneLike(text: string) {
  for (const m of text.matchAll(PHONE_RUN)) {
    if (m[0].includes("/")) continue;
    if (m[0].replace(/\D/g, "").length >= 9) return true;
  }
  return false;
}

function fullNameLike(text: string) {
  if (HONORIFIC_NAME.test(text) || NAMED.test(text)) return true;
  // Two capitalised words together in the middle of a sentence, such as "saw Mary Byrne last week".
  const re = /([^\s.!?\n])\s+([A-Z][a-z'’-]{1,})\s+([A-Z][a-z'’-]{1,})\b/g;
  for (const m of text.matchAll(re)) {
    if (!NOT_NAMES.has(m[2]) && !NOT_NAMES.has(m[3])) return true;
  }
  return false;
}

/**
 * A cautious check for details that could identify a client. It is a safety net,
 * not a guarantee: emails and phone numbers block the referral, and anything that
 * looks like a date of birth, a name or a postcode is shown as a warning.
 */
export function looksIdentifying(text: string): Finding[] {
  const t = text ?? "";
  const out: Finding[] = [];
  if (EMAIL.test(t)) {
    out.push({ kind: "email", severity: "block", message: "It contains an email address. Please remove it, as referrals must never include a client's contact details." });
  }
  if (phoneLike(t)) {
    out.push({ kind: "phone", severity: "block", message: "It contains what looks like a phone number. Please remove it, as referrals must never include a client's contact details." });
  }
  if (DOB_WORDS.test(t) || NUMERIC_DATE.test(t) || WORD_DATE.test(t)) {
    out.push({ kind: "date", severity: "warn", message: "It mentions what may be a date of birth or a full date. An age range, such as \"in her 40s\", is enough." });
  }
  if (fullNameLike(t)) {
    out.push({ kind: "name", severity: "warn", message: "It may include a person's name. Please refer to the client as \"the client\" rather than by name." });
  }
  if (POSTCODE.test(t)) {
    out.push({ kind: "postcode", severity: "warn", message: "It may include a postcode or Eircode. A town or area is enough." });
  }
  return out;
}

/** Runs the check over every field of a referral, without repeating the same kind of finding. */
export function referralFindings(input: ReferralInput): Finding[] {
  const seen = new Set<string>();
  const out: Finding[] = [];
  for (const text of [input.summary, input.reason ?? "", input.clientContext ?? ""]) {
    for (const f of looksIdentifying(text)) {
      if (seen.has(f.kind)) continue;
      seen.add(f.kind);
      out.push(f);
    }
  }
  return out;
}

export type Recipient = {
  id: string;
  /** Whether they can use the member area at all. */
  active: boolean;
  professional: boolean;
  /** The acceptsReferrals setting on each of their directory listings. */
  listings: boolean[];
};

/**
 * Whether this member may send a referral to this recipient, or the reason they cannot.
 * A member who has opted out on every listing is respected even if they are a professional.
 */
export function referralBlocker(sender: { id: string; professional: boolean }, recipient: Recipient | null): string | null {
  if (!sender.professional) return "Referrals are part of Professional membership, so you can send one once you are on the Professional plan.";
  if (!recipient || !recipient.active) return "We could not find this member, so the referral was not sent.";
  if (recipient.id === sender.id) return "You cannot refer a client to yourself.";
  const optedOut = recipient.listings.length > 0 && recipient.listings.every((a) => !a);
  if (optedOut) return "This member has chosen not to receive referrals through Trichollective.";
  const listingAccepts = recipient.listings.some(Boolean);
  if (!listingAccepts && !recipient.professional) {
    return "This member cannot receive referrals yet, because referrals go to Professional members and practitioners listed in the directory.";
  }
  return null;
}

export type ReferralAction = "open" | "accept" | "decline";

/**
 * The status a referral moves to when someone acts on it. Opening only matters
 * the first time the recipient reads it; accepting and declining are final.
 */
export function nextReferralStatus(
  current: ReferralStatus,
  action: ReferralAction,
  isRecipient: boolean
): { ok: true; status: ReferralStatus; changed: boolean } | { ok: false; error: string } {
  if (!isRecipient) {
    if (action === "open") return { ok: true, status: current, changed: false };
    return { ok: false, error: "Only the member who received this referral can respond to it." };
  }
  const open = current === "sent" || current === "seen";
  if (action === "open") {
    return current === "sent" ? { ok: true, status: "seen", changed: true } : { ok: true, status: current, changed: false };
  }
  if (!open) return { ok: false, error: "You have already responded to this referral." };
  return { ok: true, status: action === "accept" ? "accepted" : "declined", changed: true };
}

export const REFERRAL_STATUS_LABEL: Record<ReferralStatus, string> = {
  sent: "New",
  seen: "Read",
  accepted: "Accepted",
  declined: "Declined",
};

/** What the sender sees for each status, in a full sentence. */
export function statusSentence(status: ReferralStatus, otherName: string, side: "sent" | "received") {
  if (side === "received") {
    if (status === "accepted") return "You accepted this referral.";
    if (status === "declined") return "You declined this referral.";
    return "This referral is waiting for your answer.";
  }
  if (status === "sent") return `${otherName} has not opened this referral yet.`;
  if (status === "seen") return `${otherName} has read this referral and has not answered yet.`;
  if (status === "accepted") return `${otherName} accepted this referral.`;
  return `${otherName} declined this referral.`;
}

/** Tidies a response note: optional, single paragraph breaks kept, capped in length. */
export function cleanNote(v: unknown) {
  const s = clean(v).slice(0, NOTE_MAX);
  return s || null;
}
