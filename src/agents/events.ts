import { z } from "zod";
import type { EventKind } from "@prisma/client";
import { site } from "@/config/site";
import { EVENT_KINDS, cleanUrl, dateToLondonInput } from "@/lib/event-input";
import { generate, generateStructured } from "./ai";

const LONDON_INPUT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const eventSchema = z.object({
  title: z.string().describe("A clear event title, under 80 characters."),
  kind: z.enum(EVENT_KINDS as [EventKind, ...EventKind[]]),
  summary: z.string().describe("One or two complete sentences for the event card, at most 400 characters."),
  body: z.string().nullable().describe("Plain text description. Paragraphs separated by a blank line. Null if the sentence gives too little to say."),
  startsAt: z.string().nullable().describe('Start in London time as "YYYY-MM-DDTHH:mm", or null if no date can be worked out.'),
  endsAt: z.string().nullable().describe('End in London time as "YYYY-MM-DDTHH:mm", or null if not given.'),
  online: z.boolean(),
  city: z.string().nullable(),
  venue: z.string().nullable(),
  priceGBP: z.number().int().describe("Guest price in whole pounds. 0 if free or not given."),
  memberPriceGBP: z.number().int().describe("Member price in whole pounds. 0 if free or not given."),
  capacity: z.number().int().nullable(),
  ticketUrl: z.string().nullable(),
});

export type EventDraftFields = {
  title: string;
  kind: EventKind;
  summary: string;
  body: string;
  startsAt: string;
  endsAt: string;
  online: boolean;
  city: string;
  venue: string;
  priceGBP: number;
  memberPriceGBP: number;
  capacity: number | null;
  ticketUrl: string;
};

function londonWeekday(now: Date) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "Europe/London" }).format(now);
}

function siteFacts() {
  const lines = [
    `The platform launch gathering is ${site.launch.title} at ${site.launch.venue}, ${site.launch.city}, starting ${dateToLondonInput(new Date(site.launch.startsAt))} London time. Tickets: ${site.launch.ticketUrl}`,
    `The next gathering after that is in ${site.next.city} (${site.next.status.toLowerCase()}).`,
    ...site.pastGatherings.map((g) => `Past gathering: ${g.title}, ${g.date}, ${g.venue}.`),
  ];
  return lines.join("\n");
}

function mentioned(value: string | null | undefined, sentence: string) {
  if (!value) return "";
  return sentence.toLowerCase().includes(value.toLowerCase()) ? value : "";
}

/** Keep the model honest: a ticket link or venue only survives if the sentence (or a known site fact) contains it. */
function guardFacts(out: z.infer<typeof eventSchema>, sentence: string): EventDraftFields {
  const lower = sentence.toLowerCase();
  let ticketUrl = "";
  if (out.ticketUrl) {
    const bare = out.ticketUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "").toLowerCase();
    if (lower.includes(bare)) ticketUrl = cleanUrl(out.ticketUrl) ?? "";
  }
  const venue = mentioned(out.venue, sentence);
  const startsAt = out.startsAt && LONDON_INPUT.test(out.startsAt) ? out.startsAt : "";
  const endsAt = out.endsAt && LONDON_INPUT.test(out.endsAt) ? out.endsAt : "";
  const whole = (n: number) => (Number.isFinite(n) && n > 0 ? Math.round(n) : 0);
  return {
    title: out.title.trim().slice(0, 160),
    kind: EVENT_KINDS.includes(out.kind) ? out.kind : "gathering",
    summary: out.summary.trim().slice(0, 400),
    body: (out.body ?? "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(),
    startsAt,
    endsAt,
    online: out.online,
    city: out.online ? "" : (out.city ?? "").trim(),
    venue: out.online ? "" : venue,
    priceGBP: whole(out.priceGBP),
    memberPriceGBP: whole(out.memberPriceGBP),
    capacity: out.capacity && out.capacity > 0 ? Math.round(out.capacity) : null,
    ticketUrl,
  };
}

/**
 * Turn a one-sentence description of an event into form fields for Studio.
 * Returns null when AI is unavailable or the call fails. Nothing is saved here.
 */
export async function draftEvent(sentence: string, now = new Date()): Promise<EventDraftFields | null> {
  const description = sentence.trim().slice(0, 2000);
  if (!description) return null;

  const system = `You turn a short description of a Trichollective event into the fields of the Studio event form.

Rules:
- Dates and times are London time, written as "YYYY-MM-DDTHH:mm". Resolve relative phrases such as "next Thursday evening" from today's date. "Evening" means 19:00 unless a time is given, "morning" 09:30, "afternoon" 14:00. If no date can be worked out, use null.
- Only give an end time if the description states one or a duration.
- kind is one of: gathering (a conference or large in-person day), masterclass (a taught session), case_round (members discussing anonymised cases), chapter_meetup (a local chapter meeting), welcome (a welcome session for new members).
- Prices are whole pounds. If no price is given, use 0. Use the member price for "members" and the guest price for "guests" or "non-members".
- capacity is the number of places if stated, otherwise null.
- Never invent a venue or a ticket link. Only use a venue or link that appears in the description; otherwise use null. A city may be taken from the description.
- online is true only if the description says it is online, virtual or on Zoom.
- The title is short and descriptive. The summary is one or two complete sentences stating what attendees will get, at most 400 characters. The body is two or three short paragraphs of plain text separated by blank lines, using only what the description says; do not invent speakers, topics or figures.`;

  const prompt = `Today in London it is ${londonWeekday(now)}, ${dateToLondonInput(now).replace("T", " at ")}.

What we already know about Trichollective gatherings:
${siteFacts()}

The description to turn into an event:
${description}`;

  const out = await generateStructured(eventSchema, system, prompt);
  if (!out || !out.title) return null;
  return guardFacts(out, description);
}

/** Write or improve the full description from the title and summary. Returns null without AI. */
export async function writeEventBody(input: { title: string; summary: string; body?: string; kind?: string; city?: string }) {
  if (!input.title.trim() || !input.summary.trim()) return null;
  return generate(
    "Write the full description for a Trichollective event page: two or three short paragraphs of plain text separated by blank lines. Say plainly what professionals will get from attending. Use only the facts given; do not invent speakers, topics, prices, venues or figures.",
    [
      `Title: ${input.title}`,
      `Summary: ${input.summary}`,
      input.kind ? `Type: ${input.kind}` : "",
      input.city ? `City: ${input.city}` : "",
      input.body?.trim() ? `Current description to improve:\n${input.body.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n")
  );
}
