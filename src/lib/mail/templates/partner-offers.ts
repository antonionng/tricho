import type { EmailContent } from "../layout";
import type { OwnerAlert } from "../send";
import { firstNameOf } from "./directory";

/** Emails sent when a brand accepts its Premium Business onboarding link. */

type Email = { subject: string; content: EmailContent };

type AcceptedFacts = {
  businessName: string;
  legalName: string;
  signerName: string;
  signerRole: string;
  accountEmail: string;
  price: string;
  priceNote: string;
  inclusions: string[];
  specialTerms: string | null;
  termsVersion: string;
  acceptedAt: string;
  offerPath: string;
  paid: boolean;
};

/** The brand's copy of what they agreed to, and how to set up their page. */
export function partnerAgreementEmail(f: AcceptedFacts): Email {
  return {
    subject: `Your Trichollective Premium partnership for ${f.businessName}`,
    content: {
      preheader: f.paid ? "A copy of your agreement, and how to sign in and set up your partner page." : "A copy of your agreement, and how to complete your payment.",
      eyebrow: "Premium Business",
      heading: f.paid ? `${f.businessName} is now a Premium partner of Trichollective.` : `Thank you for signing, ${f.businessName}.`,
      body: [
        `Hello ${firstNameOf(f.signerName)},`,
        `Thank you for signing the Premium partner agreement on behalf of ${f.legalName}. This email confirms what we agreed, and your countersigned copy is ready to download as a PDF.`,
        "## Your agreement",
        [
          `- Price: ${f.price}. ${f.priceNote}`,
          `- Signed by ${f.signerName}, ${f.signerRole}, on ${f.acceptedAt}, and countersigned by Trichollective`,
          `- Partner terms version ${f.termsVersion}, published at /terms/partners`,
        ].join("\n"),
        "## What is included",
        f.inclusions.map((i) => `- ${i}`).join("\n"),
        ...(f.specialTerms ? ["## Also agreed", f.specialTerms] : []),
        "## Your next step",
        f.paid
          ? `Sign in with ${f.accountEmail} to add your logo, story, photos and team to your partner page. We will be in touch to schedule your first masterclass and your Trichozette feature.`
          : "Complete your payment on your agreement page, by card or by invoice. Your partner page, Premium badge and team seats open as soon as your payment is received.",
      ].join("\n\n"),
      cta: f.paid ? { label: "Set up your partner page", href: "/login?next=/members/business/setup" } : { label: "Complete your payment", href: `${f.offerPath}#payment` },
      secondary: { label: "Download your signed agreement (PDF)", href: `${f.offerPath}/contract` },
    },
  };
}

export function partnerAcceptedAlert(f: AcceptedFacts & { companyNumber: string | null; address: string }): OwnerAlert {
  return {
    subject: `${f.businessName} signed their Premium partner agreement`,
    heading: `${f.signerName} signed the Premium partner agreement for ${f.businessName}.`,
    body: f.paid
      ? "Their payment has been received and their partner page is open for them to set up."
      : "They can now pay by card or ask for an invoice on the same page. Their partner page opens when the payment is received.",
    facts: [
      ["Business", f.businessName],
      ["Registered name", f.legalName],
      ...(f.companyNumber ? ([["Company number", f.companyNumber]] as [string, string][]) : []),
      ["Address", f.address],
      ["Signed by", `${f.signerName}, ${f.signerRole}`],
      ["Signs in with", f.accountEmail],
      ["Price", f.price],
      ["Terms version", f.termsVersion],
      ["Accepted", f.acceptedAt],
    ],
    cta: { label: "View offers", href: "/studio/partners/offers" },
    replyTo: f.accountEmail,
  };
}

type PaidFacts = {
  businessName: string;
  signerName: string | null;
  accountEmail: string;
  price: string;
  method: "card" | "invoice";
  firstFeature: string | null;
  firstMasterclass: string | null;
};

/** Payment received: the page is open, and how to sign in and set it up. */
export function partnerLiveEmail(f: PaidFacts): Email {
  return {
    subject: `Welcome to Trichollective, ${f.businessName}: your partner page is open`,
    content: {
      preheader: "Your payment has been received. Sign in to set up your partner page and your team.",
      eyebrow: "Premium Business",
      heading: `Welcome to the collective, ${f.businessName}.`,
      body: [
        `Hello ${firstNameOf(f.signerName)},`,
        `Your payment of ${f.price} has been received, and Stripe has emailed you a receipt. Your Premium partner page, badge and team seats are now open.`,
        "## Your first steps",
        [
          `- Sign in with ${f.accountEmail}. We email you a link, so there is no password to remember`,
          "- Add your logo, story, products, photos and video to your partner page",
          "- Give five of your team their Professional seats, and add a member perk",
        ].join("\n"),
        ...(f.firstFeature || f.firstMasterclass
          ? ["## Your first month", [f.firstFeature && `- ${f.firstFeature}`, f.firstMasterclass && `- Your first masterclass: ${f.firstMasterclass}`].filter(Boolean).join("\n")]
          : []),
        "If you have any questions, simply reply to this email.",
      ].join("\n\n"),
      cta: { label: "Set up your partner page", href: "/login?next=/members/business/setup" },
    },
  };
}

export function partnerPaidAlert(f: PaidFacts): OwnerAlert {
  return {
    subject: `${f.businessName} has paid: their Premium partner page is open`,
    heading: `${f.businessName} has paid ${f.price} and their Premium partner page is open.`,
    body: "They have been emailed how to sign in and set up their page. Their CRM record is now a customer.",
    facts: [
      ["Business", f.businessName],
      ["Paid by", f.method === "invoice" ? "Invoice" : "Card"],
      ["Amount", f.price],
      ["Signs in with", f.accountEmail],
    ],
    cta: { label: "View offers", href: "/studio/partners/offers" },
    replyTo: f.accountEmail,
  };
}
