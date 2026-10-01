import type { Course } from "@/content/courses";
import type { Edition } from "@/content/gazette/types";
import type { images } from "@/content/images";
import { site } from "@/config/site";
import type { EmailSample } from "../catalogue";
import type { EmailContent } from "../layout";
import { clip, eventDate, eventDay, eventTime, eventWhere, type EmailEvent } from "./members";

/**
 * Release announcements: a new Trichozette edition, course or event. The
 * Releases agent drafts them, Karley approves them in the Studio inbox, and
 * they go to everyone on the "updates" list.
 */

type ImageKey = keyof typeof images;
export type ReleaseType = "edition" | "course" | "event" | "article";

/** What a release draft carries. Saved as the draft's title, body and payload. */
export type Announcement = {
  ref: string;
  type: ReleaseType;
  subject: string;
  preheader: string;
  eyebrow: string;
  heading: string;
  body: string;
  href: string;
  image: ImageKey;
  cta: { label: string; href: string };
  facts?: [string, string][];
  /** Every release ref this one announces, when several are announced together. */
  covers?: string[];
};

export const releaseRef = (type: ReleaseType, slug: string) => `release:${type}:${slug}`;

const RELEASE_REASON =
  "You receive this because you joined Trichollective or signed up for news of new editions, courses and events.";

const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
export function countWord(n: number, capital = false) {
  const w = NUMBER_WORDS[n] ?? String(n);
  return capital ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}

function listOf(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function lowerFirst(s: string) {
  if (!s || /^[A-Z]{2}/.test(s)) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

const price = (gbp: number) => (gbp === 0 ? "free" : `£${gbp}`);

/* ------------------------------------------------------------------ */
/* Builders used by the Releases agent                                  */
/* ------------------------------------------------------------------ */

export function editionAnnouncement(e: Edition): Announcement {
  const href = `/trichozette/${e.slug}`;
  const audience = listOf(e.audience);
  return {
    ref: releaseRef("edition", e.slug),
    type: "edition",
    subject: `New in Trichozette: ${e.title}`,
    preheader: clip(e.standfirst, 120),
    eyebrow: `Trichozette, edition ${e.number}`,
    heading: `Edition ${e.number} of Trichozette, ${e.title}, is ready to read.`,
    body: [
      e.standfirst,
      `It is written with ${audience} professionals in mind. The first pages are free for everyone to read, and members can read the whole edition.`,
    ].join("\n\n"),
    href,
    image: e.coverImageKey ?? "ed01",
    cta: { label: "Read the edition", href },
  };
}

/** Several editions published together are announced in one email, not one each. */
export function editionsAnnouncement(list: Edition[]): Announcement {
  if (list.length === 1) return editionAnnouncement(list[0]);
  const sorted = [...list].sort((a, b) => a.number - b.number);
  const lead = sorted[sorted.length - 1];
  const n = countWord(sorted.length, true);
  return {
    ref: releaseRef("edition", lead.slug),
    type: "edition",
    subject: `${n} new editions of Trichozette are ready to read`,
    preheader: `${sorted.map((e) => e.title).slice(0, 3).join(", ")} and more.`,
    eyebrow: "Trichozette",
    heading: `${n} new editions of Trichozette are ready to read.`,
    body: [
      "Each edition takes one theme and treats it properly: what we know, what we don't, and where one discipline's work ends and another's begins.",
      sorted.map((e) => `- ${e.title}: ${clip(e.standfirst, 120)}`).join("\n"),
      "The first pages of every edition are free for everyone to read, and members can read them all in full.",
    ].join("\n\n"),
    href: "/trichozette",
    image: lead.coverImageKey ?? "ed01",
    cta: { label: "Read Trichozette", href: "/trichozette" },
    covers: sorted.map((e) => releaseRef("edition", e.slug)),
  };
}

export function courseAnnouncement(c: Course): Announcement {
  const href = `/courses/${c.slug}`;
  const pricing =
    c.memberPriceGBP < c.priceGBP
      ? `Members pay ${price(c.memberPriceGBP)} instead of ${price(c.priceGBP)}.`
      : `It costs ${price(c.priceGBP)}.`;
  return {
    ref: releaseRef("course", c.slug),
    type: "course",
    subject: `${c.title} is now open`,
    preheader: clip(c.summary, 120),
    eyebrow: "New course",
    heading: `${c.title} is now open for enrolment.`,
    body: [
      c.summary,
      `It is ${lowerFirst(c.format)}, about ${c.hours} hour${c.hours === 1 ? "" : "s"} in all, written for ${lowerFirst(c.audience)}. ${pricing}`,
    ].join("\n\n"),
    href,
    image: c.imageKey,
    cta: { label: "See the course", href },
  };
}

const EVENT_IMAGE: Record<string, ImageKey> = {
  gathering: "gathering",
  masterclass: "learning",
  case_round: "clinic",
  chapter_meetup: "community",
  welcome: "community",
};

export function eventAnnouncement(e: EmailEvent & { kind?: string }): Announcement {
  const href = `/events/${e.slug}`;
  const member = e.memberPriceGBP ?? 0;
  const guest = e.priceGBP ?? 0;
  const pricing =
    guest === 0 && member === 0
      ? "It is free to attend."
      : member < guest
        ? `Members pay ${price(member)} and guests pay ${price(guest)}.`
        : `Places cost ${price(guest)}.`;
  const where = e.online ? "online" : `at ${eventWhere(e)}`;
  const facts: [string, string][] = [
    ["Date", eventDate(e.startsAt)],
    ["Time", eventTime(e.startsAt, e.endsAt)],
    ["Where", eventWhere(e)],
  ];
  const image = (e.city?.toLowerCase() === "dublin" ? "dublin" : EVENT_IMAGE[e.kind ?? ""]) ?? "gathering";
  return {
    ref: releaseRef("event", e.slug),
    type: "event",
    subject: `Booking is open for ${e.title}`,
    preheader: `${eventDay(e.startsAt)}, ${e.online ? "online" : eventWhere(e)}.`,
    eyebrow: "New event",
    heading: `Booking is open for ${e.title} on ${eventDay(e.startsAt)}.`,
    body: [e.summary, `It takes place ${where}. ${pricing}`].join("\n\n"),
    href,
    image,
    cta: { label: "See the event and book", href },
    facts,
  };
}

/** The month's published Trichozette pieces, announced together. */
export function articlesAnnouncement(month: string, monthLabel: string, titles: string[]): Announcement {
  const href = "/members/trichozette";
  const n = titles.length;
  return {
    ref: releaseRef("article", month),
    type: "article",
    subject: n === 1 ? `A new piece in Trichozette for ${monthLabel}` : `${countWord(n, true)} new pieces in Trichozette for ${monthLabel}`,
    preheader: titles.slice(0, 2).join(", "),
    eyebrow: `Trichozette, ${monthLabel}`,
    heading:
      n === 1
        ? `There is a new piece in Trichozette for ${monthLabel}.`
        : `There are ${countWord(n)} new pieces in Trichozette for ${monthLabel}.`,
    body: [
      "This month's pieces draw on what members have been discussing in the community, written for cosmetic, clinical and medical practice.",
      titles.map((t) => `- ${t}`).join("\n"),
      "Members can read every piece in the app.",
    ].join("\n\n"),
    href,
    image: "learning",
    cta: { label: "Read in Trichozette", href },
  };
}

/* ------------------------------------------------------------------ */
/* Rendering an approved draft                                          */
/* ------------------------------------------------------------------ */

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function factsOf(v: unknown): [string, string][] | undefined {
  if (!Array.isArray(v)) return undefined;
  const rows = v.filter(
    (r): r is [string, string] => Array.isArray(r) && r.length === 2 && typeof r[0] === "string" && typeof r[1] === "string"
  );
  return rows.length ? rows : undefined;
}

function ctaOf(v: unknown) {
  if (!v || typeof v !== "object") return undefined;
  const { label, href } = v as Record<string, unknown>;
  return typeof label === "string" && typeof href === "string" && label && href ? { label, href } : undefined;
}

/** The announcement email for an approved draft. The draft body is what Karley edited. */
export function announcementEmail(draft: { title: string; body: string }, payload: Record<string, unknown>) {
  const subject = str(payload.subject) || draft.title;
  const image = str(payload.image);
  const content: EmailContent = {
    preheader: str(payload.preheader) || clip(draft.body, 120),
    eyebrow: str(payload.eyebrow) || "New on Trichollective",
    heading: str(payload.heading) || (/[.!?]$/.test(subject) ? subject : `${subject}.`),
    body: draft.body,
    image: image ? (image as ImageKey) : undefined,
    facts: factsOf(payload.facts),
    cta: ctaOf(payload.cta) ?? (str(payload.href) ? { label: "Take a look", href: str(payload.href) } : undefined),
    reason: RELEASE_REASON,
  };
  return { subject, content };
}

/** "2026-10" -> "Here is your Trichollective update for October 2026." */
function newsletterHeading(month: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return "";
  const label = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 15)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return `Here is your Trichollective update for ${label}.`;
}

/** The monthly newsletter, written by the Newsletter agent and approved by Karley. */
export function newsletterEmail(draft: { title: string; body: string }, payload: Record<string, unknown>) {
  const subject = str(payload.subject) || draft.title;
  const content: EmailContent = {
    preheader: str(payload.preheader) || clip(draft.body.replace(/^hello,?\s*/i, ""), 120),
    eyebrow: "Newsletter",
    heading: str(payload.heading) || newsletterHeading(str(payload.month)) || subject,
    body: draft.body,
    cta: ctaOf(payload.cta),
    // The newsletter is written with Karley's own sign-off.
    signoff: null,
    reason: RELEASE_REASON,
  };
  return { subject, content };
}

/* ------------------------------------------------------------------ */
/* Samples for Studio, Emails                                          */
/* ------------------------------------------------------------------ */

function asDraft(a: Announcement) {
  return announcementEmail({ title: a.subject, body: a.body }, { ...a });
}

const sampleEdition: Edition = {
  number: 9,
  slug: "the-autumn-scalp",
  title: "The autumn scalp",
  fade: "Shedding, weather and routine.",
  theme: "Seasonal change",
  standfirst:
    "Why so many clients notice more hair in the plughole in autumn, what the evidence says about seasonal shedding, and when it is time to look for another cause.",
  coverImageKey: "hairDetail",
  coverTone: "light",
  audience: ["cosmetic", "clinical", "medical"],
  published: "2026-10-28",
  pages: [],
};

const sampleCourse: Course = {
  slug: "scalp-consultation-for-stylists",
  title: "The scalp consultation for stylists and head spa therapists",
  summary:
    "Run a structured scalp consultation, take a short case history, spot the red flags and know exactly when to refer a client on.",
  audience: "Stylists, head spa therapists and scalp care specialists",
  discipline: "cosmetic",
  format: "Six short lessons and a final quiz",
  hours: 3,
  priceGBP: 79,
  memberPriceGBP: 49,
  status: "open",
  outcomes: [],
  syllabus: [],
  imageKey: "ed21",
};

const sampleEvent = {
  id: "sample-event",
  slug: "masterclass-reading-bloods",
  kind: "masterclass",
  title: "Masterclass: reading blood results for hair loss",
  summary:
    "A practical evening on which blood tests matter for shedding and thinning, what the results can and cannot tell you, and how to talk to a client's GP about them.",
  startsAt: new Date("2026-11-12T19:00:00Z"),
  endsAt: new Date("2026-11-12T20:30:00Z"),
  online: true,
  venue: null,
  city: null,
  priceGBP: 25,
  memberPriceGBP: 0,
};

const newsletterBody = [
  "Hello,",
  "Here's your Trichollective update for October 2026: what members have been reading and talking about, what's coming up, and a few new guides you can share with clients.",
  "## What's on",
  `- Dublin case round: diffuse shedding: Thursday 15 October, Dublin\nDetails and booking: ${site.url}/events`,
  "Thank you for being part of the collective.",
  `${site.founder}, Trichollective`,
].join("\n\n");

export const samples: EmailSample[] = [
  {
    id: "release-edition",
    name: "New Trichozette edition",
    trigger: "Drafted by the Releases agent when a new edition is published, and sent to everyone on the updates list when Karley approves it.",
    audience: "everyone",
    ...asDraft(editionAnnouncement(sampleEdition)),
  },
  {
    id: "release-editions",
    name: "Several new Trichozette editions",
    trigger: "Used instead of separate emails when several editions are published on the same day.",
    audience: "everyone",
    ...asDraft(
      editionsAnnouncement([
        sampleEdition,
        { ...sampleEdition, number: 10, slug: "the-consultation-room", title: "The consultation room", coverImageKey: "clinic" },
      ])
    ),
  },
  {
    id: "release-course",
    name: "New course open",
    trigger: "Drafted by the Releases agent when a course opens for enrolment, and sent when Karley approves it.",
    audience: "everyone",
    ...asDraft(courseAnnouncement(sampleCourse)),
  },
  {
    id: "release-event",
    name: "New event",
    trigger: "Drafted as soon as an event is published in Studio, Events, and sent when Karley approves it.",
    audience: "everyone",
    ...asDraft(eventAnnouncement(sampleEvent)),
  },
  {
    id: "release-articles",
    name: "New Trichozette pieces",
    trigger: "Drafted by the Releases agent after the month's Trichozette pieces are published, and sent when Karley approves it.",
    audience: "everyone",
    ...asDraft(
      articlesAnnouncement("2026-10", "October 2026", [
        "Shedding after illness: what the community asked this month",
        "How I run a head spa consultation in twenty minutes",
      ])
    ),
  },
  {
    id: "newsletter",
    name: "Monthly newsletter",
    trigger: "Drafted by the Newsletter writer on the 25th and sent to members and subscribers when Karley approves it.",
    audience: "everyone",
    ...newsletterEmail(
      { title: "Trichollective: October 2026", body: newsletterBody },
      { subject: "Trichollective: October 2026", month: "2026-10" }
    ),
  },
];
