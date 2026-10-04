import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Container, Section } from "@/components/site/primitives";
import { prisma } from "@/lib/prisma";
import { partnerTierLabel, partnerLogoSrc, safeHttpUrl } from "@/lib/partners";
import { socialLinks } from "@/lib/business-profile";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { CountView } from "@/components/partners/CountView";
import { PartnerProfile } from "@/components/partners/PartnerProfile";

export const dynamic = "force-dynamic";

async function getPartner(slug: string) {
  const partner = await prisma.partner
    .findUnique({ where: { slug }, include: { organisation: { select: { socials: true } } } })
    .catch(() => null);
  return partner?.published ? partner : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const partner = await getPartner(slug);
  if (!partner) return { title: "Partner not found", robots: { index: false } };
  return pageMetadata({
    title: `${partner.name}, ${partnerTierLabel(partner.tier).toLowerCase()}`,
    description: partner.blurb.slice(0, 160),
    path: `/partners/${partner.slug}`,
  });
}

export default async function PartnerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const partner = await getPartner(slug);
  if (!partner) notFound();

  const logo = partnerLogoSrc(partner.logoUrl);
  const website = safeHttpUrl(partner.website);
  const socials = socialLinks(partner.organisation?.socials);
  // Contact details the brand chose to show publicly. The private contact email is never shown.
  const publicEmail = partner.publicEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partner.publicEmail) ? partner.publicEmail : null;
  const publicPhone = partner.publicPhone?.trim() || null;

  return (
    <>
      <CountView url={`/api/partners/${partner.slug}/view`} />
      <Section className="pb-12 md:pb-16">
        <Container size="narrow">
          <Link href="/partners" className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All partners
          </Link>

          <div className="mt-10">
            <PartnerProfile partner={partner} socials={socials} />
          </div>
        </Container>
      </Section>

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: partner.name,
            ...(website ? { url: website } : {}),
            ...(logo ? { logo: new URL(logo, site.url).toString() } : {}),
            ...(socials.length ? { sameAs: socials.map((s) => s.url) } : {}),
            ...(publicEmail ? { email: publicEmail } : {}),
            ...(publicPhone ? { telephone: publicPhone } : {}),
            description: partner.blurb,
          },
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Partners", path: "/partners" },
            { name: partner.name, path: `/partners/${partner.slug}` },
          ]),
        ]}
      />
    </>
  );
}
