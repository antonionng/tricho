import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isCharity, partnerTierLabel, partnerLogoSrc, safeHttpUrl } from "@/lib/partners";
import { socialLinks } from "@/lib/business-profile";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { CountView } from "@/components/partners/CountView";
import { ShowcaseProfile } from "@/components/partners/ShowcaseProfile";
import { listPhotos } from "@/lib/photos";
import { publicTeam } from "@/lib/business-team";
import { liveJobWhere } from "@/lib/jobs";

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
    title: partner.kind === "gifted" ? `${partner.name}, ${partner.category.toLowerCase()}` : `${partner.name}, ${partnerTierLabel(partner.tier, partner.kind).toLowerCase()}`,
    description: (partner.tagline || partner.blurb).slice(0, 160),
    path: `/partners/${partner.slug}`,
  });
}

export default async function PartnerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const partner = await getPartner(slug);
  if (!partner) notFound();

  const [photos, team, jobs] = await Promise.all([
    listPhotos({ partnerId: partner.id }),
    publicTeam(partner.ownerEmail),
    prisma.job.findMany({
      where: { partnerId: partner.id, ...liveJobWhere() },
      orderBy: { createdAt: "desc" },
      select: { slug: true, title: true, location: true, employment: true },
    }),
  ]);
  const logo = partnerLogoSrc(partner.logoUrl);
  const website = safeHttpUrl(partner.website);
  const socials = socialLinks(partner.organisation?.socials);
  // Contact details the brand chose to show publicly. The private contact email is never shown.
  const publicEmail = partner.publicEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partner.publicEmail) ? partner.publicEmail : null;
  const publicPhone = partner.publicPhone?.trim() || null;

  return (
    <>
      <CountView url={`/api/partners/${partner.slug}/view`} />
      <ShowcaseProfile
        partner={partner}
        photos={photos.map((p) => ({ src: p.url, caption: p.caption }))}
        socials={socials}
        team={team}
        jobs={jobs}
      />

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": isCharity(partner) ? "NGO" : "Organization",
            name: partner.name,
            ...(website ? { url: website } : {}),
            ...(logo ? { logo: new URL(logo, site.url).toString() } : {}),
            ...(socials.length ? { sameAs: socials.map((s) => s.url) } : {}),
            ...(publicEmail ? { email: publicEmail } : {}),
            ...(publicPhone ? { telephone: publicPhone } : {}),
            description: partner.tagline || partner.blurb,
            ...(photos.length ? { image: photos.slice(0, 4).map((p) => new URL(p.url, site.url).toString()) } : {}),
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
