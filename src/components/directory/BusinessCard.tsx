import Link from "next/link";
import { Heart } from "lucide-react";
import type { Partner } from "@prisma/client";
import { partnerLogoSrc, partnerTierLabel } from "@/lib/partners";
import { safeHex, tint } from "@/lib/showcase";

/** A brand, clinic or charity page in the directory: its cover (or colour), logo, name and summary. */
export function BusinessCard({
  partner,
}: {
  partner: Pick<Partner, "slug" | "name" | "tier" | "kind" | "category" | "tagline" | "blurb" | "logoUrl" | "coverUrl" | "accentColor">;
}) {
  const cover = partnerLogoSrc(partner.coverUrl);
  const logo = partnerLogoSrc(partner.logoUrl);
  const accent = safeHex(partner.accentColor);
  const charity = partner.kind === "charity";
  return (
    <Link href={`/partners/${partner.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-rule bg-card transition hover:border-ink/40">
      <div className="relative aspect-[16/9] overflow-hidden" style={{ backgroundColor: cover ? undefined : tint(accent, 0.85) }}>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        )}
        <span
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ backgroundColor: charity ? accent : "#0B0B0B", color: "#FFFFFF" }}
        >
          {charity && <Heart className="h-3 w-3 fill-current" aria-hidden />}
          {partnerTierLabel(partner.tier, partner.kind)}
        </span>
      </div>
      <div className="relative flex flex-1 flex-col gap-2 px-5 pb-5 pt-10">
        <div className="absolute -top-8 left-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-rule bg-white p-1.5 shadow-sm">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-lg font-semibold">{partner.name.slice(0, 1)}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{partner.category}</p>
        <h3 className="text-lg font-semibold leading-snug tracking-tight">{partner.name}</h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-ink-2">{partner.tagline || partner.blurb}</p>
      </div>
    </Link>
  );
}
