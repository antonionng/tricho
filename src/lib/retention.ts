/**
 * Retention: which members need a word from the team, and why. Pure rules and
 * copy, with no database access, so they can be tested on their own. The
 * Studio page and the count on the overview load members and run them through
 * segmentsFor.
 */

const DAY = 24 * 60 * 60 * 1000;

export const RETENTION_SEGMENTS = [
  "cancelling",
  "payment_failed",
  "renewing_soon",
  "lapsed_recently",
  "not_onboarded",
  "quiet",
] as const;
export type RetentionSegment = (typeof RETENTION_SEGMENTS)[number];

export type RetentionMember = {
  id: string;
  createdAt: Date;
  onboardedAt: Date | null;
  plan: string | null;
  compPlan?: string | null;
  compUntil?: Date | null;
  stripeCurrentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  lastPaymentFailedAt: Date | null;
  lastSeenAt: Date | null;
};

export type SegmentInfo = {
  id: RetentionSegment;
  label: string;
  /** A full sentence explaining who is in this list. */
  description: string;
  /** What the team might do about it, as a full sentence. */
  action: string;
  /** The date shown in the table, and what it means. */
  keyDateLabel: string;
  /** Service emails go regardless of email preferences; optional ones respect emailUpdates. */
  service: boolean;
  /** Counted in "Members needing attention". Renewals are informational. */
  attention: boolean;
};

export const SEGMENT_INFO: Record<RetentionSegment, SegmentInfo> = {
  cancelling: {
    id: "cancelling",
    label: "Cancelling",
    description: "These members have cancelled, and their membership ends at the close of the period they have already paid for.",
    action: "A short personal note asking what could have been better often brings useful feedback, and sometimes a change of heart.",
    keyDateLabel: "Membership ends",
    service: true,
    attention: true,
  },
  payment_failed: {
    id: "payment_failed",
    label: "Payment failed",
    description: "A renewal payment for these members failed in the last 14 days and has not gone through since.",
    action: "A friendly reminder to update their card keeps their membership running without interruption.",
    keyDateLabel: "Payment failed",
    service: true,
    attention: true,
  },
  renewing_soon: {
    id: "renewing_soon",
    label: "Renewing soon",
    description: "These memberships renew within the next 14 days and nobody has asked to cancel.",
    action: "No action is needed, although a note about what is coming up this month can remind members of the value they get.",
    keyDateLabel: "Renews",
    service: false,
    attention: false,
  },
  lapsed_recently: {
    id: "lapsed_recently",
    label: "Lapsed recently",
    description: "These members' paid membership ended in the last 30 days and they have no active plan.",
    action: "A warm note saying their place is kept and explaining how to rejoin is the most effective way to win members back.",
    keyDateLabel: "Ended",
    service: false,
    attention: true,
  },
  not_onboarded: {
    id: "not_onboarded",
    label: "Not set up",
    description: "These people joined between three and sixty days ago and have not finished setting up their account.",
    action: "A short offer of help to finish setting up connects them with their chapter and the spaces most relevant to their work.",
    keyDateLabel: "Joined",
    service: false,
    attention: true,
  },
  quiet: {
    id: "quiet",
    label: "Quiet",
    description: "These paying members have not signed in for three weeks or more.",
    action: "A personal note pointing to a recent case discussion, event or resource in their field can bring them back.",
    keyDateLabel: "Last seen",
    service: false,
    attention: true,
  },
};

export function isRetentionSegment(value: unknown): value is RetentionSegment {
  return typeof value === "string" && (RETENTION_SEGMENTS as readonly string[]).includes(value);
}

function compActive(m: RetentionMember, now: Date) {
  return !!m.compPlan && (!m.compUntil || m.compUntil.getTime() > now.getTime());
}

/** A Stripe subscription whose current period has not ended. */
function paying(m: RetentionMember, now: Date) {
  return !!m.plan && !!m.stripeCurrentPeriodEnd && m.stripeCurrentPeriodEnd.getTime() > now.getTime();
}

/** Every segment this member falls into, in the order of RETENTION_SEGMENTS. */
export function segmentsFor(m: RetentionMember, now = new Date()): RetentionSegment[] {
  const t = now.getTime();
  const end = m.stripeCurrentPeriodEnd?.getTime() ?? null;
  const out: RetentionSegment[] = [];

  const cancelling = m.cancelAtPeriodEnd && end !== null && end > t;
  if (cancelling) out.push("cancelling");

  if (m.lastPaymentFailedAt && m.lastPaymentFailedAt.getTime() > t - 14 * DAY && m.lastPaymentFailedAt.getTime() <= t) {
    out.push("payment_failed");
  }

  if (!cancelling && !!m.plan && end !== null && end > t && end <= t + 14 * DAY) out.push("renewing_soon");

  // A day's grace, matching the membership check, so a renewal being processed isn't counted as lapsed.
  if (end !== null && end <= t - DAY && end > t - 30 * DAY && !compActive(m, now)) out.push("lapsed_recently");

  // Recent sign-ups only: after 60 days an unfinished account is no longer worth a nudge.
  if (!m.onboardedAt && m.createdAt.getTime() <= t - 3 * DAY && m.createdAt.getTime() > t - 60 * DAY) out.push("not_onboarded");

  if (paying(m, now)) {
    const quiet = m.lastSeenAt ? m.lastSeenAt.getTime() < t - 21 * DAY : m.createdAt.getTime() <= t - 21 * DAY;
    if (quiet) out.push("quiet");
  }

  return out;
}

/** True when this member needs a word from the team: anything but a routine renewal. */
export function needsAttention(m: RetentionMember, now = new Date()) {
  return segmentsFor(m, now).some((s) => SEGMENT_INFO[s].attention);
}

/** The date that matters for this segment. */
export function keyDate(segment: RetentionSegment, m: RetentionMember): Date | null {
  switch (segment) {
    case "cancelling":
    case "renewing_soon":
    case "lapsed_recently":
      return m.stripeCurrentPeriodEnd;
    case "payment_failed":
      return m.lastPaymentFailedAt;
    case "not_onboarded":
      return m.createdAt;
    case "quiet":
      return m.lastSeenAt;
  }
}

function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** One nudge per member, per segment, per month. */
export function retentionRef(segment: RetentionSegment, userId: string, now = new Date()) {
  return `retention:${segment}:${userId}:${monthKey(now)}`;
}

/** Optional emails respect the member's choice; service emails go regardless. */
export function mayEmail(segment: RetentionSegment, emailUpdates: boolean) {
  return SEGMENT_INFO[segment].service || emailUpdates;
}

export type NudgeInput = {
  firstName: string;
  planName: string | null;
  /** The date that matters for the segment, already formatted, e.g. "14 October 2026". */
  date: string | null;
  /** Absolute links, already built from the site address. */
  links: { members: string; billing: string; pricing: string; onboarding: string };
  signOff: string;
};

/** The email for one member. Warm and professional, in full sentences, with no hard sell. */
export function nudgeEmail(segment: RetentionSegment, i: NudgeInput): { subject: string; body: string } {
  const plan = i.planName ? `${i.planName} membership` : "membership";
  const hello = `Hello ${i.firstName},`;
  const paragraphs = (subject: string, lines: string[]) => ({ subject, body: [hello, ...lines, i.signOff].join("\n\n") });

  switch (segment) {
    case "cancelling":
      return paragraphs("Before your Trichollective membership ends", [
        `I noticed you have cancelled your ${plan}. It stays fully active until ${i.date ?? "the end of your current period"}, so you can keep using the Case Room, the directory and the CPD log until then.`,
        "If there is anything we could have done better, I would genuinely value hearing it. A one-line reply is enough, and it helps us make Trichollective more useful for practitioners like you.",
        `If you change your mind, you can keep your membership running from your billing page at any time before it ends:`,
        i.links.billing,
        "Thank you for being part of the community.",
      ]);
    case "payment_failed":
      return paragraphs("Your Trichollective payment did not go through", [
        `The latest payment for your ${plan} did not go through. This usually happens when a card has expired or been replaced, and it is quick to fix.`,
        "You can update your card details securely from your billing page, and your membership will carry on without interruption:",
        i.links.billing,
        "If you think this is a mistake, or you would like a hand, just reply to this email and I will help.",
      ]);
    case "renewing_soon":
      return paragraphs("Your Trichollective membership renews soon", [
        `This is a short note to let you know your ${plan} renews on ${i.date ?? "its renewal date"}. There is nothing you need to do.`,
        "Over the coming weeks you will find new case discussions, upcoming events and fresh resources in your member area:",
        i.links.members,
        "If you would like to change your plan or your billing details before then, you can do so from your billing page:",
        i.links.billing,
      ]);
    case "lapsed_recently":
      return paragraphs("Your place at Trichollective is still here", [
        `Your ${plan} ended${i.date ? ` on ${i.date}` : " recently"}. Your profile, your posts and your CPD log are all kept safely, so everything will be where you left it if you return.`,
        "If the timing was not right, or something did not work as you hoped, I would be glad to hear about it. A short reply helps us improve Trichollective for everyone.",
        "Whenever you are ready, you can rejoin here:",
        i.links.pricing,
      ]);
    case "not_onboarded":
      return paragraphs("Finish setting up your Trichollective account", [
        "Thank you for joining Trichollective. Setting up takes a couple of minutes: choose your discipline and add your city so we can connect you with your local chapter and the spaces most relevant to your work.",
        i.links.onboarding,
        "Once you are set up, you will see the discussions, events and people that matter most to your practice. If anything is unclear, just reply to this email and I will help.",
      ]);
    case "quiet":
      return paragraphs("What is new at Trichollective this month", [
        "It has been a little while since you last signed in, so I wanted to share what has been happening. Members have been discussing new cases in the Case Room, and there are events and resources coming up that may be useful in your practice.",
        "You can catch up in your member area:",
        i.links.members,
        "If there is a topic you would like to see covered, or something that would make Trichollective more useful to you, I would be glad to hear it.",
      ]);
  }
}

/** The one-line summary shown in the inbox for each draft. */
export function nudgeSummary(segment: RetentionSegment, who: string) {
  switch (segment) {
    case "cancelling":
      return `${who} has cancelled and their membership ends at the close of the paid period.`;
    case "payment_failed":
      return `A renewal payment from ${who} failed and has not gone through since.`;
    case "renewing_soon":
      return `${who} renews within the next 14 days.`;
    case "lapsed_recently":
      return `${who}'s membership ended in the last 30 days.`;
    case "not_onboarded":
      return `${who} joined three or more days ago and has not finished setting up.`;
    case "quiet":
      return `${who} is a paying member who has not signed in for three weeks or more.`;
  }
}
