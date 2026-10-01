import type { EmailContent } from "./layout";

/**
 * Every email the platform sends, with sample data, so the Studio can show
 * owners exactly what people receive (Studio → Emails).
 */
export type EmailSample = {
  id: string;
  /** Plain name, e.g. "Listing approved". */
  name: string;
  /** When it is sent, in one sentence. */
  trigger: string;
  audience: "owners" | "members" | "practitioners" | "public" | "everyone";
  subject: string;
  content: EmailContent;
};
