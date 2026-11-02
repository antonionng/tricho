import Link from "next/link";
import { LegalPage } from "@/components/editorial/LegalPage";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { PARTNER_TERMS_UPDATED, partnerTerms } from "@/content/partner-terms";

export const metadata = pageMetadata({
  title: "Premium partner terms",
  description: `The terms for Premium Business partners of ${site.name}: fees and renewal, sponsored content standards, member perks and trials, and how the partnership ends.`,
  path: "/terms/partners",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Terms", path: "/terms" },
  { name: "Premium partner terms", path: "/terms/partners" },
];

export default function PartnerTermsPage() {
  return (
    <>
      <LegalPage
        eyebrow="Terms"
        title="Premium partner terms"
        intro={
          <p>
            The terms a business agrees to when it becomes a Premium partner of {site.name}. They sit alongside our{" "}
            <Link href="/terms">terms of business</Link> and the offer agreed with each partner.
          </p>
        }
        updated={PARTNER_TERMS_UPDATED}
        crumbs={crumbs}
        sections={partnerTerms.map((s) => ({
          id: s.id,
          heading: s.heading,
          body: (
            <>
              {s.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </>
          ),
        }))}
      />
      <JsonLd data={breadcrumbLd(crumbs)} />
    </>
  );
}
