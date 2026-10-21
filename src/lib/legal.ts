import { site } from "@/config/site";

/** The date the terms, privacy notice and cookie policy were last changed. */
export const LEGAL_UPDATED = "9 October 2026";

/**
 * Shown above the pay button on Stripe Checkout, so every buyer agrees to the
 * terms and to the service starting straight away before they pay. That express
 * request is what lets payments be non-refundable for consumers under EU and UK
 * distance-selling law. Stripe allows markdown links and up to 1,200 characters.
 */
export function checkoutTermsText(kind: "membership" | "ticket" | "course" | "partner") {
  const terms = `[terms of business](${site.url}/terms)`;
  const messages = {
    membership: `By paying, you agree to our ${terms} and ask us to start your membership straight away. You accept that you lose your 14-day right to cancel once it starts, and that payments are non-refundable. You can cancel at any time to stop the next renewal.`,
    ticket: `By paying, you agree to our ${terms}. Event tickets are non-refundable, and the 14-day right to cancel does not apply to tickets for events on a set date.`,
    // Online courses are digital content: access starts at once, at the buyer's express request.
    course: `By paying, you agree to our ${terms} and ask for access to the course straight away. You accept that you lose your 14-day right to cancel once the course is opened to you, and that course fees are non-refundable.`,
    // Premium partners have already signed their agreement on the onboarding page.
    partner: `By paying, you confirm the Premium partner agreement you signed, our [Premium partner terms](${site.url}/terms/partners) and our ${terms}. The partnership renews each year until you cancel, and payments are non-refundable.`,
  };
  return { submit: { message: messages[kind] } };
}
