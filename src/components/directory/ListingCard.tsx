import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import type { PublicListing } from "@/lib/directory";
import { hasFullProfile } from "@/lib/directory";
import { DISCIPLINES } from "@/content/disciplines";
import { cn } from "@/lib/utils";

export function initials(name: string) {
  return name
    .replace(/^(dr|mr|mrs|ms|miss)\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Monogram({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        "grid place-items-center bg-paper-3 text-ink-2 display font-semibold tracking-[-0.02em]",
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}

export function ListingCard({ listing }: { listing: PublicListing }) {
  const claimed = hasFullProfile(listing);
  const discipline = DISCIPLINES.find((d) => d.id === listing.profession);
  const href = listing.slug ? `/directory/p/${listing.slug}` : undefined;

  const body = (
    <>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
        {claimed && listing.photoUrl ? (
          <Image
            src={listing.photoUrl}
            alt={`Portrait of ${listing.name}`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <Monogram name={listing.name} className="absolute inset-0 text-5xl" />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {listing.isFounding && (
            <span className="rounded-full bg-paper/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] backdrop-blur">
              Founding
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 pt-4">
        <p className="label text-muted-foreground">{discipline?.name ?? "Professional"}</p>
        <h3 className="flex items-center gap-1.5 text-lg font-semibold leading-tight tracking-tight">
          {listing.name}
          {listing.isVerified && (
            <BadgeCheck className="h-4 w-4 shrink-0 text-positive" aria-label="Verified" />
          )}
        </h3>
        {(listing.headline || listing.specialization) && (
          <p className="text-[15px] leading-snug text-ink-2 line-clamp-2">
            {claimed ? listing.headline || listing.specialization : listing.specialization}
          </p>
        )}
        <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {listing.city}
          {claimed && <span className="ml-2 text-ink">· Full profile</span>}
        </p>
      </div>
    </>
  );

  return href ? (
    <Link href={href} className="group block">
      {body}
    </Link>
  ) : (
    <div className="group">{body}</div>
  );
}
