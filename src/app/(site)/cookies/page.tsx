import Link from "next/link";
import { LegalPage } from "@/components/editorial/LegalPage";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { LEGAL_UPDATED } from "@/lib/legal";

export const metadata = pageMetadata({
  title: "Cookie policy",
  description: `The cookies and browser storage ${site.name} uses, what each one does and how long it lasts. We don't use advertising or third-party tracking cookies.`,
  path: "/cookies",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Cookies", path: "/cookies" },
];

/** Every cookie and storage key the site sets. Keep in step with the code. */
const items = [
  { name: "authjs.session-token", purpose: "Keeps you signed in.", lasts: "Up to 30 days" },
  { name: "authjs.csrf-token", purpose: "Protects sign-in forms from forgery.", lasts: "Until you close your browser" },
  { name: "authjs.callback-url", purpose: "Returns you to the right page after signing in.", lasts: "Until you close your browser" },
  { name: "tc_signin_email", purpose: "Remembers the email you asked for a sign-in link with, so the link works.", lasts: "30 minutes" },
  { name: "tc_ref", purpose: "Remembers a colleague's invitation, so your discount and their reward are applied.", lasts: "30 days" },
  { name: "tc_src", purpose: "Remembers which event or campaign brought you to the site, so we can count sign-ups.", lasts: "60 days" },
  { name: "tc_onboarding", purpose: "Remembers how far you got through setting up your account.", lasts: "90 days" },
  { name: "tc_source (browser storage)", purpose: "The same as tc_src, kept in your browser.", lasts: "60 days" },
  { name: "tricho:currency (browser storage)", purpose: "Remembers whether you chose to see prices in pounds or euro.", lasts: "Until you clear it" },
];

export default function CookiesPage() {
  const mail = <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>;

  const sections = [
    {
      id: "what-cookies-are",
      heading: "What cookies are",
      body: (
        <p>
          Cookies are small files a website stores in your browser. Browser storage works in a similar
          way. We use both only for things that make {site.name} work, and never for advertising.
        </p>
      ),
    },
    {
      id: "what-we-use",
      heading: "What we use",
      body: (
        <>
          <p>These are set by {site.name} itself. None of them is shared with advertisers.</p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">What it does</th>
                  <th scope="col">How long it lasts</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.name}>
                    <td><code>{c.name}</code></td>
                    <td>{c.purpose}</td>
                    <td>{c.lasts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            On a secure site, the sign-in cookies have a <code>__Secure-</code> or <code>__Host-</code>{" "}
            prefix added to their names.
          </p>
        </>
      ),
    },
    {
      id: "third-parties",
      heading: "Payments and other services",
      body: (
        <p>
          When you pay, you are taken to Stripe&apos;s secure checkout, which sets its own cookies to
          process the payment and prevent fraud. If you sign in with Google, Google sets its own cookies
          on its sign-in pages. Their own cookie policies explain these.
        </p>
      ),
    },
    {
      id: "choices",
      heading: "Your choices",
      body: (
        <p>
          You can block or delete cookies in your browser settings. If you block the sign-in cookies,
          you won&apos;t be able to sign in. If we ever add analytics or other cookies that need your
          consent, we&apos;ll ask you first and update this page. Questions are welcome at {mail}, and
          our <Link href="/privacy">privacy notice</Link> explains how we handle personal data.
        </p>
      ),
    },
  ];

  return (
    <>
      <LegalPage
        eyebrow="Cookies"
        title="Cookie policy"
        intro={<p>We keep cookies to the few the site needs to work. This page lists every one of them.</p>}
        updated={LEGAL_UPDATED}
        crumbs={crumbs}
        sections={sections}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
    </>
  );
}
