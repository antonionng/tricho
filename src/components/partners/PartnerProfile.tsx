import Link from "next/link";
import { ArrowUpRight, Gift, Info, Mail, Phone } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { displayHost, partnerLogoSrc, partnerTierLabel, safeHttpUrl } from "@/lib/partners";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

export type PartnerProfileData = {
  name: string;
  slug: string;
  tier: string;
  category: string;
  logoUrl: string | null;
  website: string | null;
  blurb: string;
  perk: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
};

/**
 * The body of a public partner page. The public page and the brand's own
 * preview in the setup both render this, so the preview is exactly what
 * visitors will see.
 */
export function PartnerProfile({
  partner,
  socials,
  preview = false,
}: {
  partner: PartnerProfileData;
  socials: { id: string; label: string; url: string }[];
  /** In the brand's preview the heading level drops and website visits are not counted. */
  preview?: boolean;
}) {
  const logo = partnerLogoSrc(partner.logoUrl);
  const website = safeHttpUrl(partner.website);
  const host = displayHost(partner.website);
  const premium = partner.tier === "premium";
  // Contact details the brand chose to show publicly. The private contact email is never shown.
  const publicEmail = partner.publicEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partner.publicEmail) ? partner.publicEmail : null;
  const publicPhone = partner.publicPhone?.trim() || null;
  const telHref = publicPhone ? `tel:${publicPhone.replace(/[^\d+]/g, "")}` : null;
  const Heading = preview ? "h2" : "h1";
  const paragraphs = partner.blurb
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-8">
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

      <Heading className={cn("display", preview ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl")}>{partner.name}</Heading>

      {paragraphs.length > 0 ? (
        <div className="prose-tricho">
          {paragraphs.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Your description will appear here once you add it.</p>
      )}

      {(website || socials.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {website && (
            <Button asChild size="lg" variant="outline">
              <a href={preview ? website : `/go/${partner.slug}`} target="_blank" rel="noopener nofollow sponsored">
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
          Sponsored. {partner.name} is a paying {premium ? "Premium" : "Business"} partner of {site.name}. Partners support our
          work but do not decide what we teach or publish, and they never post in the clinical spaces.
        </span>
      </p>
    </div>
  );
}
