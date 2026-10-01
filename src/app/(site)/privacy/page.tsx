import Link from "next/link";
import { LegalPage } from "@/components/editorial/LegalPage";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { FREE_LISTING_DAYS } from "@/config/subscriptions";

export const metadata = pageMetadata({
  title: "Privacy notice",
  description: `How ${site.name} collects, uses and protects personal data for members, directory listings, newsletter subscribers and visitors, and the rights you have under GDPR.`,
  path: "/privacy",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Privacy", path: "/privacy" },
];

const UPDATED = "30 September 2026";

export default function PrivacyPage() {
  const email = site.contactEmail;
  const mail = <a href={`mailto:${email}`}>{email}</a>;

  const sections = [
    {
      id: "who-we-are",
      heading: "Who we are",
      body: (
        <>
          <p>
            {site.name} is a membership community for cosmetic, clinical and medical hair and scalp
            professionals in Ireland and the United Kingdom. In this notice, &ldquo;we&rdquo;,
            &ldquo;us&rdquo; and &ldquo;our&rdquo; mean {site.name}.
          </p>
          <p>
            We are the data controller for the personal data described here. [Legal entity name,
            company number and registered address to be added.] You can contact us about anything in
            this notice at {mail}.
          </p>
        </>
      ),
    },
    {
      id: "what-we-collect",
      heading: "What we collect",
      body: (
        <>
          <p>We only collect what we need to run the service. Depending on how you use it, this may include:</p>
          <ul>
            <li>
              <strong>Account details:</strong> your name, email address, password (stored only in
              hashed form) and your chosen local chapter.
            </li>
            <li>
              <strong>Directory listings:</strong> the professional details you choose to publish, such
              as your name, discipline, city, services, website, phone number, photograph and a short
              biography.
            </li>
            <li>
              <strong>Membership and payments:</strong> your plan, billing history and the status of
              your subscription. Card details are handled by Stripe and never reach our servers.
            </li>
            <li>
              <strong>Community activity:</strong> posts, comments, messages, event bookings and course
              progress, including any certificates you earn.
            </li>
            <li>
              <strong>Newsletter sign-ups:</strong> your email address, where you signed up and, if
              present, the campaign that brought you to the site.
            </li>
            <li>
              <strong>Enquiries:</strong> messages sent to professionals through the directory, and any
              email you send us.
            </li>
            <li>
              <strong>Technical data:</strong> basic information needed to keep the site secure and
              working, such as your IP address, browser type and the pages you request.
            </li>
          </ul>
          <p>
            Please don&apos;t share health information about yourself or your clients in the community
            or in directory enquiries. Case discussions must always be anonymised (see our{" "}
            <Link href="/terms#community-standards">community standards</Link>).
          </p>
        </>
      ),
    },
    {
      id: "how-we-use-it",
      heading: "How we use it, and our lawful basis",
      body: (
        <>
          <p>Under the GDPR and the UK GDPR, we must have a lawful basis for each use of your data.</p>
          <ul>
            <li>
              <strong>To provide your membership</strong>, publish your listing, run courses, issue
              certificates and take payment. Basis: performance of our contract with you.
            </li>
            <li>
              <strong>To send the newsletter</strong> and news of events and courses. Basis: your
              consent, which you can withdraw at any time using the link in every email.
            </li>
            <li>
              <strong>To send service messages</strong>, such as receipts, renewal reminders and
              notice that a free listing is about to lapse. Basis: performance of our contract, and our
              legitimate interest in running the service well.
            </li>
            <li>
              <strong>To keep the community safe</strong>, review listings before they go live,
              prevent fraud and enforce our terms. Basis: our legitimate interests.
            </li>
            <li>
              <strong>To meet our legal obligations</strong>, such as keeping financial records. Basis:
              legal obligation.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "directory",
      heading: "The public directory",
      body: (
        <>
          <p>
            The directory is public by design. Whatever you choose to include in your listing can be
            seen by anyone, and may be indexed by search engines. Every listing is reviewed by a person
            before it goes live.
          </p>
          <p>
            Free founding listings are shown for {FREE_LISTING_DAYS} days. If you don&apos;t become a
            member in that time, your listing stops being shown publicly. We keep the details for a
            further 12 months so you can reactivate easily, unless you ask us to delete them sooner.
          </p>
        </>
      ),
    },
    {
      id: "ai",
      heading: "How we use AI tools",
      body: (
        <>
          <p>
            We use AI tools to help draft editorial content such as Trichozette, guides and course
            material. A person reviews and approves everything before it is published.
          </p>
          <p>
            We do not use AI to make decisions about you that have legal or similarly significant
            effects, and we do not sell your data or use it to train third-party AI models.
          </p>
        </>
      ),
    },
    {
      id: "sharing",
      heading: "Who we share it with",
      body: (
        <>
          <p>
            We never sell personal data. We share it only with service providers who help us run
            {" "}{site.name}, under contracts that require them to protect it:
          </p>
          <ul>
            <li>
              <strong>Stripe</strong>, for payments and subscription billing.
            </li>
            <li>
              <strong>Our hosting and database providers</strong>, which store and serve the site.
            </li>
            <li>
              <strong>Our email provider</strong>, which delivers account emails and the newsletter.
            </li>
            <li>
              <strong>AI service providers</strong>, which process content we send them to help with
              drafting. We avoid sending them personal data wherever we can.
            </li>
          </ul>
          <p>
            [A full list of processors and their locations to be added.] We may also disclose data
            where the law requires it.
          </p>
        </>
      ),
    },
    {
      id: "transfers",
      heading: "International transfers",
      body: (
        <p>
          Some of our providers may process data outside Ireland, the European Economic Area or the
          United Kingdom. When that happens, we rely on an adequacy decision or on standard contractual
          clauses, with additional safeguards where needed.
        </p>
      ),
    },
    {
      id: "retention",
      heading: "How long we keep it",
      body: (
        <ul>
          <li>Account and membership data: for as long as you are a member, then up to two years.</li>
          <li>Payment and invoice records: for as long as tax law requires, normally six years.</li>
          <li>Newsletter data: until you unsubscribe.</li>
          <li>
            Certificates: we keep a record of each certificate so it can still be verified, unless you
            ask us to withdraw it.
          </li>
          <li>Technical logs: for a short period, normally no more than 90 days.</li>
        </ul>
      ),
    },
    {
      id: "rights",
      heading: "Your rights",
      body: (
        <>
          <p>You have the right to:</p>
          <ul>
            <li>ask for a copy of the personal data we hold about you;</li>
            <li>ask us to correct anything that is wrong;</li>
            <li>ask us to delete your data;</li>
            <li>object to, or ask us to restrict, how we use it;</li>
            <li>receive your data in a portable format;</li>
            <li>withdraw your consent at any time, where we rely on it.</li>
          </ul>
          <p>
            To use any of these rights, email {mail}. We&apos;ll reply within one month. If you are
            unhappy with how we have handled your data, you can complain to the Data Protection
            Commission in Ireland or, in the UK, to the Information Commissioner&apos;s Office. We&apos;d
            be grateful for the chance to put things right first.
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      heading: "Cookies",
      body: (
        <p>
          We use a small number of essential cookies to keep you signed in and to keep the site secure.
          We don&apos;t use advertising cookies. If we ever add analytics that need your consent, we
          will ask first and update this notice.
        </p>
      ),
    },
    {
      id: "security",
      heading: "Keeping your data safe",
      body: (
        <p>
          We use encryption in transit, restrict access to the people who need it, and review our
          providers&apos; security. No system is perfectly secure, so if something does go wrong we
          will tell you and the relevant authority as the law requires.
        </p>
      ),
    },
    {
      id: "changes",
      heading: "Changes to this notice",
      body: (
        <p>
          We&apos;ll update this notice when our practices change, and we&apos;ll tell members by email
          about any significant change before it takes effect.
        </p>
      ),
    },
  ];

  return (
    <>
      <LegalPage
        eyebrow="Privacy"
        title="Privacy notice"
        intro={
          <p>
            This notice explains what personal data we collect, why we collect it, who we share it with
            and the choices you have. We have tried to write it plainly.
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
