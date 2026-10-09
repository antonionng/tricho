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
      preheader: "A copy of your agreement, and how to sign in and set up your partner page.",
      eyebrow: "Premium Business",
      heading: `${f.businessName} is now a Premium partner of Trichollective.`,
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
        `Sign in with ${f.accountEmail} to add your logo, story, photos and team to your partner page. We will be in touch to schedule your first masterclass and your Trichozette feature.`,
        ...(f.paid ? [] : ["If you have not paid yet, you can pay by card or ask for an invoice from your agreement page."]),
      ].join("\n\n"),
      cta: { label: "Set up your partner page", href: "/login?next=/members/business/setup" },
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
      : "Their partner page is open for them to set up. They can now pay by card or ask for an invoice on the same page.",
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
