import type { EmailContent } from "../layout";
import type { EmailSample } from "../catalogue";
import type { OwnerAlert } from "../send";
import { firstNameOf } from "./members";
import { formatMoney } from "./billing";

/** Educator emails: welcome after paying, the team's decision, and the course build service. */

type Email = { subject: string; content: EmailContent };

export function educatorWelcomeEmail(p: { name: string | null }): Email {
  return {
    subject: "Welcome to Trichollective as an Educator",
    content: {
      preheader: "Your Educator membership has started. Here is what happens next.",
      eyebrow: "Educator membership",
      heading: "Thank you for joining as an Educator. Your membership has started.",
      body: [
        `Hello ${firstNameOf(p.name)},`,
        "Your payment has gone through, and you have the benefits of Professional membership from today.",
        "Karley and the team will now look at your application, usually within five working days. While you wait, complete your educator profile and start writing your first course in the course builder.",
        "## What happens next",
        "- Complete your profile, so learners know who is teaching them\n- Start a course: lessons, case studies, video, handouts and a final assessment\n- Once you're approved, connect your Stripe account so your 70% of each sale can be paid to you, then send your course for review",
        "If we don't approve your application, we will explain why and refund your membership fee in full.",
      ].join("\n\n"),
      cta: { label: "Open your educator dashboard", href: "/members/educator" },
      secondary: { label: "Read the Educator terms", href: "/terms/educators" },
      reason: "You receive this because you joined Trichollective as an Educator.",
    },
  };
}

export function educatorDecisionEmail(p: { name: string | null; decision: "approve" | "reject" | "suspend" | "reinstate"; note: string }): Email {
  const note = p.note.trim();
  const copy = {
    approve: {
      subject: "You're approved as a Trichollective Educator",
      heading: "You're approved, and you can now send courses for review.",
      lead: "Welcome to the Educator programme. Connect your Stripe account so your share of each sale can be paid to you, then send your first course for review whenever it's ready.",
    },
    reject: {
      subject: "Your Educator application",
      heading: "We weren't able to approve your Educator application.",
      lead: "Thank you for applying. We've explained our reasons below, and we're refunding your membership fee in full. It should reach your account within 5 to 10 working days.",
    },
    suspend: {
      subject: "Your Educator membership is suspended",
      heading: "Your Educator membership is suspended for now.",
      lead: "Your courses are off sale while this is resolved. Learners who already have a place keep access. The reason is below; reply to this email if you'd like to talk it through.",
    },
    reinstate: {
      subject: "Your Educator membership is active again",
      heading: "Your Educator membership is active again.",
      lead: "You can edit your courses and send them for review as before. Any courses that were taken off sale need to be put back on sale by the team; reply to this email if you'd like that.",
    },
  }[p.decision];
  return {
    subject: copy.subject,
    content: {
      preheader: copy.lead,
      eyebrow: "Educator membership",
      heading: copy.heading,
      body: [`Hello ${firstNameOf(p.name)},`, copy.lead, note ? `## A note from the team\n\n${note}` : ""].filter(Boolean).join("\n\n"),
      cta: { label: "Open your educator dashboard", href: "/members/educator" },
      reason: "You receive this because you are an Educator member of Trichollective.",
    },
  };
}

// ---------------------------------------------------------------------------
// The course-build service
// ---------------------------------------------------------------------------

export type CourseBuildQuote = { name: string | null; title: string; tierName: string; amountPence: number; note?: string | null; sharePct: number };

/** The team has quoted for building a course; the educator accepts and pays from their dashboard. */
export function courseBuildQuoteEmail(p: CourseBuildQuote): Email {
  const amount = formatMoney(p.amountPence, "gbp") ?? "";
  return {
    subject: `Your quote for "${p.title}"`,
    content: {
      preheader: `${p.tierName}: ${amount}, including VAT. We start work as soon as you accept and pay.`,
      eyebrow: "Course build service",
      heading: `Here is our quote for building "${p.title}" with you.`,
      body: [
        `Hello ${firstNameOf(p.name)},`,
        "Thank you for sending us your course. We've read your brief and material, and this is what we propose.",
        p.note?.trim() ? `## What the quote covers\n\n${p.note.trim()}` : "",
        `You keep ${p.sharePct}% of every sale of the finished course, and it is sold under your name like any other course you write.`,
        "When you're happy with the quote, accept and pay from your educator dashboard, and we'll start work straight away. If anything needs changing first, reply to this email.",
      ]
        .filter(Boolean)
        .join("\n\n"),
      facts: [
        ["Course", p.title],
        ["Service", p.tierName],
        ["Fee", `${amount}, including VAT`],
        ["Your share of each sale", `${p.sharePct}%`],
      ],
      cta: { label: "Accept and pay", href: "/members/educator#tailored" },
      secondary: { label: "Read the course build terms", href: "/terms/educators#build-service" },
      reason: "You receive this because you asked the Trichollective team to build a course with you.",
    },
  };
}

/** The educator has paid for a course build: the team starts work. */
export function courseBuildPaidEmail(p: { name: string | null; title: string; tierName: string; amountPence: number }): Email {
  const amount = formatMoney(p.amountPence, "gbp") ?? "";
  return {
    subject: `We've started building "${p.title}"`,
    content: {
      preheader: `Your payment of ${amount} has gone through, and the team has started work.`,
      eyebrow: "Course build service",
      heading: `Your payment has gone through, and we've started building "${p.title}".`,
      body: [
        `Hello ${firstNameOf(p.name)},`,
        "Thank you. The team has started work on your course, and you'll find it in your course builder as soon as the first lessons are written.",
        "We'll email you when it's ready for you to review. You can read and comment on every lesson before it goes to the team for review and on sale.",
        "Stripe has emailed you a receipt for the payment.",
      ].join("\n\n"),
      facts: [
        ["Course", p.title],
        ["Service", p.tierName],
        ["Paid", `${amount}, including VAT`],
      ],
      cta: { label: "Open your educator dashboard", href: "/members/educator#tailored" },
      reason: "You receive this because you paid for the Trichollective course build service.",
    },
  };
}

/** Tells the owners an educator has paid for a course build, so work can start. */
export function courseBuildPaidAlert(p: { educatorName: string; email: string | null; title: string; tierName: string; amountPence: number; requestId: string }): OwnerAlert {
  const amount = formatMoney(p.amountPence, "gbp") ?? "";
  return {
    subject: `Course build paid: ${p.title} (${amount})`,
    heading: `${p.educatorName} has paid ${amount} for the team to build "${p.title}".`,
    body: "The request has moved to Building. Start the course for them in Studio and assign it to whoever is writing it.",
    facts: [
      ["Educator", p.educatorName],
      ["Email", p.email ?? ""],
      ["Service", p.tierName],
      ["Paid", `${amount}, including VAT`],
    ],
    cta: { label: "Open the request in Studio", href: `/studio/educators/requests#r-${p.requestId}` },
    replyTo: p.email ?? undefined,
  };
}

const sampleQuote: CourseBuildQuote = {
  name: "Áine Byrne",
  title: "Scalp assessment for colourists",
  tierName: "Build",
  amountPence: 145000,
  note: "A six-lesson course written from your conference talk and handouts, with three case studies, a knowledge check after each lesson and a final assessment.",
  sharePct: 60,
};

export const samples: EmailSample[] = [
  sample("educator-welcome", "Educator welcome", "Sent when someone pays for Educator membership.", educatorWelcomeEmail({ name: "Áine Byrne" })),
  sample("course-build-quote", "Course build quote", "Sent when the team sends an educator a quote for building their course.", courseBuildQuoteEmail(sampleQuote)),
  sample("course-build-paid", "Course build payment received", "Sent when an educator pays for a course build.", courseBuildPaidEmail(sampleQuote)),
  ownerSample(
    "alert-course-build-paid",
    "Course build paid",
    "Sent to the owners when an educator pays for a course build.",
    courseBuildPaidAlert({ educatorName: "Áine Byrne", email: "aine@example.com", title: sampleQuote.title, tierName: "Build", amountPence: 145000, requestId: "sample" })
  ),
];

function sample(id: string, name: string, trigger: string, e: Email): EmailSample {
  return { id, name, trigger, audience: "practitioners", subject: e.subject, content: e.content };
}

function ownerSample(id: string, name: string, trigger: string, a: OwnerAlert): EmailSample {
  // Mirrors alertOwners(), like the leads gallery, so templates stay free of the mail sender.
  const content: EmailContent = {
    preheader: a.heading,
    eyebrow: "Studio alert",
    heading: a.heading,
    body: a.body ?? "",
    facts: a.facts,
    cta: a.cta,
    signoff: null,
    reason: "You receive this because you own Trichollective. Change who gets alerts with the OWNER_EMAILS setting.",
  };
  return { id, name, trigger, audience: "owners", subject: `[Trichollective] ${a.subject}`, content };
}
