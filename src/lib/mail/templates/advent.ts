import { ADVENT_QUOTES, adventDoor } from "@/content/gazette/advent";
import type { EmailSample } from "../catalogue";
import type { EmailContent } from "../layout";
import { ownerAlertContent, type OwnerAlert } from "../send";
import { firstNameOf } from "./directory";

/**
 * The Trichozette advent (Edition 10): the 7am "your door is ready" email,
 * sent 1 to 12 December 2026 by /api/cron/advent, and the emails a claim sends.
 */

type Email = { subject: string; content: EmailContent };

export const ADVENT_HREF = "/trichozette/ready-for-2027#advent";
const BAND_SUB = "Trichozette advent";
const DRAW_DATE = "19 December 2026";

function doorOf(day: number) {
  const door = adventDoor(day);
  if (!door) throw new Error(`There is no advent door ${day}.`);
  return door;
}

/** The morning email. It names the kind of gift with the door's hint, never the gift itself. */
export function adventDoorEmail(p: { name: string | null | undefined; day: number }): Email {
  const door = doorOf(p.day);
  const quote = ADVENT_QUOTES[p.day - 1];
  const subject = `Door ${p.day} is ready to open`;
  return {
    subject,
    content: {
      preheader: `Behind today's door: something ${door.hint}.`,
      eyebrow: "Trichozette advent",
      heading: subject,
      body: [
        `Hello ${firstNameOf(p.name)},`,
        `Door ${p.day} of the Trichozette advent opened at midnight. Behind it today: something ${door.hint}.`,
        "Every door stays open once it has opened, so if a busy morning gets in the way, it will still be there when you have a moment.",
      ].join("\n\n"),
      quote,
      cta: { label: `Open door ${p.day}`, href: ADVENT_HREF },
      festive: { band: `Door ${p.day}`, sub: BAND_SUB },
      reason: "You're getting this because you have a Trichollective account.",
    },
  };
}

/** To the member, the moment they claim a gift. */
export function adventClaimConfirmEmail(p: { name: string | null | undefined; day: number }): Email {
  const door = doorOf(p.day);
  const draw = p.day === 12;
  const subject = draw ? "You're in the draw" : `We've got your claim for door ${p.day}`;
  return {
    subject,
    content: {
      preheader: draw ? `One winner, drawn on ${DRAW_DATE}.` : `${door.title}: the team will be in touch within two working days.`,
      eyebrow: "Trichozette advent",
      heading: draw ? "You're in the draw for a year of membership" : `We've got your claim for door ${p.day}`,
      body: draw
        ? [
            `Hello ${firstNameOf(p.name)},`,
            `Thank you for entering. You're in the draw for a free year of Trichollective membership, which will be drawn on ${DRAW_DATE}.`,
            "We'll email the winner that day. There's nothing more you need to do.",
          ].join("\n\n")
        : [
            `Hello ${firstNameOf(p.name)},`,
            `Thank you for claiming door ${p.day}: ${door.title.charAt(0).toLowerCase()}${door.title.slice(1)}.`,
            "The team will be in touch within two working days to sort it out with you. If you have a question in the meantime, just reply to this email.",
          ].join("\n\n"),
      cta: { label: "Back to the advent", href: ADVENT_HREF },
      festive: { band: `Door ${p.day}`, sub: BAND_SUB },
      reason: "You're getting this because you claimed a gift in the Trichozette advent.",
    },
  };
}

/** To the owners, so every claim is fulfilled. Replies go straight to the member. */
export function adventClaimOwnerAlert(p: { name: string; email: string; day: number; note?: string | null }): OwnerAlert {
  const door = doorOf(p.day);
  const note = p.note?.trim();
  return {
    subject: p.day === 12 ? `Advent draw entry from ${p.name}` : `Advent claim: door ${p.day}`,
    heading:
      p.day === 12
        ? `${p.name} has entered the advent draw for a year of membership.`
        : `${p.name} has claimed door ${p.day} of the advent. Please get in touch within two working days.`,
    body: p.day === 12 ? `The draw is on ${DRAW_DATE}.` : "Reply to this email to answer them directly.",
    facts: [
      ["Door", String(p.day)],
      ["Gift", door.title],
      ["Name", p.name],
      ["Email", p.email],
      ["Note", note || "None"],
    ],
    replyTo: p.email,
  };
}

/* ------------------------------------------------------------------ */
/* Samples for Studio, Emails                                          */
/* ------------------------------------------------------------------ */

const ownerAlert = adventClaimOwnerAlert({
  name: "Niamh Byrne",
  email: "niamh@example.com",
  day: 7,
  note: "My colleague Aoife would love to come to the January masterclass.",
});

export const samples: EmailSample[] = [
  {
    id: "advent-door",
    name: "Advent door is ready",
    trigger: "Sent at 7am UK time each day from 1 to 12 December 2026 to every account still on the updates list.",
    audience: "members",
    ...adventDoorEmail({ name: "Niamh Byrne", day: 5 }),
  },
  {
    id: "advent-claim",
    name: "Advent gift claimed",
    trigger: "Sent to a member when they claim a gift behind one of the advent doors.",
    audience: "members",
    ...adventClaimConfirmEmail({ name: "Niamh Byrne", day: 7 }),
  },
  {
    id: "advent-draw",
    name: "Advent draw entered",
    trigger: "Sent to a member when they enter the draw behind door 12.",
    audience: "members",
    ...adventClaimConfirmEmail({ name: "Niamh Byrne", day: 12 }),
  },
  {
    id: "owner-advent-claim",
    name: "Advent gift claimed",
    trigger: "Sent to the owners when a member claims an advent gift or enters the draw.",
    audience: "owners",
    subject: `[Trichollective] ${ownerAlert.subject}`,
    content: ownerAlertContent(ownerAlert),
  },
];
