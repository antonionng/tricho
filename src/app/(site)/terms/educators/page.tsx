import Link from "next/link";
import { LegalPage } from "@/components/editorial/LegalPage";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { EDUCATOR_TERMS_UPDATED, educatorTerms } from "@/content/educator-terms";

export const metadata = pageMetadata({
  title: "Educator terms",
  description: `The terms for Educator members of ${site.name}: the membership fee, approval, owning your courses, content standards, the revenue share and payouts.`,
  path: "/terms/educators",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Terms", path: "/terms" },
  { name: "Educator terms", path: "/terms/educators" },
];

export default function EducatorTermsPage() {
  return (
    <>
      <LegalPage
        eyebrow="Terms"
        title="Educator terms"
        intro={
          <p>
            The terms you agree to when you become an Educator member of {site.name} and sell courses here. They sit alongside our{" "}
            <Link href="/terms">terms of business</Link>.
          </p>
        }
        updated={EDUCATOR_TERMS_UPDATED}
        crumbs={crumbs}
        sections={educatorTerms.map((s) => ({
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
