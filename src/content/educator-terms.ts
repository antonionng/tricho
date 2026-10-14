import { site } from "@/config/site";
import { educatorMembership } from "@/config/subscriptions";

/**
 * The Educator terms, agreed at checkout. Kept as plain text so the same words
 * are published at /terms/educators and the version is saved with each
 * educator. Change EDUCATOR_TERMS_VERSION whenever the wording changes.
 *
 * Draft for legal review before launch: course ownership and licence, content
 * warranties and indemnity, and how VAT affects the revenue share.
 */
export const EDUCATOR_TERMS_VERSION = "2026-10-14";
export const EDUCATOR_TERMS_UPDATED = "14 October 2026";

export type EducatorTermsSection = { id: string; heading: string; paragraphs: string[] };

const share = educatorMembership.defaultSharePct;

export const educatorTerms: EducatorTermsSection[] = [
  {
    id: "agreement",
    heading: "The agreement",
    paragraphs: [
      `These terms are an agreement between ${site.company.name}, a company registered in ${site.company.registeredIn} with number ${site.company.number}, of ${site.company.address} ("${site.name}", "we") and you, the Educator member ("you"). They sit alongside our general terms of business at ${site.url}/terms. If the two ever disagree, these Educator terms come first for anything to do with your courses.`,
    ],
  },
  {
    id: "membership",
    heading: "Your membership and fee",
    paragraphs: [
      `Educator membership costs £${educatorMembership.annualPrice} a year, including VAT, and renews automatically each year. You can cancel at any time to stop the next renewal, and your membership continues until the end of the year you have paid for.`,
      "While you are an Educator you also have the benefits of Professional membership.",
    ],
  },
  {
    id: "approval",
    heading: "Approval after you join",
    paragraphs: [
      "You pay when you join, and the Trichollective team then reviews your application, usually within five working days. You can start writing courses straight away, but you can only send a course for review once you are approved.",
      "If we don't approve you, we will tell you why and refund your membership fee in full.",
    ],
  },
  {
    id: "courses",
    heading: "Your courses",
    paragraphs: [
      "You own the courses you write. You give us a non-exclusive licence to host, review, sell, promote and deliver them on Trichollective, and to use their titles, summaries and images to promote them.",
      "Learners who have bought a course keep access to it for as long as Trichollective offers courses, even if you later stop being an Educator or take the course off sale.",
      "You confirm that you have the right to everything in your courses, including text, images, video and handouts, and that they don't infringe anyone else's rights.",
    ],
  },
  {
    id: "standards",
    heading: "Content standards and review",
    paragraphs: [
      "Every course and every update to it is reviewed by the Trichollective team before it goes on sale. We may ask for changes, or decline a course, and we will always explain why.",
      "Your courses must be accurate and up to date, and must keep each learner within their own scope of practice. They must not make claims to diagnose, treat or cure, or promote products in a way that isn't clearly labelled.",
      "Our review is editorial. It does not make Trichollective responsible for the clinical accuracy of your course, which stays with you as its author.",
    ],
  },
  {
    id: "revenue",
    heading: "Revenue share and payouts",
    paragraphs: [
      `You receive ${share}% of the amount each learner pays for your course, and Trichollective keeps the rest. We pay the card processing fees out of our share. If we agree a different share with you for a particular course, we will confirm it in writing before the course goes on sale.`,
      "To be paid you connect a Stripe account. Your share of each sale is transferred to it automatically when the learner pays, and Stripe pays it into your bank account on its usual schedule. Stripe's own terms apply to your Stripe account.",
      "You are responsible for any tax due on your earnings.",
    ],
  },
  {
    id: "refunds",
    heading: "Refunds",
    paragraphs: [
      "Learners agree when they buy that course fees are non-refundable once the course is opened to them. If we do refund a learner, for example because of a fault or a legal requirement, your share of that sale is reversed from your Stripe balance.",
    ],
  },
  {
    id: "ending",
    heading: "Ending your membership",
    paragraphs: [
      "If your membership ends, your courses are taken off sale. Learners who already have a place keep access, and we keep the records needed to check their certificates.",
      "We may suspend your membership, or take a course off sale, if a course breaks these standards or a complaint needs investigating. We will tell you why, and give you the chance to put things right where we can.",
    ],
  },
  {
    id: "changes",
    heading: "Changes to these terms",
    paragraphs: [
      "We will give you at least 30 days' notice by email before these terms change. If you don't agree to the change, you can cancel before it takes effect.",
    ],
  },
];
