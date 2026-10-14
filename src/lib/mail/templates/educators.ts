import type { EmailContent } from "../layout";
import { firstNameOf } from "./members";

/** Educator membership emails: welcome after paying, and the team's decision. */

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
