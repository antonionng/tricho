import Link from "next/link";
import { LegalPage } from "@/components/editorial/LegalPage";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { FREE_LISTING_DAYS } from "@/config/subscriptions";
import { LEGAL_UPDATED } from "@/lib/legal";

export const metadata = pageMetadata({
  title: "Privacy notice",
  description: `How ${site.name} collects, uses and protects personal data for members, businesses, directory listings, event guests, newsletter subscribers and visitors, and the rights you have under the GDPR and UK GDPR.`,
  path: "/privacy",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Privacy", path: "/privacy" },
];

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
            {site.company.name} (company number {site.company.number}, {site.company.address}) is the data controller for the personal data described here. You can
            contact us about anything in this notice, including your rights, at {mail}.
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
              <strong>Account details:</strong> your name, email address, local chapter and, if you sign
              in with Google, the basic profile details Google shares with us.
            </li>
            <li>
              <strong>Directory listings and profiles:</strong> the professional details you choose to
              publish, such as your name, discipline, city, services, website, phone number, photograph
              and a short biography.
            </li>
            <li>
              <strong>Verification documents:</strong> certificates, diplomas or membership documents you
              send so we can check your qualifications. These are private and only seen by the team
              members who review them.
            </li>
            <li>
              <strong>Payments:</strong> your plan, billing address, billing history and the status of
              your subscription or tickets. Card details are handled by Stripe and never reach our
              servers.
            </li>
            <li>
              <strong>Business details:</strong> for business plans and partner pages, the business
              name, category, website, logo, contact details and the results of offers you run.
            </li>
            <li>
              <strong>Community activity:</strong> posts, comments, messages, client referrals, event
              bookings, course progress and any certificates you earn.
            </li>
            <li>
              <strong>Assistant questions:</strong> the questions you ask the Assistant, which are used
              only to answer them.
            </li>
            <li>
              <strong>Event guests:</strong> the name and email address of people who buy a ticket
              without an account.
            </li>
            <li>
              <strong>Newsletter sign-ups and invitations:</strong> your email address, where you signed
              up, the campaign that brought you to the site and, if a colleague invited you, whose code
              you used.
            </li>
            <li>
              <strong>Enquiries:</strong> messages sent to professionals through the directory, and any
              email you send us.
            </li>
            <li>
              <strong>Technical data:</strong> information needed to keep the site secure and working,
              such as your IP address, browser type and the pages you request.
            </li>
          </ul>
          <p>
            Please don&apos;t share health information about yourself or your clients in the community,
            in referrals, in the Assistant or in directory enquiries. Case discussions must always be
            anonymised (see our <Link href="/terms#community-standards">community standards</Link>). We
            don&apos;t intend to collect special category data, and we delete it if we find it.
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
              <strong>To provide your account and membership</strong>, publish your listing or partner
              page, run courses and events, issue certificates and take payment. Basis: performance of
              our contract with you.
            </li>
            <li>
              <strong>To verify qualifications</strong> and show a verified badge. Basis: our legitimate
              interest, shared with the public, in a directory people can trust.
            </li>
            <li>
              <strong>To send the newsletter</strong> and news of events and courses. Basis: your
              consent, which you can withdraw at any time using the link in every email. Where you are
              already a member, we may send news of similar services under our legitimate interests, and
              you can opt out at any time.
            </li>
            <li>
              <strong>To send service messages</strong>, such as sign-in links, receipts, renewal
              reminders and notice that a free listing is about to lapse. Basis: performance of our
              contract, and our legitimate interest in running the service well.
            </li>
            <li>
              <strong>To understand what brings people to the site</strong>, such as which event or
              campaign led to a sign-up, and to give referral rewards. Basis: our legitimate interests.
            </li>
            <li>
              <strong>To keep the community safe</strong>, review listings and posts before or after they
              go live, prevent fraud and enforce our terms. Basis: our legitimate interests.
            </li>
            <li>
              <strong>To meet our legal obligations</strong>, such as keeping tax and financial records.
              Basis: legal obligation.
            </li>
          </ul>
          <p>
            Where we rely on legitimate interests, we have weighed them against your rights, and you can
            object at any time.
          </p>
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
            material, to transcribe podcast episodes, and to help moderate community posts. A person
            reviews and approves editorial content before it is published.
          </p>
          <p>
            When you use the Assistant, your questions are sent to our AI provider to generate an
            answer. Our providers don&apos;t use this data to train their models.
          </p>
          <p>
            We do not use AI to make decisions about you that have legal or similarly significant
            effects, and we never sell your data.
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
              <strong>Stripe</strong>, for payments, subscriptions and invoices.
            </li>
            <li>
              <strong>Vercel</strong>, which hosts the website and routes requests to our AI providers.
            </li>
            <li>
              <strong>Supabase</strong>, which hosts our database and stores uploaded files.
            </li>
            <li>
              <strong>Resend</strong>, which delivers sign-in emails, service messages and the
              newsletter.
            </li>
            <li>
              <strong>Google</strong>, if you choose to sign in with your Google account.
            </li>
            <li>
              <strong>Anthropic</strong> and other AI providers, for the Assistant, moderation and
              drafting.
            </li>
            <li>
              <strong>AssemblyAI</strong>, which transcribes podcast recordings.
            </li>
            <li>
              <strong>Eventbrite</strong>, for tickets to some events sold through them.
            </li>
          </ul>
          <p>
            Other members see what you share in the community and your member profile. Partners see
            aggregated results of their offers, and only see your details if you contact them. We may
            also disclose data to our professional advisers, or where the law requires it.
          </p>
        </>
      ),
    },
    {
      id: "transfers",
      heading: "International transfers",
      body: (
        <p>
          Some of our providers process data outside Ireland, the European Economic Area or the United
          Kingdom, mainly in the United States. When that happens, we rely on an adequacy decision, such
          as the EU-US Data Privacy Framework and the UK extension to it, or on standard contractual
          clauses, with additional safeguards where needed. You can ask us for a copy of the safeguards
          that apply.
        </p>
      ),
    },
    {
      id: "retention",
      heading: "How long we keep it",
      body: (
        <ul>
          <li>Account and membership data: for as long as you have an account, then up to two years.</li>
          <li>Payment and invoice records: for as long as tax law requires, normally six years.</li>
          <li>
            Verification documents: until they have been reviewed and for as long as your badge is
            shown, unless you withdraw them sooner.
          </li>
          <li>Newsletter data: until you unsubscribe.</li>
          <li>
            Assistant conversations: we don&apos;t save them. They are sent to our AI provider to produce an
            answer and are gone when you leave the page.
          </li>
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
          <p>Under the GDPR and the UK GDPR, you have the right to:</p>
          <ul>
            <li>ask for a copy of the personal data we hold about you;</li>
            <li>ask us to correct anything that is wrong or incomplete;</li>
            <li>ask us to delete your data;</li>
            <li>ask us to restrict how we use it;</li>
            <li>
              object to how we use it where we rely on legitimate interests, and to direct marketing at
              any time;
            </li>
            <li>receive the data you gave us in a portable format;</li>
            <li>withdraw your consent at any time, where we rely on it.</li>
          </ul>
          <p>
            To use any of these rights, email {mail}. There is no charge, and we&apos;ll reply within one
            month. We may need to confirm your identity first.
          </p>
          <p>
            If you are unhappy with how we have handled your data, you can complain to the{" "}
            <a href="https://www.dataprotection.ie" target="_blank" rel="noopener">
              Data Protection Commission
            </a>{" "}
            in Ireland or, in the UK, to the{" "}
            <a href="https://ico.org.uk" target="_blank" rel="noopener">
              Information Commissioner&apos;s Office
            </a>
            . We&apos;d be grateful for the chance to put things right first.
          </p>
        </>
      ),
    },
    {
      id: "children",
      heading: "Children",
      body: (
        <p>
          {site.name} is for adults working in the hair and scalp professions. We don&apos;t knowingly
          collect data from anyone under 18, and we will delete it if we find we have.
        </p>
      ),
    },
    {
      id: "cookies",
      heading: "Cookies",
      body: (
        <p>
          We use a small number of first-party cookies to keep you signed in, remember an invitation and
          keep the site secure. We don&apos;t use advertising or third-party tracking cookies. Our{" "}
          <Link href="/cookies">cookie policy</Link> lists each one.
        </p>
      ),
    },
    {
      id: "security",
      heading: "Keeping your data safe",
      body: (
        <p>
          We use encryption in transit, restrict access to the people who need it, keep verification
          documents private, and review our providers&apos; security. No system is perfectly secure, so
          if something does go wrong we will tell you and the relevant authority as the law requires.
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
        updated={LEGAL_UPDATED}
        crumbs={crumbs}
        sections={sections}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
    </>
  );
}
