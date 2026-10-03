import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Gift, Info, Mail, Phone } from "lucide-react";
import { Container, Pill, Section } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { displayHost, partnerTierLabel, partnerLogoSrc, safeHttpUrl } from "@/lib/partners";
import { socialLinks } from "@/lib/business-profile";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { CountView } from "@/components/partners/CountView";

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
  const host = displayHost(partner.website);
  const premium = partner.tier === "premium";
  const socials = socialLinks(partner.organisation?.socials);
  // Contact details the brand chose to show publicly. The private contact email is never shown.
  const publicEmail = partner.publicEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partner.publicEmail) ? partner.publicEmail : null;
  const publicPhone = partner.publicPhone?.trim() || null;
  const telHref = publicPhone ? `tel:${publicPhone.replace(/[^\d+]/g, "")}` : null;

  return (
    <>
      <CountView url={`/api/partners/${partner.slug}/view`} />
      <Section className="pb-12 md:pb-16">
        <Container size="narrow">
          <Link href="/partners" className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All partners
          </Link>

          <div className="mt-10 flex flex-col gap-8">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={premium ? "ink" : "default"}>{partnerTierLabel(partner.tier)}</Pill>
              <Pill>{partner.category}</Pill>
              <Pill>Sponsored</Pill>
            </div>

            {logo && (
              <div className="flex h-24 items-center">
                {/* Partner logos come from anywhere, so a plain img rather than next/image. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt={`${partner.name} logo`} className="max-h-24 max-w-[260px] object-contain" />
              </div>
            )}

            <h1 className="display text-5xl sm:text-6xl">{partner.name}</h1>

            <div className="prose-tricho">
              {partner.blurb
                .split(/\n{2,}/)
                .map((para) => para.trim())
                .filter(Boolean)
                .map((para) => (
                  <p key={para}>{para}</p>
                ))}
            </div>

            {(website || socials.length > 0) && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                {website && (
                  <Button asChild size="lg" variant="outline">
                    <a href={`/go/${partner.slug}`} target="_blank" rel="noopener nofollow sponsored">
                      Visit {host ?? "their website"} <ArrowUpRight />
                    </a>
                  </Button>
                )}
                {socials.map((s) => (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="text-sm text-ink-2 underline underline-offset-4 hover:text-ink"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}

            {(publicEmail || publicPhone) && (
              <div className="flex flex-col gap-2 text-[15px]">
                <p className="label text-muted-foreground">Contact {partner.name}</p>
                {publicEmail && (
                  <a href={`mailto:${publicEmail}`} className="inline-flex items-center gap-2 text-ink underline underline-offset-4">
                    <Mail className="h-4 w-4 shrink-0" aria-hidden /> {publicEmail}
                  </a>
                )}
                {publicPhone && telHref && (
                  <a href={telHref} className="inline-flex items-center gap-2 text-ink underline underline-offset-4">
                    <Phone className="h-4 w-4 shrink-0" aria-hidden /> {publicPhone}
                  </a>
                )}
              </div>
            )}

            {partner.perk && (
              <aside className="flex gap-4 rounded-3xl border border-rule bg-card p-6 md:p-8">
                <Gift className="mt-0.5 h-6 w-6 shrink-0 stroke-[1.25]" aria-hidden />
                <div className="flex flex-col gap-3">
                  <p className="label text-muted-foreground">Member perk</p>
                  <p className="text-lg font-medium text-ink">Members get an offer from {partner.name}.</p>
                  <p className="text-[15px] leading-relaxed text-ink-2">
                    Members can see the full offer and how to claim it in the member area.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <Button asChild size="default">
                      <Link href="/members/perks">See member perks</Link>
                    </Button>
                    <Button asChild size="default" variant="outline">
                      <Link href="/pricing">Become a member</Link>
                    </Button>
                  </div>
                </div>
              </aside>
            )}

            <p className="flex gap-3 border-t border-rule pt-6 text-sm leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                Sponsored. {partner.name} is a paying {premium ? "Premium" : "Business"} partner of {site.name}.
                Partners support our work but do not decide what we teach or publish, and they never post in the
                clinical spaces.
              </span>
            </p>
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
