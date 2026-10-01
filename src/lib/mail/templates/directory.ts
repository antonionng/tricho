import { FREE_LISTING_DAYS } from "@/config/subscriptions";
import type { EmailSample } from "../catalogue";
import type { EmailContent } from "../layout";
import type { OwnerAlert } from "../send";

/**
 * Directory emails: a listing being received, checked and approved, Studio
 * access, and enquiries from the public reaching a practitioner.
 */

type Email = { subject: string; content: EmailContent };

const DISCIPLINE: Record<string, string> = {
  cosmetic: "Cosmetic",
  clinical: "Clinical",
  medical: "Medical",
  brand: "Brand",
};

export function disciplineLabel(profession: string) {
  return DISCIPLINE[profession] ?? profession;
}

/** "Niamh Byrne" -> "Niamh"; "Dr Aoife Kelly" -> "Dr Kelly". */
export function firstNameOf(name: string | null | undefined, fallback = "there") {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  if (/^(dr|mr|mrs|ms|miss|mx|prof|professor)\.?$/i.test(parts[0]) && parts.length > 1) {
    return `${parts[0]} ${parts[parts.length - 1]}`;
  }
  return parts[0];
}

/** 3 January 2027 */
export function longDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
}

/** The same content alertOwners builds, so the Studio can preview owner alerts. */
export function ownerAlertContent(a: OwnerAlert): EmailContent {
  return {
    preheader: a.heading,
    eyebrow: "Studio alert",
    heading: a.heading,
    body: a.body ?? "",
    facts: a.facts,
    cta: a.cta,
    signoff: null,
    reason: "You receive this because you own Trichollective. Change who gets alerts with the OWNER_EMAILS setting.",
  };
}

export type ListingFacts = { name: string; email?: string; profession: string; city: string; country?: string | null };

function listingFacts(l: ListingFacts, withEmail = false): [string, string][] {
  return [
    ["Name", l.name],
    ...(withEmail && l.email ? ([["Email", l.email]] as [string, string][]) : []),
    ["Discipline", disciplineLabel(l.profession)],
    ["Town or city", l.city],
    ...(l.country ? ([["Country", l.country]] as [string, string][]) : []),
  ];
}

/* ------------------------------------------------------------------ */
/* Listings                                                             */
/* ------------------------------------------------------------------ */

export function listingReceivedEmail(l: ListingFacts): Email {
  return {
    subject: "We have received your Trichollective directory listing",
    content: {
      preheader: "A person checks every listing, usually within two working days.",
      eyebrow: "Your listing",
      heading: "We have received your listing, and a person will check it within two working days.",
      body: [
        `Hello ${firstNameOf(l.name)},`,
        "Thank you for adding your practice to the Trichollective directory. Every listing is checked by a person before it goes live, so that clients and colleagues can trust who they find. This usually takes no more than two working days.",
        `As soon as your listing is approved we will email you the link to your public profile. Your full profile, with your photo, services, website and enquiries sent straight to you, is free for your first ${FREE_LISTING_DAYS} days from that moment.`,
        "If anything below needs correcting, simply reply to this email and we will update it for you.",
      ].join("\n\n"),
      facts: listingFacts(l),
      reason: "You receive this because you submitted a listing to the Trichollective directory.",
    },
  };
}

export function newListingAlert(l: ListingFacts & { email: string; source?: string | null; via: string }): OwnerAlert {
  return {
    subject: `New listing to review: ${l.name}`,
    heading: `${l.name} has asked to be listed in the directory.`,
    body: `The listing came in through ${l.via}. It stays hidden until someone approves it in the Studio, and approving it starts the ${FREE_LISTING_DAYS}-day full profile.`,
    facts: [...listingFacts(l, true), ...(l.source ? ([["Source", l.source]] as [string, string][]) : [])],
    cta: { label: "Review listings", href: "/studio/listings" },
    replyTo: l.email,
  };
}

export function listingApprovedEmail(l: { name: string; slug: string; freeUntil: Date }): Email {
  const profile = `/directory/p/${l.slug}`;
  return {
    subject: "Your listing is live in the Trichollective directory",
    content: {
      preheader: `Your full profile is free until ${longDate(l.freeUntil)}.`,
      eyebrow: "Your listing",
      image: "ed12",
      heading: "Your listing is live in the Trichollective directory.",
      body: [
        `Hello ${firstNameOf(l.name)},`,
        "We have checked your listing and it is now live, so clients and colleagues looking for help with their hair and scalp can find you.",
        `Your full profile is free until ${longDate(l.freeUntil)}. Until then it gives you:`,
        [
          "- Your photo and a short headline, so people recognise you before the consultation",
          "- The services you offer, from trichoscopy to scalp treatments, listed on your profile",
          "- A link to your website and booking page",
          "- Enquiries from the public sent straight to your inbox, ready for you to reply",
        ].join("\n"),
        "Profiles with a photo and services listed are the ones people contact, so it is worth taking five minutes to add them now.",
        `After ${longDate(l.freeUntil)} your basic listing (name, discipline, town and specialism) stays in the directory for free, for as long as you like. We will remind you before the full profile ends.`,
      ].join("\n\n"),
      cta: { label: "Add your photo and services", href: "/members/profile" },
      secondary: { label: "View your listing", href: profile },
      reason: "You receive this because you listed your practice in the Trichollective directory.",
    },
  };
}

export function listingNotApprovedEmail(l: { name: string }): Email {
  return {
    subject: "Your Trichollective listing is not live yet",
    content: {
      preheader: "A little more detail about your practice will help us approve it.",
      eyebrow: "Your listing",
      heading: "Your listing is not live yet, and a little more detail will help us approve it.",
      body: [
        `Hello ${firstNameOf(l.name)},`,
        "Thank you for adding your practice to the Trichollective directory. We check every listing by hand so that clients can trust who they find, and we were not able to approve yours from the details we have.",
        "This is often simply because we could not see enough about the work you do. If you reply to this email with a little more about your practice, such as your training or registration, where you see clients and the hair and scalp concerns you help with, we will take another look.",
        "We would be glad to have you in the directory.",
      ].join("\n\n"),
      reason: "You receive this because you submitted a listing to the Trichollective directory.",
    },
  };
}

export function studioAccessEmail(u: { name: string | null }): Email {
  return {
    subject: "You now have access to the Trichollective Studio",
    content: {
      preheader: "Review listings, approve drafts and look after members from one place.",
      eyebrow: "The Studio",
      heading: "You now have access to the Trichollective Studio.",
      body: [
        `Hello ${firstNameOf(u.name)},`,
        "You have been added to the Trichollective team. The Studio is where we review new directory listings, approve the emails and posts the agents draft, look after members and keep the community safe.",
        "Sign in with this email address and you will find the Studio in your menu, or use the button below.",
      ].join("\n\n"),
      cta: { label: "Open the Studio", href: "/studio" },
      reason: "You receive this because a Trichollective owner gave your account Studio access.",
    },
  };
}

/* ------------------------------------------------------------------ */
/* Enquiries                                                            */
/* ------------------------------------------------------------------ */

export type EnquiryFacts = { practitionerName: string; enquirerName: string; enquirerEmail: string; message: string };

export function enquiryToPractitionerEmail(e: EnquiryFacts): Email {
  const first = firstNameOf(e.enquirerName, e.enquirerName);
  const mailto = `mailto:${e.enquirerEmail}?subject=${encodeURIComponent("Your enquiry through Trichollective")}`;
  return {
    subject: `New enquiry from ${e.enquirerName} through Trichollective`,
    content: {
      preheader: `${e.enquirerName} found you in the directory. Reply to this email to answer them directly.`,
      eyebrow: "New enquiry",
      heading: `${e.enquirerName} has asked you a question through the Trichollective directory.`,
      body: [
        `Hello ${firstNameOf(e.practitionerName)},`,
        `${e.enquirerName} found your profile in the directory and sent you this message:`,
        e.message,
        `Simply reply to this email and your answer will go straight to ${first}. We have not shared your email address with them; they will see it only when you reply.`,
      ].join("\n\n"),
      facts: [
        ["Name", e.enquirerName],
        ["Email", e.enquirerEmail],
      ],
      cta: { label: `Reply to ${first}`, href: mailto },
      reason: "You receive this because someone contacted you through your Trichollective directory listing.",
    },
  };
}

export function enquirySentEmail(e: { enquirerName: string; practitionerName: string }): Email {
  return {
    subject: `Your message to ${e.practitionerName} has been passed on`,
    content: {
      preheader: `${e.practitionerName} will reply to you directly by email.`,
      eyebrow: "Your enquiry",
      heading: `Your message has been passed to ${e.practitionerName}, who will reply to you directly.`,
      body: [
        `Hello ${firstNameOf(e.enquirerName)},`,
        `Thank you for getting in touch through the Trichollective directory. We have sent your message to ${e.practitionerName}, and their reply will come straight to this email address.`,
        "Practitioners are often with clients during the day, so please allow a little time for a reply. If your hair or scalp concern is urgent or you feel unwell, please speak to your GP or pharmacist.",
      ].join("\n\n"),
      secondary: { label: "Browse the directory", href: "/directory" },
      reason: "You receive this because you sent an enquiry through the Trichollective directory.",
    },
  };
}

export function enquiryHeldReceiptEmail(e: { enquirerName: string; practitionerName: string }): Email {
  return {
    subject: `We have let ${e.practitionerName} know you are trying to reach them`,
    content: {
      preheader: "Your message is safe with us, and they can reply as soon as they read it.",
      eyebrow: "Your enquiry",
      heading: `We have let ${e.practitionerName} know that you are trying to reach them.`,
      body: [
        `Hello ${firstNameOf(e.enquirerName)},`,
        `Thank you for getting in touch through the Trichollective directory. ${e.practitionerName} does not currently receive messages through their listing, so we are holding yours safely and have let them know someone is trying to reach them. If they choose to read it, their reply will come straight to this email address.`,
        `Because we cannot promise when that will be, you may also like to contact another practitioner near you. Professionals with a full profile receive enquiries straight away.`,
      ].join("\n\n"),
      cta: { label: "Find another practitioner", href: "/directory" },
      reason: "You receive this because you sent an enquiry through the Trichollective directory.",
    },
  };
}

export function enquiryHeldPractitionerEmail(l: { name: string; slug: string | null }): Email {
  return {
    subject: "Someone has contacted you through the Trichollective directory",
    content: {
      preheader: "Their message is waiting for you, and you can read it when you join Professional.",
      eyebrow: "Enquiry waiting",
      heading: "Someone has contacted you through your Trichollective directory listing.",
      body: [
        `Hello ${firstNameOf(l.name)},`,
        "A member of the public found you in the directory and sent you a message. We are holding it safely for you.",
        `Your free ${FREE_LISTING_DAYS}-day full profile has ended, so enquiries now wait until you join the Professional plan. As soon as you do, this message and any others will be delivered to you with their contact details, ready for you to reply and book a consultation.`,
        "We never share an enquiry with anyone else, and we do not pass on the person's details until you join, to keep things private for everyone.",
        "Professional also gives you your full profile back, the Case Room, the referral network and a CPD log that records your learning.",
      ].join("\n\n"),
      cta: { label: "Join Professional to read it", href: l.slug ? `/directory/claim/${l.slug}` : "/pricing" },
      secondary: { label: "Compare plans", href: "/pricing" },
      reason: "You receive this because someone contacted you through your Trichollective directory listing.",
    },
  };
}

/* ------------------------------------------------------------------ */
/* Samples for the Studio                                               */
/* ------------------------------------------------------------------ */

const sampleListing = {
  name: "Niamh Byrne",
  email: "niamh@byrnetrichology.ie",
  profession: "clinical",
  city: "Galway",
  country: "Ireland",
};
const sampleEnquiry = {
  practitionerName: "Niamh Byrne",
  enquirerName: "Sarah Walsh",
  enquirerEmail: "sarah.walsh@example.com",
  message:
    "Hello Niamh, I have noticed a lot more shedding over the last three months, mostly when I wash my hair, and my parting looks wider. Do you offer consultations with a scalp examination, and how soon could I book one?",
};

function sample(id: string, name: string, trigger: string, audience: EmailSample["audience"], e: Email): EmailSample {
  return { id, name, trigger, audience, subject: e.subject, content: e.content };
}

function ownerSample(id: string, name: string, trigger: string, a: OwnerAlert): EmailSample {
  return { id, name, trigger, audience: "owners", subject: `[Trichollective] ${a.subject}`, content: ownerAlertContent(a) };
}

export const samples: EmailSample[] = [
  sample(
    "listing-received",
    "Listing received",
    "Sent when someone submits a free directory listing.",
    "practitioners",
    listingReceivedEmail(sampleListing)
  ),
  ownerSample(
    "alert-new-listing",
    "New listing to review",
    "Sent to the owners when a listing is waiting to be checked.",
    newListingAlert({ ...sampleListing, source: "instagram", via: "the public listing form" })
  ),
  sample(
    "listing-approved",
    "Listing approved",
    "Sent when a listing is approved in the Studio.",
    "practitioners",
    listingApprovedEmail({ name: sampleListing.name, slug: "niamh-byrne-galway", freeUntil: new Date("2027-01-03T12:00:00Z") })
  ),
  sample(
    "listing-not-approved",
    "Listing not approved",
    "Sent when a listing is rejected in the Studio.",
    "practitioners",
    listingNotApprovedEmail(sampleListing)
  ),
  sample(
    "studio-access",
    "Studio access",
    "Sent when an owner gives someone Studio access.",
    "members",
    studioAccessEmail({ name: "Aoife Kelly" })
  ),
  sample(
    "enquiry-to-practitioner",
    "New enquiry",
    "Sent to a practitioner with a full profile when someone contacts them through the directory.",
    "practitioners",
    enquiryToPractitionerEmail(sampleEnquiry)
  ),
  sample(
    "enquiry-sent",
    "Enquiry passed on",
    "Sent to the person who made an enquiry once it has been delivered.",
    "public",
    enquirySentEmail(sampleEnquiry)
  ),
  sample(
    "enquiry-held-receipt",
    "Enquiry held",
    "Sent to the person who made an enquiry when the practitioner's full profile has ended.",
    "public",
    enquiryHeldReceiptEmail(sampleEnquiry)
  ),
  sample(
    "enquiry-held-practitioner",
    "Enquiry waiting",
    "Sent to a practitioner whose full profile has ended when someone contacts them.",
    "practitioners",
    enquiryHeldPractitionerEmail({ name: sampleListing.name, slug: "niamh-byrne-galway" })
  ),
];
