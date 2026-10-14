import type { EmailContent } from "../layout";
import type { Course } from "@/content/courses";
import { firstNameOf } from "./members";

/**
 * Course emails: the confirmation when a place is bought or given, and the
 * certificate when the course is complete. Both are transactional.
 */

type Email = { subject: string; content: EmailContent };

export function courseEnrolledEmail(p: { name: string | null; course: Course; lessons: number; amount: string | null }): Email {
  const c = p.course;
  const facts: [string, string][] = [
    ["Course", c.title],
    ["Lessons", `${p.lessons} lessons and a final assessment`],
    ["Study time", `About ${c.hours} hours, at your own pace`],
  ];
  if (p.amount) facts.push(["Paid", p.amount]);
  return {
    subject: `You're enrolled on ${c.title}`,
    content: {
      preheader: "Your place is ready, and you can start the first lesson whenever it suits you.",
      eyebrow: "Your course",
      image: c.imageKey,
      heading: `Your place on ${c.title} is ready.`,
      body: [
        `Hello ${firstNameOf(p.name)},`,
        "Thank you for enrolling. Every lesson is open to you now, and the course keeps your place, so you can study in short sessions between clients and pick up exactly where you left off.",
        "Each lesson ends with a short knowledge check and a reflection question. Your answers and notes stay private to you, and they make a ready-made record for your CPD log.",
        "When you have finished every lesson and passed the final assessment, your certificate of completion is issued straight away, with its own web address that clients and employers can check.",
        p.amount ? "Stripe sends your payment receipt separately." : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      facts,
      cta: { label: "Start the first lesson", href: `/members/courses/${c.slug}` },
      reason: `You receive this because you enrolled on ${c.title}.`,
    },
  };
}

export function courseCertificateEmail(p: { name: string | null; course: Course; reference: string }): Email {
  const c = p.course;
  return {
    subject: `Your certificate for ${c.title}`,
    content: {
      preheader: `You've completed the course. Your certificate reference is ${p.reference}.`,
      eyebrow: "Certificate of completion",
      image: c.imageKey,
      heading: `Congratulations, you have completed ${c.title}.`,
      body: [
        `Hello ${firstNameOf(p.name)},`,
        `You have finished every lesson and passed the final assessment, so your certificate of completion has been issued. It records ${c.hours} hours of study for your CPD log.`,
        "A badge for the course now shows on your profile and your directory listing, so clients can see the learning you have done. You can hide it from your profile at any time.",
        "Anyone can check the certificate at its web address below. It is a certificate of completion, not an accredited qualification.",
      ].join("\n\n"),
      facts: [
        ["Course", c.title],
        ["Study time", `${c.hours} hours`],
        ["Reference", p.reference],
      ],
      cta: { label: "View your certificate", href: `/members/courses/${c.slug}/certificate` },
      secondary: { label: "The public certificate page", href: `/certificates/${p.reference}` },
      reason: `You receive this because you completed ${c.title}.`,
    },
  };
}

export function courseReviewEmail(p: {
  name: string | null;
  title: string;
  slug: string;
  number: number;
  decision: "approve" | "changes" | "reject";
  note: string;
  /** Where the author edits the course. */
  builderHref: string;
}): Email {
  const note = p.note.trim();
  const copy = {
    approve: {
      subject: `${p.title} is approved and live`,
      heading: `${p.title} has been approved, and it's now on sale.`,
      lead: `Version ${p.number} of your course passed review. Learners can enrol from the course page straight away.`,
      cta: { label: "See the course page", href: `/courses/${p.slug}` },
    },
    changes: {
      subject: `A few changes for ${p.title}`,
      heading: `${p.title} needs a few changes before it can go live.`,
      lead: `Thank you for sending version ${p.number} for review. The reviewer has asked for some changes, set out below. Make them in the course builder and send it again when you're ready.`,
      cta: { label: "Open the course builder", href: p.builderHref },
    },
    reject: {
      subject: `${p.title} wasn't approved`,
      heading: `We weren't able to approve ${p.title}.`,
      lead: `Thank you for sending version ${p.number} for review. The reviewer has explained why below. If you'd like to talk it through, reply to this email.`,
      cta: { label: "Open the course builder", href: p.builderHref },
    },
  }[p.decision];
  return {
    subject: copy.subject,
    content: {
      preheader: copy.lead,
      eyebrow: "Course review",
      heading: copy.heading,
      body: [`Hello ${firstNameOf(p.name)},`, copy.lead, note ? `## The reviewer's note\n\n${note}` : ""].filter(Boolean).join("\n\n"),
      cta: copy.cta,
      reason: `You receive this because you sent ${p.title} for review.`,
    },
  };
}
