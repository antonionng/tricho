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
  /** Online joining link, e.g. Google Meet. Only ever sent to people who are going. */
  joinUrl?: string | null;
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
  if (e.joinUrl) facts.push(["Join online", e.joinUrl]);
  else if (e.ticketUrl) facts.push([e.online ? "Joining and tickets" : "Tickets", e.ticketUrl]);
  return facts;
}

export function rsvpConfirmedEmail(p: { name: string | null; event: EmailEvent }): Email {
  const e = p.event;
  const how = e.online
    ? e.joinUrl
      ? "It takes place online on Google Meet. Use the joining link below at the start time, and keep this email so you have it to hand."
      : e.ticketUrl
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
  /** Why this person hears about it: they wrote the post, wrote the comment being answered, or took part in the thread. */
  relation?: "post" | "comment" | "thread";
}): Email {
  const relation = p.relation ?? "post";
  const subject = {
    post: `${p.commenterName} replied to your post`,
    comment: `${p.commenterName} replied to your comment`,
    thread: `${p.commenterName} replied in a thread you joined`,
  }[relation];
  return {
    subject,
    content: {
      preheader: clip(p.comment, 110),
      eyebrow: "Community",
      heading: `${subject} in the community.`,
      body: [
        `Hello ${firstNameOf(p.recipientName)},`,
        `${p.commenterName} replied${relation === "comment" ? " to your comment" : ""} in "${clip(p.postTitle, 90)}":`,
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
  launchTitle: site.launch.title,
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

/* ------------------------------------------------------------------ */
/* Business seats                                                       */
/* ------------------------------------------------------------------ */

/** Sent when a business gives a team member one of its five Professional seats. */
export function seatInviteEmail(p: { businessName: string; email: string }): Email {
  return {
    subject: `${p.businessName} has given you Professional membership of Trichollective`,
    content: {
      preheader: "Sign in with this email address and your Professional membership is ready.",
      eyebrow: "Your membership",
      heading: `${p.businessName} has given you Professional membership of Trichollective.`,
      body: [
        "Hello,",
        `${p.businessName} has added you to their team on Trichollective, so your Professional membership is paid for while you stay on it.`,
        "You can talk through difficult cases with trichologists, doctors and scalp specialists, take courses for CPD, list yourself in the directory with a full profile and receive client enquiries.",
        `Sign in with ${p.email} and everything is ready for you. There is no card to add.`,
      ].join("\n\n"),
      cta: { label: "Sign in to Trichollective", href: "/login?next=/members" },
      reason: `${p.businessName} added this email address to their team on Trichollective.`,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Account access                                                       */
/* ------------------------------------------------------------------ */

/** Sent when the team pauses someone's account. Calm and factual: what it means, how long, and who to talk to. */
export function accountSuspendedEmail(p: { name: string | null; until: Date | null; reason?: string | null }): Email {
  const when = p.until ? `until ${eventDate(p.until)}` : "until the team lifts it";
  return {
    subject: "Your Trichollective account has been paused",
    content: {
      preheader: p.until
        ? `You can sign in again from ${eventDate(p.until)}.`
        : "You can sign in again once the team lifts the pause.",
      eyebrow: "Your account",
      heading: "Your Trichollective account has been paused.",
      body: [
        `Hello ${firstNameOf(p.name)},`,
        `The Trichollective team has paused your account ${when}. While it is paused you cannot open the member area, post in the community or send messages.`,
        ...(p.reason ? [`The reason the team gave is: ${p.reason.trim().replace(/([^.!?])$/, "$1.")}`] : []),
        "Your membership and billing are not changed by this, and nothing you have shared has been deleted.",
        `If you think this is a mistake, or you would like to talk it through, reply to this email or write to ${site.contactEmail}.`,
      ].join("\n\n"),
      reason: "This email is about access to your Trichollective account.",
    },
  };
}

/** Sent when the team closes someone's account. Billing is a separate matter, so the email says so plainly. */
export function accountClosedEmail(p: { name: string | null; reason?: string | null }): Email {
  return {
    subject: "Your Trichollective account has been closed",
    content: {
      preheader: "You can no longer sign in to Trichollective.",
      eyebrow: "Your account",
      heading: "Your Trichollective account has been closed.",
      body: [
        `Hello ${firstNameOf(p.name)},`,
        "The Trichollective team has closed your account, so you can no longer sign in, open the member area or take part in the community.",
        ...(p.reason ? [`The reason the team gave is: ${p.reason.trim().replace(/([^.!?])$/, "$1.")}`] : []),
        "Closing an account does not cancel a membership subscription. If you have one, the team will be in touch about it separately.",
        `If you would like to ask about this decision, write to ${site.contactEmail}.`,
      ].join("\n\n"),
      reason: "This email is about access to your Trichollective account.",
    },
  };
}

/** Sent when the team lifts a pause or reopens an account. */
export function accountRestoredEmail(p: { name: string | null }): Email {
  return {
    subject: "Your Trichollective account is open again",
    content: {
      preheader: "You can sign in and take part in the community again.",
      eyebrow: "Your account",
      heading: "Your Trichollective account is open again.",
      body: [
        `Hello ${firstNameOf(p.name)},`,
        "The Trichollective team has restored your account, so you can sign in, read the community and post again.",
        `If anything does not work as it should, reply to this email or write to ${site.contactEmail}.`,
      ].join("\n\n"),
      cta: { label: "Sign in to Trichollective", href: "/login?next=/members" },
      reason: "This email is about access to your Trichollective account.",
    },
  };
}

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

const suspended = accountSuspendedEmail({
  name: "Niamh Byrne",
  until: new Date("2026-11-01T12:00:00Z"),
  reason: "Repeated posts promoting products in the Case Room after a reminder.",
});
const closed = accountClosedEmail({ name: "Niamh Byrne", reason: "Sharing photographs that identified a client." });
const restored = accountRestoredEmail({ name: "Niamh Byrne" });
const seat = seatInviteEmail({ businessName: "Scalp Science Ltd", email: "ciara@example.com" });

export const samples: EmailSample[] = [
  {
    id: "account-suspended",
    name: "Account paused",
    trigger: "Sent when someone on the team suspends a member in Studio, with the end date if there is one.",
    audience: "members",
    ...suspended,
  },
  {
    id: "account-closed",
    name: "Account closed",
    trigger: "Sent when an owner bans a member in Studio. It says plainly that billing is handled separately.",
    audience: "members",
    ...closed,
  },
  {
    id: "account-restored",
    name: "Account open again",
    trigger: "Sent when someone on the team lifts a suspension or ban in Studio.",
    audience: "members",
    ...restored,
  },
  {
    id: "business-seat",
    name: "Team member given Professional",
    trigger: "Sent when a Business or Premium Business account adds someone to one of its five Professional seats.",
    audience: "members",
    ...seat,
  },
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

/* ------------------------------------------------------------------ */
/* Verification                                                         */
/* ------------------------------------------------------------------ */

/** Sent when the team approves a member's evidence and turns on the verified badge. */
export function verificationApprovedEmail(p: { name: string | null }): Email {
  return {
    subject: "You are now verified on Trichollective",
    content: {
      preheader: "The verified badge now shows on your directory profile.",
      eyebrow: "Verification",
      heading: "The team has checked your evidence and you are now verified.",
      body: [
        `Hello ${firstNameOf(p.name)},`,
        "Thank you for sending your documents. The verified badge now shows on your directory profile, in directory search results and on your chapter page, so clients and colleagues can see that the Trichollective team has checked your training.",
        "Your documents stay private. Only you and the members of the team who review verification can open them.",
        `If any of your details change, or you have a question, reply to this email or write to ${site.contactEmail}.`,
      ].join("\n\n"),
      cta: { label: "See your verification", href: "/members/profile/verification" },
      reason: "This email is about the verified badge on your Trichollective profile.",
    },
  };
}

/** Sent when the team cannot verify a member from what they sent, with the reason and how to try again. */
export function verificationRejectedEmail(p: { name: string | null; reason: string }): Email {
  return {
    subject: "We could not verify your document yet",
    content: {
      preheader: "The team has explained why, and you can send another document at any time.",
      eyebrow: "Verification",
      heading: "The team could not verify you from the document you sent.",
      body: [
        `Hello ${firstNameOf(p.name)},`,
        "Thank you for sending evidence of your training. The team has looked at it carefully but could not add the verified badge from this document.",
        `The reason the team gave is: ${p.reason.trim().replace(/([^.!?])$/, "$1.")}`,
        "You are welcome to send another document from your verification page, such as a clearer copy, a certificate that shows your name, or proof of membership of a professional body.",
        `If you would like to talk it through, reply to this email or write to ${site.contactEmail}.`,
      ].join("\n\n"),
      cta: { label: "Send another document", href: "/members/profile/verification" },
      reason: "This email is about the verified badge on your Trichollective profile.",
    },
  };
}

const verified = verificationApprovedEmail({ name: "Niamh Byrne" });
const notVerified = verificationRejectedEmail({
  name: "Niamh Byrne",
  reason: "The certificate is cropped, so we cannot see the awarding body or the date you qualified",
});

samples.push(
  {
    id: "verification-approved",
    name: "Verified badge added",
    trigger: "Sent when someone on the team approves a member's evidence in Studio, Verification.",
    audience: "members",
    ...verified,
  },
  {
    id: "verification-rejected",
    name: "Verification not approved",
    trigger: "Sent when someone on the team rejects a member's evidence in Studio, Verification, with the reason they gave.",
    audience: "members",
    ...notVerified,
  }
);

/* ------------------------------------------------------------------ */
/* Client referrals                                                     */
/* ------------------------------------------------------------------ */

/**
 * Referral emails never carry the clinical summary: it stays inside the member
 * area, behind sign-in, and the email only says that a referral is waiting.
 */
export function referralReceivedEmail(p: { recipientName: string | null; senderName: string; referralId: string }): Email {
  return {
    subject: `${p.senderName} has referred a client to you`,
    content: {
      preheader: `${p.senderName} thinks you are the right person to help one of their clients.`,
      eyebrow: "Referrals",
      heading: `${p.senderName} has referred a client to you on Trichollective.`,
      body: [
        `Hello ${firstNameOf(p.recipientName)},`,
        `${p.senderName} thinks you are the right person to help one of their clients, and has sent you a short summary of the concern.`,
        "For the client's privacy, the summary is only shown in the member area. Read it there and let your colleague know whether you can take the referral.",
      ].join("\n\n"),
      cta: { label: "Read the referral", href: `/members/referrals/${p.referralId}` },
      signoff: null,
      reason: ACTIVITY_REASON,
    },
  };
}

export function referralAnsweredEmail(p: {
  recipientName: string | null;
  responderName: string;
  accepted: boolean;
  referralId: string;
}): Email {
  return {
    subject: p.accepted ? `${p.responderName} accepted your referral` : `${p.responderName} replied to your referral`,
    content: {
      preheader: p.accepted
        ? `${p.responderName} can help the client you referred.`
        : `${p.responderName} is not able to take the client you referred.`,
      eyebrow: "Referrals",
      heading: p.accepted
        ? `${p.responderName} has accepted the client you referred.`
        : `${p.responderName} is not able to take the client you referred.`,
      body: [
        `Hello ${firstNameOf(p.recipientName)},`,
        p.accepted
          ? `${p.responderName} has accepted your referral, so you can now introduce your client to them directly.`
          : `${p.responderName} has declined your referral. You may want to refer your client to another colleague in the directory.`,
        "Any note they left is shown with the referral in the member area, where you can also send them a message.",
      ].join("\n\n"),
      cta: { label: "See the referral", href: `/members/referrals/${p.referralId}` },
      signoff: null,
      reason: ACTIVITY_REASON,
    },
  };
}

samples.push(
  {
    id: "referral-received",
    name: "Client referral received",
    trigger: "Sent when a Professional member refers a client to another member, unless they have switched off activity emails.",
    audience: "members",
    ...referralReceivedEmail({ recipientName: "Niamh Byrne", senderName: "Ciara Walsh", referralId: "sample" }),
  },
  {
    id: "referral-answered",
    name: "Referral accepted or declined",
    trigger: "Sent to the member who made a referral when their colleague accepts or declines it.",
    audience: "members",
    ...referralAnsweredEmail({ recipientName: "Ciara Walsh", responderName: "Niamh Byrne", accepted: true, referralId: "sample" }),
  }
);
