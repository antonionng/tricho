import { composeInviteEmail } from "@/lib/invite";
import { site } from "@/config/site";
import type { EmailSample } from "../catalogue";
import type { EmailContent } from "../layout";

/**
 * Member emails: replies and messages inside the platform, event bookings and
 * reminders, and the one-to-one emails Karley approves in the Studio inbox
 * (membership reminders and directory invitations).
 */

type Email = { subject: string; content: EmailContent };

const TZ = "Europe/Dublin";

export function firstNameOf(name: string | null | undefined, fallback = "there") {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  if (/^(dr|mr|mrs|ms|miss|mx|prof)\.?$/i.test(parts[0]) && parts.length > 1) return `${parts[0]} ${parts[parts.length - 1]}`;
  return parts[0];
}

/** Trim to a length on a word boundary, adding an ellipsis when cut. */
export function clip(text: string, max: number) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1).replace(/\s+\S*$/, "");
  return `${cut || flat.slice(0, max - 1)}…`;
}

/* ------------------------------------------------------------------ */
/* Events                                                               */
/* ------------------------------------------------------------------ */

export type EmailEvent = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  startsAt: Date;
  endsAt?: Date | null;
  online: boolean;
  venue?: string | null;
  city?: string | null;
  ticketUrl?: string | null;
  priceGBP?: number;
  memberPriceGBP?: number;
};

/** "Thursday 8 October 2026" */
export function eventDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(d);
}

/** "Thursday 8 October" */
export function eventDay(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).format(d);
}

/** "7:00 pm to 8:30 pm, Irish and UK time" */
export function eventTime(start: Date, end?: Date | null) {
  const t = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });
  return `${end ? `${t.format(start)} to ${t.format(end)}` : t.format(start)}, Irish and UK time`;
}

export function eventWhere(e: Pick<EmailEvent, "online" | "venue" | "city">) {
  if (e.online) return "Online";
  return [e.venue, e.city].filter(Boolean).join(", ") || "Venue to be confirmed";
}

export const eventHref = (e: Pick<EmailEvent, "slug">) => `/events/${e.slug}`;
export const calendarHref = (e: Pick<EmailEvent, "id">) => `/api/events/${e.id}/ics`;

function eventFacts(e: EmailEvent): [string, string][] {
  const facts: [string, string][] = [
    ["Date", eventDate(e.startsAt)],
    ["Time", eventTime(e.startsAt, e.endsAt)],
    ["Where", eventWhere(e)],
  ];
  if (e.ticketUrl) facts.push([e.online ? "Joining and tickets" : "Tickets", e.ticketUrl]);
  return facts;
}

export function rsvpConfirmedEmail(p: { name: string | null; event: EmailEvent }): Email {
  const e = p.event;
  const how = e.online
    ? e.ticketUrl
      ? "It takes place online. Please book through the ticket link below, which is also where the joining details are shared."
      : "It takes place online, and we will share the joining details with you before it starts."
    : `It takes place at ${eventWhere(e)}.`;
  return {
    subject: `Your place at ${e.title} is saved`,
    content: {
      preheader: `${eventDay(e.startsAt)}. Add it to your calendar so you don't miss it.`,
      eyebrow: "Your event",
      image: "gathering",
      heading: `Your place at ${e.title} is saved for ${eventDay(e.startsAt)}.`,
      body: [
        `Hello ${firstNameOf(p.name)},`,
        `Thank you for saying you'll come. ${how}`,
        "We'll send you a reminder the day before. If your plans change, you can cancel from the events page in the app so someone else can take your place.",
      ].join("\n\n"),
      facts: eventFacts(e),
      cta: { label: "View the event", href: eventHref(e) },
      secondary: { label: "Add to your calendar", href: calendarHref(e) },
      reason: `You receive this because you said you would attend ${e.title}.`,
    },
  };
}

export function eventReminderEmail(p: { name: string | null; event: EmailEvent }): Email {
  const e = p.event;
  return {
    subject: `Reminder: ${e.title} is on ${eventDay(e.startsAt)}`,
    content: {
      preheader: `${eventTime(e.startsAt, e.endsAt)}, ${eventWhere(e).toLowerCase() === "online" ? "online" : eventWhere(e)}.`,
      eyebrow: "Event reminder",
      image: "gathering",
      heading: `${e.title} is on ${eventDay(e.startsAt)}, and your place is saved.`,
      body: [
        `Hello ${firstNameOf(p.name)},`,
        `A short reminder that you're coming to ${e.title}. Here are the details you need.`,
        "If you can no longer make it, please cancel from the events page in the app so someone else can take your place.",
      ].join("\n\n"),
      facts: eventFacts(e),
      cta: { label: "View the event", href: eventHref(e) },
      secondary: { label: "Add to your calendar", href: calendarHref(e) },
      reason: `You receive this because you said you would attend ${e.title}.`,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Activity: replies and messages                                       */
/* ------------------------------------------------------------------ */

const ACTIVITY_REASON =
  "You receive this because someone responded to you on Trichollective. You can switch off emails about replies and messages in your profile.";

export function commentReplyEmail(p: {
  recipientName: string | null;
  commenterName: string;
  postTitle: string;
  comment: string;
  postId: string;
}): Email {
  return {
    subject: `${p.commenterName} replied to your post`,
    content: {
      preheader: clip(p.comment, 110),
      eyebrow: "Community",
      heading: `${p.commenterName} replied to your post in the community.`,
      body: [
        `Hello ${firstNameOf(p.recipientName)},`,
        `${p.commenterName} replied to "${clip(p.postTitle, 90)}":`,
        `"${clip(p.comment, 300)}"`,
        "Reply in the thread to keep the conversation going, so colleagues who find it later see the whole discussion.",
      ].join("\n\n"),
      cta: { label: "Read the reply", href: `/members/community/${p.postId}` },
      signoff: null,
      reason: ACTIVITY_REASON,
    },
  };
}

export function newMessageEmail(p: {
  recipientName: string | null;
  senderName: string;
  message: string;
  conversationId: string;
}): Email {
  return {
    subject: `New message from ${p.senderName}`,
    content: {
      preheader: `${p.senderName} sent you a private message on Trichollective.`,
      eyebrow: "Messages",
      heading: `${p.senderName} sent you a private message.`,
      body: [
        `Hello ${firstNameOf(p.recipientName)},`,
        `Here is how it starts: "${clip(p.message, 140)}"`,
        "For privacy, we only show the first few words by email. Read the whole message and reply in the app.",
      ].join("\n\n"),
      cta: { label: "Read and reply", href: `/members/messages/${p.conversationId}` },
      signoff: null,
      reason: ACTIVITY_REASON,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Emails Karley approves in the Studio inbox                           */
/* ------------------------------------------------------------------ */

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function ctaOf(v: unknown): EmailContent["cta"] {
  if (!v || typeof v !== "object") return undefined;
  const { label, href } = v as Record<string, unknown>;
  return typeof label === "string" && typeof href === "string" && label && href ? { label, href } : undefined;
}

/**
 * A full-sentence heading for each kind of approved email, keyed by the draft's
 * ref, so the heading reads well even when the subject was polished by the AI.
 */
export function draftHeading(payload: Record<string, unknown>, subject: string) {
  const ref = str(payload.ref);
  if (payload.invite === true || ref.startsWith("invite:")) {
    return "You're invited to be one of the first practitioners in the Trichollective directory.";
  }
  if (ref.startsWith("listing-reminder:")) {
    return ref.endsWith(":0")
      ? "Your full directory profile trial ends today, and your basic listing stays live."
      : "Your free full directory profile ends soon, and your listing stays live either way.";
  }
  if (ref.startsWith("enquiry-waiting:")) {
    const n = typeof payload.enquiryCount === "number" ? payload.enquiryCount : 1;
    return n > 1
      ? `${n} people have sent you enquiries through the Trichollective directory.`
      : "Someone has sent you an enquiry through the Trichollective directory.";
  }
  if (ref.startsWith("onboarding-nudge:")) {
    return "It only takes a couple of minutes to finish setting up your Trichollective profile.";
  }
  return /[.!?]$/.test(subject) ? subject : `${subject}.`;
}

/**
 * A one-to-one email drafted by an agent or the invite tool. The body already
 * greets the person and signs off in Karley's voice, so the layout adds no
 * second sign-off.
 */
export function draftEmailContent(draft: { title: string; body: string }, payload: Record<string, unknown>): Email {
  const subject = str(payload.subject) || draft.title;
  const heading = str(payload.heading) || draftHeading(payload, subject);
  const invite = payload.invite === true;
  const firstParagraph = draft.body.split(/\n{2,}/).find((p) => !/^(hello|dear|hi)\b/i.test(p.trim())) ?? "";
  return {
    subject,
    content: {
      preheader: str(payload.preheader) || clip(firstParagraph, 120),
      eyebrow: str(payload.eyebrow) || (invite ? "Founding directory" : undefined),
      heading,
      body: draft.body,
      cta: ctaOf(payload.cta),
      signoff: null,
      reason: invite
        ? `You receive this because ${site.founderFull} invited you to the Trichollective directory.`
        : "You receive this because you have an account or a listing with Trichollective.",
    },
  };
}

/* ------------------------------------------------------------------ */
/* Samples for Studio, Emails                                          */
/* ------------------------------------------------------------------ */

const sampleEvent: EmailEvent = {
  id: "sample-event",
  slug: "dublin-case-round-october",
  title: "Dublin case round: diffuse shedding",
  summary: "Bring an anonymised case of diffuse shedding and work through it with cosmetic, clinical and medical colleagues.",
  startsAt: new Date("2026-10-15T18:30:00Z"),
  endsAt: new Date("2026-10-15T20:00:00Z"),
  online: false,
  venue: "The Alex Hotel",
  city: "Dublin",
  ticketUrl: null,
};

const invite = composeInviteEmail({
  name: "Aoife Brennan",
  token: "sample-token",
  founderFull: site.founderFull,
  baseUrl: site.url,
  launchTitle: "the Dublin launch",
  launchStartsAt: "2026-10-05T10:00:00Z",
  freeDays: 90,
});

const reminderBody = [
  "Hello Niamh,",
  "A quick note to say your free trial of the full directory profile runs until 30 October 2026, which is 29 days from now. During the trial, enquiries from the public come straight to your inbox.",
  "After 30 October your listing stays in the directory as a basic listing. To keep your full profile and your enquiries, you can claim it on the Professional plan:",
  `${site.url}/directory/claim/niamh-byrne-trichology`,
  "If you'd rather stay on the basic listing, there's nothing you need to do.",
  `${site.founder}, Trichollective`,
].join("\n\n");

const rsvp = rsvpConfirmedEmail({ name: "Niamh Byrne", event: sampleEvent });
const reminder = eventReminderEmail({ name: "Niamh Byrne", event: sampleEvent });
const reply = commentReplyEmail({
  recipientName: "Niamh Byrne",
  commenterName: "Siobhan",
  postTitle: "Telogen effluvium after illness: how long do you wait before referring?",
  comment:
    "I usually wait three months from the trigger before I suggest bloods, unless there are other signs. A short shedding diary from the client helps me decide, and it gives the GP something concrete to work with if we do refer.",
  postId: "sample-post",
});
const message = newMessageEmail({
  recipientName: "Niamh Byrne",
  senderName: "Dr Aisling Murphy",
  message: "Hi Niamh, thank you for the referral last week. I saw your client on Tuesday and wanted to let you know how it went, and ask about",
  conversationId: "sample-conversation",
});
const inviteEmail = draftEmailContent({ title: invite.subject, body: invite.body }, { to: "aoife@example.com", subject: invite.subject, invite: true });
const reminderEmail = draftEmailContent(
  { title: "Your full Trichollective profile: 29 days of your trial to go", body: reminderBody },
  { subject: "Your full Trichollective profile: 29 days of your trial to go", ref: "listing-reminder:sample:30" }
);

export const samples: EmailSample[] = [
  {
    id: "event-rsvp",
    name: "Event place saved",
    trigger: "Sent when a member says they will attend an event, with an Add to calendar link.",
    audience: "members",
    ...rsvp,
  },
  {
    id: "event-reminder",
    name: "Event reminder",
    trigger: "Sent once, a day or two before an event, to everyone who said they would attend.",
    audience: "members",
    ...reminder,
  },
  {
    id: "comment-reply",
    name: "Reply to your post",
    trigger: "Sent when someone else replies to a member's community post, unless they have switched off activity emails.",
    audience: "members",
    ...reply,
  },
  {
    id: "new-message",
    name: "New private message",
    trigger: "Sent when a member receives a message and has no unread notification for that conversation already.",
    audience: "members",
    ...message,
  },
  {
    id: "membership-reminder",
    name: "Membership helper email",
    trigger: "Drafted by the Membership helper and sent only when Karley approves it in the inbox.",
    audience: "practitioners",
    ...reminderEmail,
  },
  {
    id: "directory-invite",
    name: "Founding directory invitation",
    trigger: "Written in Studio, Invite, and sent only when Karley approves it in the inbox.",
    audience: "practitioners",
    ...inviteEmail,
  },
];
