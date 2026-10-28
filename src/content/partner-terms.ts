import { site } from "@/config/site";

/**
 * The Premium partner terms a brand accepts on its onboarding link. Kept as plain text so the same
 * words are shown on the page, published at /terms/partners and saved with each acceptance.
 * Change PARTNER_TERMS_VERSION whenever the wording changes, so every acceptance says what it agreed to.
 */
export const PARTNER_TERMS_VERSION = "2026-10-09";
export const PARTNER_TERMS_UPDATED = "9 October 2026";

export type PartnerTermsSection = { id: string; heading: string; paragraphs: string[] };

export const partnerTerms: PartnerTermsSection[] = [
  {
    id: "agreement",
    heading: "The agreement",
    paragraphs: [
      `These terms are an agreement between ${site.company.name}, a company registered in ${site.company.registeredIn} with number ${site.company.number}, of ${site.company.address} ("${site.name}", "we") and the business named in your offer ("you"). Your agreement is made up of your offer, these partner terms and our general terms of business at ${site.url}/terms.`,
      "If they ever disagree, your offer comes first, then these partner terms, then the general terms of business.",
      "The person who accepts confirms that they are authorised to agree on behalf of the business.",
    ],
  },
  {
    id: "term",
    heading: "How long it lasts",
    paragraphs: [
      "Your partnership starts on the date of your first payment and runs for one year, unless your offer says it is billed monthly.",
      "It renews automatically at the end of each year until either of us ends it as set out below.",
    ],
  },
  {
    id: "fees",
    heading: "Fees and payment",
    paragraphs: [
      "You pay the price in your offer in advance for each period, by card or bank payment through Stripe. Prices include VAT where it applies.",
      "Where your offer says the price is fixed, it stays at that price at every renewal for as long as your partnership continues without a break. If it ends and you later return, the price then on offer applies.",
      "Payments are non-refundable, including for any benefit you choose not to use. This is a business-to-business agreement, so the consumer right to cancel within 14 days does not apply.",
      "If a payment fails, we will tell you and give you 14 days to put it right before your benefits are paused.",
    ],
  },
  {
    id: "ending",
    heading: "Ending the partnership",
    paragraphs: [
      "You can stop your partnership renewing at any time by writing to us or from the billing page in your account. Your benefits continue until the end of the period you have paid for.",
      "Either of us can end the partnership straight away by writing to the other if the other seriously breaks these terms and does not put it right within 14 days of being asked to.",
      "When the partnership ends, your Premium badge, partner page features and perk come down. Masterclasses and articles already published stay in the member library and the Trichozette archive with their partner label.",
    ],
  },
  {
    id: "what-we-provide",
    heading: "What we provide",
    paragraphs: [
      "We provide the benefits listed in your offer during each period you have paid for. We agree dates for masterclasses, articles, spotlights and conference slots with you in advance.",
      "Benefits are given within the period they belong to. A monthly benefit you do not use in its month, or a yearly benefit not used by the end of the year, does not roll over, unless we were the reason it was missed.",
      "If we cannot provide a benefit, for example because a conference is cancelled or moved, we will offer you a fair equivalent of the same value.",
      "Business membership benefits, including your business page, five Professional seats and job posts, follow the general terms of business.",
    ],
  },
  {
    id: "editorial",
    heading: "Sponsored content and editorial standards",
    paragraphs: [
      "Everything you sponsor or contribute is clearly labelled as sponsored or as a partner feature.",
      "Masterclasses must teach rather than sell. We review each one before it is published, and we may ask for changes to meet that standard.",
      "Content must not make clinical or medical claims, must not diagnose, and must comply with the advertising rules that apply to your products. You never post in the clinical spaces of the community.",
      "We keep final editorial control of Trichozette, the member library, our newsletters and our events. We may edit for length, clarity and house style, and we may decline anything that is misleading or unsuitable for the community.",
      "Please send copy and materials by the deadlines we agree with you. Trichozette features are due at least seven days before the edition is published, or the feature moves to the next edition.",
    ],
  },
  {
    id: "courses",
    heading: "Co-developed courses",
    paragraphs: [
      "Any course you co-develop with us is subject to our clinical review before it is published.",
      "Ownership, revenue share and certification for each course are agreed in writing before work begins.",
    ],
  },
  {
    id: "perks-and-trials",
    heading: "Member perks and product trials",
    paragraphs: [
      "You must honour any perk you offer members exactly as it is described, for as long as it is shown.",
      "Members choose whether to join a product trial panel. We share their structured feedback with you, and we only share a member's name or contact details when that member has agreed to it.",
      "Engagement reports show combined figures. They never include personal data about individual members.",
      "You must not use anything you learn through the partnership to market to members without their consent.",
    ],
  },
  {
    id: "your-content",
    heading: "Your content and brand",
    paragraphs: [
      "You keep ownership of your content, logos and trademarks. You give us permission to use them to provide your benefits, to show your partner page, and to name you as a partner of Trichollective in our materials and at our events.",
      "That permission continues after the partnership ends for content already published, such as masterclasses in the member library and articles in the Trichozette archive.",
      "You confirm that you have the rights to everything you give us, and that it is accurate and lawful.",
    ],
  },
  {
    id: "compliance",
    heading: "Your products and compliance",
    paragraphs: [
      "You are responsible for your own products and services, and for making sure they and your claims about them meet the law and the regulations that apply to them.",
      "Being a partner is not an endorsement by Trichollective of your products or services, and you must not suggest that it is.",
    ],
  },
  {
    id: "confidentiality",
    heading: "Confidentiality and data protection",
    paragraphs: [
      "Each of us keeps confidential anything the other shares privately under this agreement, including engagement reports and plans not yet announced.",
      "Each of us looks after any personal data it handles in line with data protection law. Our privacy notice explains how we handle members' data.",
    ],
  },
  {
    id: "liability",
    heading: "Responsibility",
    paragraphs: [
      "Neither of us is responsible to the other for loss of profit, revenue, business or opportunity, or for any loss that was not foreseeable.",
      "Our total responsibility to you in any year of the partnership is limited to the fees you paid for that year.",
      "Nothing in these terms limits liability that cannot be limited by law, including for death or personal injury caused by negligence, or for fraud.",
    ],
  },
  {
    id: "general",
    heading: "General",
    paragraphs: [
      "This agreement is the whole agreement between us about the partnership. Any change must be agreed in writing, and email is enough.",
      "We may update these partner terms for future periods by telling you at least 30 days before your next renewal. Your price and your listed benefits stay as agreed unless you agree otherwise.",
      "These terms are governed by the laws of England and Wales, and the courts of England and Wales have exclusive jurisdiction over any dispute.",
    ],
  },
];

/** The whole text, for the copy we email and the record we keep. */
export function partnerTermsText() {
  return partnerTerms.map((s, i) => `${i + 1}. ${s.heading}\n\n${s.paragraphs.join("\n\n")}`).join("\n\n");
}
