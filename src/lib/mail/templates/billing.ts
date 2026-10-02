import type { EmailSample } from "../catalogue";
import type { EmailContent } from "../layout";
import type { OwnerAlert } from "../send";
import { firstNameOf, longDate, ownerAlertContent } from "./directory";

/** Membership and payment emails, sent from the Stripe webhook. */

type Email = { subject: string; content: EmailContent };
type PlanName = "Community" | "Professional" | "Business" | string;

/** 1400, "gbp" -> "£14.00" */
export function formatMoney(minor: number | null | undefined, currency: string | null | undefined) {
  if (minor == null || !currency) return null;
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.toUpperCase() }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function intervalLabel(interval: string | null | undefined) {
  if (interval === "month") return "Monthly";
  if (interval === "year") return "Annual";
  return interval ?? null;
}

const FIRST_STEPS: Record<string, string[]> = {
  Community: [
    "- Say hello in Introductions and meet the members of your country chapter",
    "- Book your place at the next live masterclass or case round",
    "- Read the latest Trichozette edition in full",
  ],
  Professional: [
    "- Add your photo, headline and services to your directory profile",
    "- Bring an anonymised case to the Case Room for peer review",
    "- Find colleagues for referrals across cosmetic, clinical and medical practice",
    "- Watch your CPD log fill in as you learn",
  ],
  Business: [
    "- Set up your business page in the directory",
    "- Invite up to five of your team to Professional membership",
    "- Post your first role on the jobs board",
  ],
  "Premium Business": [
    "- Make your live partner page your own by adding your logo and what you offer in Your business",
    "- Give five of your team Professional membership",
    "- Add a perk for members, so practitioners can try your products",
    "- Reply to this email to plan your sponsored masterclass and Trichozette feature",
  ],
};

export type WelcomeFacts = {
  name: string | null;
  plan: PlanName;
  founding: boolean;
  /** A free directory listing was claimed by this payment. */
  listingClaimed: boolean;
  /** Held enquiries released to them by this payment. */
  enquiriesReleased: number;
};

export function welcomeEmail(w: WelcomeFacts): Email {
  const steps = FIRST_STEPS[w.plan] ?? FIRST_STEPS.Community;
  const paragraphs = [
    `Hello ${firstNameOf(w.name)},`,
    `Thank you for joining Trichollective as a ${w.plan} member. Your membership is active from today.`,
  ];
  if (w.founding) {
    paragraphs.push("You joined at the founding price, and you keep that price for as long as you stay a member.");
  }
  if (w.listingClaimed) {
    paragraphs.push(
      w.enquiriesReleased > 0
        ? `Your full directory profile is live, and the ${w.enquiriesReleased === 1 ? "enquiry that was" : `${w.enquiriesReleased} enquiries that were`} waiting for you ${w.enquiriesReleased === 1 ? "is" : "are"} now in the enquiries section of your profile, with contact details so you can reply.`
        : "Your full directory profile is live, and new enquiries from the public will now come straight to you."
    );
  }
  paragraphs.push(
    "## Getting started",
    [
      "- Sign in at any time with this email address; we send you a secure link, so there is no password to remember",
      "- Complete the three-minute setup, so we can show you the spaces, chapter and events that fit your practice",
    ].join("\n"),
    "## Once you are in",
    steps.join("\n"),
    "If you have any questions about your membership, simply reply to this email."
  );
  return {
    subject: `Welcome to Trichollective, your ${w.plan} membership is active`,
    content: {
      preheader: "Sign in with this email address and finish the three-minute setup.",
      eyebrow: `${w.plan} membership`,
      image: "ed05",
      heading: `Your ${w.plan} membership is active, and everything is ready for you to sign in.`,
      body: paragraphs.join("\n\n"),
      cta: { label: "Complete your setup", href: "/members/onboarding" },
      secondary: { label: "Sign in", href: "/login" },
      reason: `You receive this because you joined Trichollective as a ${w.plan} member.`,
    },
  };
}

export type MemberAlertFacts = {
  name: string | null;
  email: string;
  plan: PlanName;
  interval?: string | null;
  amount?: string | null;
  founding?: boolean;
  source?: string | null;
};

export function newMemberAlert(m: MemberAlertFacts): OwnerAlert {
  const facts: [string, string][] = [
    ["Name", m.name || "Not given"],
    ["Email", m.email],
    ["Plan", m.plan],
  ];
  const interval = intervalLabel(m.interval);
  if (interval) facts.push(["Billing", interval]);
  if (m.amount) facts.push(["Paid today", m.amount]);
  facts.push(["Founding", m.founding ? "Yes" : "No"]);
  if (m.source) facts.push(["Source", m.source]);
  return {
    subject: `New ${m.plan} member: ${m.name || m.email}`,
    heading: `${m.name || m.email} has joined Trichollective as a ${m.plan} member.`,
    body: "They have been sent a welcome email with how to sign in and finish setting up.",
    facts,
    cta: { label: "View members", href: "/studio/members" },
    replyTo: m.email,
  };
}

export function membershipEndedEmail(m: { name: string | null; plan: PlanName }): Email {
  return {
    subject: "Your Trichollective membership has ended",
    content: {
      preheader: "Your account, basic listing and free reading all stay with you.",
      eyebrow: "Your membership",
      heading: `Your ${m.plan} membership has ended, and your account and basic listing stay with you.`,
      body: [
        `Hello ${firstNameOf(m.name)},`,
        `Your ${m.plan} membership has now ended and you will not be charged again. Thank you for being part of Trichollective.`,
        "## What stays with you",
        [
          "- Your account, so you can sign in with the same email address at any time",
          "- Your basic directory listing (name, discipline, town and specialism), free for as long as you like",
          "- The opening features of every Trichozette edition and the news for practitioners",
        ].join("\n"),
        "Enquiries sent through your listing will wait safely for you, and you can read them if you rejoin.",
        "If you would like to come back, you can rejoin from the pricing page whenever suits you. If something about the membership did not work for you, we would genuinely like to hear about it; simply reply to this email.",
      ].join("\n\n"),
      cta: { label: "Rejoin Trichollective", href: "/pricing" },
      reason: "You receive this because your Trichollective membership has ended.",
    },
  };
}

export function membershipCancelledAlert(m: { name: string | null; email: string; plan: PlanName }): OwnerAlert {
  return {
    subject: `Membership cancelled: ${m.name || m.email}`,
    heading: `${m.name || m.email}'s ${m.plan} membership has ended.`,
    body: "They have been moved back to a free account and sent a note explaining what stays with them and how to rejoin.",
    facts: [
      ["Name", m.name || "Not given"],
      ["Email", m.email],
      ["Plan", m.plan],
    ],
    cta: { label: "View members", href: "/studio/members" },
    replyTo: m.email,
  };
}

export function paymentFailedEmail(p: { name: string | null; plan: PlanName; amount: string | null; nextAttempt: Date | null }): Email {
  return {
    subject: "Your Trichollective payment did not go through",
    content: {
      preheader: "Please update your card so your membership carries on without a break.",
      eyebrow: "Your membership",
      heading: "Your latest payment did not go through, and updating your card takes a minute.",
      body: [
        `Hello ${firstNameOf(p.name)},`,
        `We tried to take ${p.amount ? `your ${p.plan} membership payment of ${p.amount}` : `your ${p.plan} membership payment`}, but your card was declined. This often happens when a card has expired or been replaced.`,
        p.nextAttempt
          ? `Your membership is still in place for now, and we will try the payment again on ${longDate(p.nextAttempt)}. To avoid any break in your access, please update your card before then.`
          : "Your membership is still in place for now, and we will try the payment again over the next few days. To avoid any break in your access, please update your card.",
        "Go to Plan and billing and choose to manage your billing. Your card details are handled securely by Stripe and never stored by Trichollective.",
        "If you meant to end your membership, there is nothing you need to do. If you have any questions, simply reply to this email.",
      ].join("\n\n"),
      cta: { label: "Update your card", href: "/members/billing" },
      reason: "You receive this because a payment for your Trichollective membership was declined.",
    },
  };
}

export function paymentFailedAlert(p: { name: string | null; email: string; plan: PlanName; amount: string | null; attempt: number | null }): OwnerAlert {
  const facts: [string, string][] = [
    ["Name", p.name || "Not given"],
    ["Email", p.email],
    ["Plan", p.plan],
  ];
  if (p.amount) facts.push(["Amount", p.amount]);
  if (p.attempt) facts.push(["Attempt", String(p.attempt)]);
  return {
    subject: `Payment failed: ${p.name || p.email}`,
    heading: `A ${p.plan} payment from ${p.name || p.email} has failed.`,
    body: "They have been asked to update their card. Stripe will retry the payment automatically.",
    facts,
    cta: { label: "View members", href: "/studio/members" },
    replyTo: p.email,
  };
}

/* ------------------------------------------------------------------ */
/* Samples for the Studio                                               */
/* ------------------------------------------------------------------ */

function sample(id: string, name: string, trigger: string, audience: EmailSample["audience"], e: Email): EmailSample {
  return { id, name, trigger, audience, subject: e.subject, content: e.content };
}

function ownerSample(id: string, name: string, trigger: string, a: OwnerAlert): EmailSample {
  return { id, name, trigger, audience: "owners", subject: `[Trichollective] ${a.subject}`, content: ownerAlertContent(a) };
}

export const samples: EmailSample[] = [
  sample(
    "welcome-professional",
    "Welcome to Professional",
    "Sent when someone pays for a membership. This example is a founding Professional member who claimed a listing.",
    "members",
    welcomeEmail({ name: "Niamh Byrne", plan: "Professional", founding: true, listingClaimed: true, enquiriesReleased: 2 })
  ),
  sample(
    "welcome-community",
    "Welcome to Community",
    "Sent when someone pays for a Community membership.",
    "members",
    welcomeEmail({ name: "Ciara Doyle", plan: "Community", founding: false, listingClaimed: false, enquiriesReleased: 0 })
  ),
  ownerSample(
    "alert-new-member",
    "New member",
    "Sent to the owners when someone pays for a membership.",
    newMemberAlert({
      name: "Niamh Byrne",
      email: "niamh@byrnetrichology.ie",
      plan: "Professional",
      interval: "month",
      amount: "€16.00",
      founding: true,
      source: "dublin-conference",
    })
  ),
  sample(
    "membership-ended",
    "Membership ended",
    "Sent when a membership is cancelled or ends.",
    "members",
    membershipEndedEmail({ name: "Niamh Byrne", plan: "Professional" })
  ),
  ownerSample(
    "alert-membership-cancelled",
    "Membership cancelled",
    "Sent to the owners when a membership ends.",
    membershipCancelledAlert({ name: "Niamh Byrne", email: "niamh@byrnetrichology.ie", plan: "Professional" })
  ),
  sample(
    "payment-failed",
    "Payment failed",
    "Sent when a renewal payment is declined.",
    "members",
    paymentFailedEmail({ name: "Niamh Byrne", plan: "Professional", amount: "£14.00", nextAttempt: new Date("2026-10-04T09:00:00Z") })
  ),
  ownerSample(
    "alert-payment-failed",
    "Payment failed (owners)",
    "Sent to the owners when a renewal payment is declined.",
    paymentFailedAlert({ name: "Niamh Byrne", email: "niamh@byrnetrichology.ie", plan: "Professional", amount: "£14.00", attempt: 1 })
  ),
];
