import { BUSINESS_SEATS } from "@/lib/subscription";

/** What the portal and the setup say after a save, keyed by the ?saved= value. */
export const SAVED_MESSAGES: Record<string, string> = {
  live: "Your page is saved and live in the partner directory.",
  published: "Your page is now live in the partner directory.",
  draft: "Your page is saved. It stays hidden until you tick Show my page.",
  hidden: "Your changes are saved. The Trichollective team has paused your page, so it isn't showing yet. Reply to any of our emails and we'll help.",
  seat: "Your team member is added, and we've emailed them to say their Professional membership is ready.",
  "seat-removed": "That seat is free again.",
  details: "Your brand details are saved.",
  logo: "Your logo is saved.",
  contact: "Your contact details are saved.",
  address: "Your business address and records are saved.",
  perk: "Your member perk is saved.",
  team: "Your team is up to date.",
};

/** What went wrong, keyed by the ?error= value. "cap", "logo" and "social" carry their own message. */
export const ERROR_MESSAGES: Record<string, string> = {
  plan: "Your page can go live while your Business or Premium Business plan is active. Check your plan in Billing, or reply to any of our emails and we'll help.",
  name: "Please add your business name.",
  category: "Please choose the category closest to what you do.",
  blurb: "Please describe your business in at least a sentence.",
  website: "Please check your website address.",
  contact: "Please check the contact email.",
  phone: "Please check the phone number, or leave it empty.",
  "public-email": "Please check the public email address, or leave it empty.",
  "public-phone": "Please check the public phone number, or leave it empty.",
  vat: "Please check the VAT number. It is usually a country code followed by numbers, such as GB123456789.",
  "company-number": "Please check the company number. A UK company number has eight characters, such as 01234567.",
  save: "Something went wrong saving your details. Please try again.",
  "details-first": "Please start with your brand details, so there is a page to add the rest to.",
  "not-ready": "Your page needs a name, a category and a short description before it can go live.",
  paused: "The Trichollective team has paused your page, so it can't go live yet. Reply to any of our emails and we'll help.",
  "seat-email": "Please check that email address.",
  "seat-self": "You already have your own membership, so add someone else from your team.",
  "seat-full": `All ${BUSINESS_SEATS} seats are in use. Remove someone to add a new team member.`,
  "seat-exists": "That person already has one of your seats.",
};

export function errorText(error?: string, message?: string) {
  if (!error) return null;
  if ((error === "cap" || error === "logo" || error === "social") && message) return message;
  return ERROR_MESSAGES[error] ?? null;
}
