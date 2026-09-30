import Link from "next/link";
import { LegalPage } from "@/components/editorial/LegalPage";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { FREE_LISTING_DAYS } from "@/config/subscriptions";

export const metadata = pageMetadata({
  title: "Terms of membership",
  description: `The terms for joining and using ${site.name}: membership and payment, cancellation and refunds, the free founding listing, community standards and courses.`,
  path: "/terms",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Terms", path: "/terms" },
];

const UPDATED = "30 September 2026";

export default function TermsPage() {
  const mail = <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>;

  const sections = [
    {
      id: "about",
      heading: "About these terms",
      body: (
        <>
          <p>
            These terms apply when you use the {site.name} website, list yourself in the directory or
            become a member. By creating an account or paying for membership, you agree to them.
          </p>
          <p>
            {site.name} is operated by [legal entity name, company number and registered address to be
            added]. You can reach us at {mail}. Our <Link href="/privacy">privacy notice</Link>{" "}
            explains how we handle personal data.
          </p>
        </>
      ),
    },
    {
      id: "who-can-join",
      heading: "Who can join",
      body: (
        <>
          <p>
            Membership is for people who work, or are training to work, in cosmetic, clinical or
            medical hair and scalp care, and for businesses serving them. You must be at least 18.
          </p>
          <p>
            We may ask for reasonable evidence of your professional background, and we may decline an
            application or listing that doesn&apos;t fit the community. If we do, we&apos;ll refund
            anything you have paid.
          </p>
        </>
      ),
    },
    {
      id: "membership-and-payment",
      heading: "Membership and payment",
      body: (
        <>
          <p>
            Membership is a subscription, billed monthly or yearly in advance, at the price shown on
            our <Link href="/pricing">pricing page</Link> when you join. Payments are processed by
            Stripe. We never see or store your full card details.
          </p>
          <p>
            Your subscription renews automatically until you cancel. If a payment fails, we&apos;ll let
            you know and give you time to update your card before membership features are paused.
          </p>
          <p>
            Founding members keep their founding price for as long as their membership continues
            without a break. If we change prices for anyone else, we&apos;ll give you at least 30
            days&apos; notice by email before the change applies to you.
          </p>
        </>
      ),
    },
    {
      id: "cancellation",
      heading: "Cancellation and refunds",
      body: (
        <>
          <p>
            You can cancel at any time from your account settings. Your membership stays active until
            the end of the period you have paid for, and you won&apos;t be charged again.
          </p>
          <p>
            <strong>14-day refund.</strong> If you cancel within 14 days of first becoming a paying
            member, we will refund your first payment in full, whatever the reason. After that,
            payments are not refundable for part-used periods, except where the law says otherwise.
          </p>
          <p>
            Courses bought separately can be refunded within 14 days of purchase, provided you have
            not completed the course or received its certificate.
          </p>
          <p>
            Nothing in these terms affects your statutory rights as a consumer in Ireland or the United
            Kingdom.
          </p>
        </>
      ),
    },
    {
      id: "founding-listing",
      heading: "The free founding listing",
      body: (
        <>
          <p>
            During the founding period, professionals can add a listing to the public directory free of
            charge for {FREE_LISTING_DAYS} days from the date it is approved. No payment details are
            needed.
          </p>
          <p>
            When the {FREE_LISTING_DAYS} days end, the listing stops being shown publicly unless you
            have become a member. We&apos;ll remind you by email before that happens. You can remove
            your listing at any time.
          </p>
          <p>
            Every listing is reviewed by a person before it goes live. You are responsible for making
            sure your listing is accurate, that you hold any qualifications, registrations and
            insurance it mentions, and that you have the right to use any photograph you upload.
          </p>
        </>
      ),
    },
    {
      id: "community-standards",
      heading: "Community standards",
      body: (
        <>
          <p>
            {site.name} works because members trust each other. When you take part in the community,
            events or the directory, please:
          </p>
          <ul>
            <li>be kind and respectful, especially to colleagues from other disciplines;</li>
            <li>
              never share information that could identify a client. Remove names, faces and other
              details from any case you discuss, and have the client&apos;s permission to share it;
            </li>
            <li>stay within the scope of your own training and professional rules;</li>
            <li>be honest about your qualifications and experience;</li>
            <li>
              declare any commercial interest when you recommend a product, service or business;
            </li>
            <li>
              not use member details, messages or the directory for unsolicited marketing;
            </li>
            <li>not post anything unlawful, misleading, discriminatory or harassing.</li>
          </ul>
          <p>
            If someone breaks these standards, we may remove content, pause access or end their
            membership. Where we end a membership for a serious breach, we won&apos;t refund the
            current period. You can report a concern at any time by writing to {mail}.
          </p>
        </>
      ),
    },
    {
      id: "no-medical-advice",
      heading: "No medical advice",
      body: (
        <>
          <p>
            Everything on {site.name}, including Trichozette, the Journal, guides, the podcast,
            courses, masterclasses and community discussions, is for general information and
            professional education. It is not medical advice, and it is not a substitute for an
            examination by a qualified practitioner.
          </p>
          <p>
            If you are worried about your hair, scalp or general health, please speak to your GP or
            another suitably qualified professional. In an emergency, contact your local emergency
            services.
          </p>
          <p>
            Professionals remain responsible for their own clinical and professional judgement, and
            for the care they provide to their clients.
          </p>
        </>
      ),
    },
    {
      id: "directory",
      heading: "Using the directory",
      body: (
        <p>
          The directory helps the public find professionals, but we don&apos;t employ, supervise or
          endorse the people listed in it. A listing, or a &ldquo;verified&rdquo; badge, is not a
          recommendation. Anyone choosing a practitioner should check that they are suitable for their
          needs.
        </p>
      ),
    },
    {
      id: "courses",
      heading: "Courses and certificates",
      body: (
        <>
          <p>
            Our courses lead to a certificate of completion. It is not an accredited qualification and
            does not license you to offer any treatment. Where a course carries CPD accreditation, the
            course page will say so.
          </p>
          <p>
            Each certificate has a public web address so others can check it. We may withdraw a
            certificate issued in error or obtained dishonestly, and the public page will then say so.
            Read more about <Link href="/certification">how certificates work</Link>.
          </p>
        </>
      ),
    },
    {
      id: "your-content",
      heading: "Your content and ours",
      body: (
        <>
          <p>
            You keep ownership of what you post. You give us permission to host and display it within
            {" "}{site.name} so the service can work, and, for your public listing, to show it to
            anyone. If you are invited to contribute to Trichozette or the Journal, we will agree the
            terms with you separately.
          </p>
          <p>
            Trichozette, courses, recordings and other material we publish belong to us or our
            contributors. Please don&apos;t copy or share members-only material outside the
            community.
          </p>
        </>
      ),
    },
    {
      id: "liability",
      heading: "Our responsibility to you",
      body: (
        <p>
          We will provide the service with reasonable care and skill. We are not responsible for losses
          that were not foreseeable, for the actions of other members or listed professionals, or for
          interruptions outside our reasonable control. Nothing in these terms limits liability that
          cannot be limited by law, including for death or personal injury caused by negligence.
        </p>
      ),
    },
    {
      id: "changes",
      heading: "Changes and governing law",
      body: (
        <>
          <p>
            We may update these terms as the service develops. We&apos;ll tell members about any
            significant change by email at least 30 days before it takes effect, and you can cancel
            before then if you don&apos;t agree.
          </p>
          <p>
            These terms are governed by the laws of Ireland. If you live in the United Kingdom, you
            also keep the protection of the mandatory laws of the part of the UK where you live, and
            you can bring a claim in your local courts.
          </p>
        </>
      ),
    },
  ];

  return (
    <>
      <LegalPage
        eyebrow="Terms"
        title="Terms of membership"
        intro={
          <p>
            The agreement between you and {site.name}, written as plainly as we can. If anything is
            unclear, please ask us before you join.
          </p>
        }
        updated={UPDATED}
        crumbs={crumbs}
        sections={sections}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
    </>
  );
}
