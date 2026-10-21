import type { EmailSample } from "../catalogue";
import type { EmailContent } from "../layout";
import { firstNameOf } from "./directory";

/** Emails to a member whose invitation code brought in a new paying member. */

type Email = { subject: string; content: EmailContent };

export type RewardFacts = {
  /** The person who shared their code. */
  name: string | null;
  /** The colleague who joined; only their first name is used. */
  referredName: string | null;
  /** Formatted value of the reward, e.g. "£14.00". Null when it isn't known yet. */
  amount: string | null;
};

const colleague = (name: string | null) => firstNameOf(name, "A colleague");

/** Sent when a reward has been taken off the referrer's next bill. */
export function referralCreditedEmail(r: RewardFacts): Email {
  const who = colleague(r.referredName);
  const value = r.amount ? `${r.amount}, the price of one month of your membership,` : "the price of one month of your membership";
  return {
    subject: `${who} joined Trichollective with your code, so your next month is on us`,
    content: {
      preheader: "The credit is already on your account and comes off your next bill automatically.",
      eyebrow: "Invite colleagues",
      heading: `${who} has joined Trichollective with your code, and your next month of membership is free.`,
      body: [
        `Hello ${firstNameOf(r.name)},`,
        `${who} joined Trichollective with your invitation code and their first payment has now cleared. Thank you for bringing another hair and scalp professional into the community.`,
        `We have added ${value} as credit to your account. It comes off your next bill automatically, so there is nothing you need to do.`,
        "Every colleague who joins with your code earns you another free month, and they pay half price for their first month.",
      ].join("\n\n"),
      cta: { label: "Invite more colleagues", href: "/members/refer" },
      reason: "You receive this because a colleague joined Trichollective with your invitation code.",
    },
  };
}

/** Sent when a reward is earned but the referrer has no paid membership to credit yet. */
export function referralBankedEmail(r: RewardFacts): Email {
  const who = colleague(r.referredName);
  return {
    subject: `${who} joined Trichollective with your code, and a free month is waiting for you`,
    content: {
      preheader: "Your free month is kept for you and applied as soon as you become a member.",
      eyebrow: "Invite colleagues",
      heading: `${who} has joined Trichollective with your code, and we are keeping a free month for you.`,
      body: [
        `Hello ${firstNameOf(r.name)},`,
        `${who} joined Trichollective with your invitation code and their first payment has now cleared. Thank you for bringing another hair and scalp professional into the community.`,
        "You have earned one month of membership free. Because you do not have a paid membership yet, we are keeping it for you, and it comes off your bill automatically as soon as you join.",
        "Membership gives you the community, monthly masterclasses and member prices on courses and conferences, and Professional adds the Case Room, the referral network and a CPD log that fills itself in.",
      ].join("\n\n"),
      cta: { label: "Choose your membership", href: "/pricing" },
      secondary: { label: "See your invitations", href: "/members/refer" },
      reason: "You receive this because a colleague joined Trichollective with your invitation code.",
    },
  };
}

/* ------------------------------------------------------------------ */
/* Samples for the Studio                                               */
/* ------------------------------------------------------------------ */

function sample(id: string, name: string, trigger: string, e: Email): EmailSample {
  return { id, name, trigger, audience: "members", subject: e.subject, content: e.content };
}

export const samples: EmailSample[] = [
  sample(
    "referral-credited",
    "Referral reward credited",
    "Sent when a colleague who joined with the member's code makes their first payment, and a free month is credited to the member's bill.",
    referralCreditedEmail({ name: "Aoife Kelly", referredName: "Niamh Byrne", amount: "£14.00" })
  ),
  sample(
    "referral-banked",
    "Referral reward kept for later",
    "Sent when a colleague who joined with the code of someone on a free account makes their first payment, so the free month is kept until they join.",
    referralBankedEmail({ name: "Aoife Kelly", referredName: "Niamh Byrne", amount: null })
  ),
];
