import Link from "next/link";
import { LegalPage } from "@/components/editorial/LegalPage";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { FREE_LISTING_DAYS } from "@/config/subscriptions";
import { LEGAL_UPDATED } from "@/lib/legal";

export const metadata = pageMetadata({
  title: "Terms of business",
  description: `The terms for using ${site.name}: membership, business plans and event tickets, payment and cancellation, our no-refunds policy, community standards, courses and the directory.`,
  path: "/terms",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Terms", path: "/terms" },
];

export default function TermsPage() {
  const mail = <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>;

  const sections = [
    {
      id: "about",
      heading: "About these terms",
      body: (
        <>
          <p>
            These terms apply whenever you use the {site.name} website, create an account, list yourself
            in the directory, become a member, buy a business plan or buy an event ticket. By creating an
            account or making a payment, you agree to them.
          </p>
          <p>
            {site.name} is operated by Trichollective Ltd. You can reach us at {mail}. Our <Link href="/privacy">privacy notice</Link>{" "}
            explains how we handle personal data, and our <Link href="/cookies">cookie policy</Link> explains
            the small files we store in your browser.
          </p>
          <p>
            Please read the <a href="#payments-and-refunds">payments and refunds</a> section carefully
            before you pay, because payments are non-refundable.
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
            Membership is for people who work, or are training to work, in cosmetic, clinical or medical
            hair and scalp care, and for businesses serving them. You must be at least 18.
          </p>
          <p>
            You join for the purposes of your trade, business or profession. Where the law treats you as
            a consumer, you keep the rights the law gives consumers, as described below.
          </p>
          <p>
            We may ask for reasonable evidence of your professional background, and we may decline an
            application or listing that doesn&apos;t fit the community. Please keep your account details
            accurate and your sign-in private, because you are responsible for what happens on your
            account.
          </p>
        </>
      ),
    },
    {
      id: "plans",
      heading: "Plans and what they include",
      body: (
        <>
          <p>
            We offer a free account, paid individual memberships and paid business plans. What each plan
            includes, and its price, is shown on our <Link href="/pricing">pricing page</Link> and, for
            businesses, on our <Link href="/for-business">business page</Link> at the time you pay.
          </p>
          <p>
            We keep improving {site.name}, so features may change over time. We won&apos;t take away
            the main things your plan is for during a period you have already paid for.
          </p>
        </>
      ),
    },
    {
      id: "membership-and-payment",
      heading: "Subscriptions and renewal",
      body: (
        <>
          <p>
            Paid plans are subscriptions, billed monthly or yearly in advance. Payments are processed by
            Stripe, and we never see or store your full card details. Prices include VAT where it
            applies.
          </p>
          <p>
            Your subscription renews automatically at the end of each period, at the then current price,
            until you cancel.
          </p>
          <p>
            If a payment fails, we&apos;ll let you know and give you time to update your card before paid
            features are paused.
          </p>
          <p>
            Founding members keep their founding price for as long as their membership continues
            without a break. If we change prices for anyone else, we&apos;ll give you at least 30
            days&apos; notice by email before the change applies to you, so you can cancel first if you
            wish.
          </p>
        </>
      ),
    },
    {
      id: "payments-and-refunds",
      heading: "Payments and refunds",
      body: (
        <>
          <p>
            <strong>All payments are non-refundable.</strong> This includes membership, business plans,
            partner pages, event tickets and courses, and it applies to monthly and yearly payments,
            to the first payment and to every renewal. We don&apos;t give refunds or credits for
            part-used periods, for features you didn&apos;t use, or if you change your mind.
          </p>
          <p>
            <strong>Your 14-day right to cancel.</strong> When you pay for membership or a business plan,
            you ask us to start providing it straight away, and you agree that you lose your 14-day right
            to cancel under consumer law once it has started. You confirm this at checkout, before you
            pay. Members-only content and features are available to you from the moment your payment is
            taken.
          </p>
          <p>
            <strong>Event tickets.</strong> Tickets are for an event on a specific date, so the 14-day
            right to cancel does not apply to them. If you can no longer attend, please tell us at {mail}{" "}
            before the event and you may pass your ticket to a colleague instead.
          </p>
          <p>
            <strong>When we will refund.</strong> We will refund you if we cancel an event and don&apos;t
            offer you another date you are happy with, if you were charged by mistake, or where the law
            requires it. If we end a membership for a serious breach of these terms, we won&apos;t refund
            the current period.
          </p>
          <p>
            <strong>Chargebacks.</strong> If you dispute a payment with your bank rather than contacting us
            first, we may pause your account while the dispute is resolved. Please write to {mail} if you
            think something has gone wrong, and we&apos;ll look into it promptly.
          </p>
          <p>
            Nothing in these terms affects your statutory rights as a consumer in Ireland or the United
            Kingdom, including your right to a service provided with reasonable care and skill.
          </p>
        </>
      ),
    },
    {
      id: "cancellation",
      heading: "Cancelling your subscription",
      body: (
        <>
          <p>
            You can cancel at any time from the billing page in your account. Cancelling stops your next
            renewal. Your plan stays active until the end of the period you have already paid for, and
            you won&apos;t be charged again.
          </p>
          <p>
            When your paid plan ends, your account becomes a free account. Your profile and history are
            kept so you can rejoin easily, unless you ask us to delete them.
          </p>
        </>
      ),
    },
    {
      id: "business-plans",
      heading: "Business plans and partner pages",
      body: (
        <>
          <p>
            Business plans and Premium Business partner pages are bought for business purposes. You
            confirm that you are authorised to act for the business named at checkout, and that the
            details, logo and claims you give us are accurate and lawful.
          </p>
          <p>
            We review partner pages, job adverts and offers before they go live, and we may edit or
            decline anything that is misleading, makes medical claims, or doesn&apos;t suit the
            community. Being a partner is not an endorsement by {site.name} of your products or
            services.
          </p>
          <p>
            Offers you make to members must be honoured as described. You are responsible for your own
            products, services, advertising and compliance with the law.
          </p>
        </>
      ),
    },
    {
      id: "events",
      heading: "Events",
      body: (
        <>
          <p>
            Event details, including the programme and speakers, may change before the day. If we need to
            move an event to a new date or venue, we&apos;ll tell you as soon as we can, and your ticket
            will be valid for the new arrangement.
          </p>
          <p>
            Some events are sold through third parties, such as Eventbrite. Their terms apply to tickets
            bought through them.
          </p>
          <p>
            Photographs and video may be taken at events. If you would prefer not to appear, please tell a
            member of the team on the day.
          </p>
        </>
      ),
    },
    {
      id: "referral-rewards",
      heading: "Referral rewards",
      body: (
        <>
          <p>
            Every account has a personal invitation code. A colleague who joins with your code pays half
            price for their first month, and once their first payment has cleared you receive one month
            of your own membership free, at the monthly price you pay.
          </p>
          <p>
            Rewards are given as credit on your {site.name} bill and are never paid out as cash. If you
            are not yet a paying member, your reward is kept for you and applied automatically when you
            start paying.
          </p>
          <p>
            You cannot refer yourself, another account of your own or anyone using your payment details.
            Each new paying member earns one reward, for the person whose code they used when they first
            joined. We may withdraw a reward, including credit already applied, if a payment is reversed
            or if we reasonably believe a code has been misused.
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
            messages, events, referrals or the directory, please:
          </p>
          <ul>
            <li>be kind and respectful, especially to colleagues from other disciplines;</li>
            <li>
              never share information that could identify a client. Remove names, faces and other
              details from any case or referral you share, and have the client&apos;s permission to
              share it;
            </li>
            <li>stay within the scope of your own training and professional rules;</li>
            <li>be honest about your qualifications and experience;</li>
            <li>
              declare any commercial interest when you recommend a product, service or business;
            </li>
            <li>not use member details, messages or the directory for unsolicited marketing;</li>
            <li>not post anything unlawful, misleading, discriminatory or harassing;</li>
            <li>
              not scrape, copy in bulk or try to break the security of the site, and not share your
              account with anyone else.
            </li>
          </ul>
          <p>
            If someone breaks these standards, we may remove content, pause access or end their account.
            You can report a concern at any time by writing to {mail}.
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
            Everything on {site.name}, including Trichozette, the Journal, guides, the podcast, courses,
            masterclasses, the Assistant and community discussions, is for general information and
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
      id: "assistant",
      heading: "The Assistant and other AI features",
      body: (
        <p>
          Some features use AI to help you find colleagues, answer questions and draft text. AI can be
          wrong, so please check anything it suggests before you rely on it or share it, and never enter
          details that could identify a client. You are responsible for what you choose to use or
          publish.
        </p>
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
            {" "}{site.name} so the service can work, and, for your public listing or partner page, to
            show it to anyone. If you are invited to contribute to Trichozette or the Journal, we will
            agree the terms with you separately.
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
      id: "ending",
      heading: "Suspending or ending an account",
      body: (
        <p>
          We may pause or end an account if its holder seriously or repeatedly breaks these terms, gives
          us false information, misuses the community or doesn&apos;t pay. Where it is fair to do so,
          we&apos;ll warn you first and give you a chance to put things right. You can close your
          account at any time by writing to {mail}.
        </p>
      ),
    },
    {
      id: "liability",
      heading: "Our responsibility to you",
      body: (
        <>
          <p>
            We will provide the service with reasonable care and skill. We are not responsible for losses
            that were not foreseeable, for the actions of other members, partners or listed
            professionals, or for interruptions outside our reasonable control.
          </p>
          <p>
            If you use {site.name} for business, we are not responsible for loss of profit, business,
            revenue or opportunity, and our total responsibility to you in any year is limited to the
            amount you paid us in that year.
          </p>
          <p>
            Nothing in these terms limits liability that cannot be limited by law, including for death or
            personal injury caused by negligence, or for fraud.
          </p>
        </>
      ),
    },
    {
      id: "complaints",
      heading: "Complaints",
      body: (
        <p>
          If you are unhappy with anything, please write to {mail}. We&apos;ll acknowledge your complaint
          within five working days and aim to resolve it within 30 days.
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
            If any part of these terms is found to be unenforceable, the rest still applies. These terms
            are governed by the laws of Ireland, and the Irish courts can hear any dispute. If you are a
            consumer living in the United Kingdom, you also keep the protection of the mandatory laws of
            the part of the UK where you live, and you can bring a claim in your local courts.
          </p>
        </>
      ),
    },
  ];

  return (
    <>
      <LegalPage
        eyebrow="Terms"
        title="Terms of business"
        intro={
          <p>
            The agreement between you and {site.name}, written as plainly as we can. If anything is
            unclear, please ask us before you pay.
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
