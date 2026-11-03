/**
 * How an enquiry's status reads to the person who sent it. "new" means it is held
 * until the professional claims their listing; "forwarded" means it was delivered.
 */
export function consumerEnquiryStatus(status: string, professional: string) {
  switch (status) {
    case "forwarded":
      return { label: "Sent", detail: `Your message was sent to ${professional}, who will reply to you by email.` };
    case "closed":
      return { label: "Closed", detail: "This enquiry has been closed. You can send a new one from their profile at any time." };
    default:
      return {
        label: "Waiting",
        detail: `${professional} has not claimed their listing yet. We have let them know a message is waiting, and it will reach them when they do.`,
      };
  }
}
