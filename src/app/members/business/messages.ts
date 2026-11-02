import { BUSINESS_SEATS } from "@/lib/subscription";
import { MAX_OPEN_JOBS } from "@/lib/jobs";

/** What the portal and the setup say after a save, keyed by the ?saved= value. */
export const SAVED_MESSAGES: Record<string, string> = {
  live: "Your page is saved and live in the partner directory.",
  published: "Your page is now live in the partner directory.",
  draft: "Your page is saved. It stays hidden until you tick Show my page.",
  hidden: "Your changes are saved. The Trichollective team has paused your page, so it isn't showing yet. Reply to any of our emails and we'll help.",
  seat: "Your team member is added, and we've emailed them to say their Professional membership is ready.",
  "seat-removed": "That seat is free again.",
  job: "Your changes to the role are saved.",
  "job-posted": "Your role is live on the jobs board and on your business page, and members have been told about it.",
  "job-closed": "That role is closed and no longer shows on the jobs board.",
  "job-reopened": "That role is open again for another 60 days.",
  "job-deleted": "That role is deleted.",
  "seat-profile": "Your team member's details are saved, and they show on your business page when it's live.",
  details: "Your brand details are saved.",
  logo: "Your logo, cover and colour are saved.",
  story: "Your story is saved.",
  offerings: "Your products and services are saved.",
  photo: "Your photos are updated.",
  photos: "Your photos are saved.",
  extras: "Your video and features are saved.",
  contact: "Your contact details are saved.",
  address: "Your business address and records are saved.",
  perk: "Your member perk is saved.",
  team: "Your team is up to date.",
};

/** What went wrong, keyed by the ?error= value. "cap", "logo", "social" and "photo" carry their own message. */
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
  colour: "Please choose your brand colour as a hex value, like #D4007A.",
  cta: "Please check the button link. It needs to be a full web address, or leave it empty.",
  video: "Please use a YouTube or Vimeo link for your video.",
  save: "Something went wrong saving your details. Please try again.",
  "details-first": "Please start with your brand details, so there is a page to add the rest to.",
  "not-ready": "Your page needs a name, a category and a short description before it can go live.",
  paused: "The Trichollective team has paused your page, so it can't go live yet. Reply to any of our emails and we'll help.",
  "seat-email": "Please check that email address.",
  "seat-self": "You already have your own membership, so add someone else from your team.",
  "seat-full": `All ${BUSINESS_SEATS} seats are in use. Remove someone to add a new team member.`,
  "seat-exists": "That person already has one of your seats.",
  "job-page": "Set up and publish your business page first, so candidates can see who they would work for.",
  "job-plan": "Posting roles is part of the Business plan. Check your plan in billing to post again.",
  "job-missing": "We couldn't find that role. Please try again.",
  "job-hidden": "The Trichollective team has taken this role down, so it can't be reopened. Reply to any of our emails and we'll help.",
  "job-full": `You can have up to ${MAX_OPEN_JOBS} roles open at once. Close one to post another.`,
  "seat-missing": "We couldn't find that team member. Please try again.",
  "seat-photo": "That photo couldn't be used. Please choose a JPG, PNG or WebP image under 8MB.",
};

export function errorText(error?: string, message?: string) {
  if (!error) return null;
  if ((error === "cap" || error === "logo" || error === "social" || error === "photo" || error === "job-form") && message) return message;
  return ERROR_MESSAGES[error] ?? null;
}
