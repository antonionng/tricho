import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, Building2, Globe, MapPin, Phone } from "lucide-react";
import { Container, Pill } from "@/components/site/primitives";
import { ListingPhoto, Monogram } from "@/components/directory/ListingCard";
import { EnquiryForm } from "@/components/directory/EnquiryForm";
import { Button } from "@/components/ui/button";
import { DISCIPLINES } from "@/content/disciplines";
import { hasFullProfile, listingBySlug, cityKey } from "@/lib/directory";
import { absoluteUrl, breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { SOCIAL_KEYS, SOCIAL_NETWORKS, membershipLabel, readQualifications, readSocials } from "@/lib/profile";
import { shortName } from "@/lib/names";

/** The richer details a member keeps on their own profile, for listings linked to an account. */
async function linkedProfile(listingId: string) {
  const row = await prisma.directoryListing.findUnique({
    where: { id: listingId },
    select: {
      phone: true,
      user: {
        select: {
          profile: {
            select: {
              practiceName: true,
              specialisms: true,
              qualifications: true,
              memberships: true,
              yearsInPractice: true,
              socials: true,
              phone: true,
              showPhone: true,
              addressLine1: true,
              addressLine2: true,
              postcode: true,
              showAddress: true,
              isVerified: true,
            },
          },
        },
      },
    },
  });
  return row?.user?.profile ?? null;
}

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const l = await listingBySlug((await params).slug);
  if (!l) return {};
  const d = DISCIPLINES.find((x) => x.id === l.profession);
  return pageMetadata({
    title: `${l.name}, ${d?.name ?? "hair and scalp"} professional in ${l.city}`,
    description:
      (hasFullProfile(l) && (l.headline || l.bio)?.slice(0, 150)) ||
      `${l.name} is listed in the Trichollective directory as a ${d?.name.toLowerCase() ?? ""} professional in ${l.city}${l.specialization ? `, specialising in ${l.specialization.toLowerCase()}` : ""}.`,
    path: `/directory/p/${l.slug}`,
    og: {
      title: l.name,
      eyebrow: `${d?.name ?? "Professional"} · ${l.city}`,
      sub: (hasFullProfile(l) ? l.headline || l.specialization : l.specialization) ?? undefined,
      ...(hasFullProfile(l) && l.photoUrl?.startsWith("https://images.unsplash.com/") ? { img: l.photoUrl, variant: "profile" as const } : {}),
    },
  });
}

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const listing = await listingBySlug((await params).slug);
  if (!listing) notFound();
  const claimed = hasFullProfile(listing);
  const d = DISCIPLINES.find((x) => x.id === listing.profession);
  // Everything beyond the basic listing respects the full-profile rules.
  const profile = claimed ? await linkedProfile(listing.id) : null;
  const qualifications = readQualifications(profile?.qualifications);
  const socials = readSocials(profile?.socials);
  const socialLinks = SOCIAL_KEYS.filter((k) => socials[k]).map((k) => ({ key: k, url: socials[k]!, label: SOCIAL_NETWORKS[k].label }));
  const phone = profile?.showPhone ? profile.phone : null;
  const address = profile?.showAddress
    ? [profile.addressLine1, profile.addressLine2, listing.city, profile.postcode].filter(Boolean).join(", ")
    : null;
  const verified = listing.isVerified || !!profile?.isVerified;

  return (
    <>
      <Container className="py-12 md:py-16">
        <nav aria-label="Breadcrumb" className="mb-10 text-sm text-muted-foreground">
          <Link href="/directory" className="hover:text-ink">Directory</Link>
          {d && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/directory/${d.slug}/${cityKey(listing.city)}`} className="hover:text-ink">
                {d.name} in {listing.city}
              </Link>
            </>
          )}
        </nav>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
              {claimed && listing.photoUrl ? (
                <ListingPhoto src={listing.photoUrl} alt={`Portrait of ${listing.name}`} priority sizes="(min-width:1024px) 40vw, 100vw" />
              ) : (
                <Monogram name={listing.name} className="absolute inset-0 text-8xl" />
              )}
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {d && <Pill>{d.name}</Pill>}
                {listing.isFounding && <Pill tone="ink">Founding member</Pill>}
                {verified && (
                  <Pill tone="positive"><BadgeCheck className="h-3.5 w-3.5" /> Verified</Pill>
                )}
              </div>
              <h1 className="display text-5xl md:text-6xl">{listing.name}</h1>
              {profile?.practiceName && <p className="text-lg text-ink-2">{profile.practiceName}</p>}
              {(claimed ? listing.headline || listing.specialization : listing.specialization) && (
                <p className="lede">{claimed ? listing.headline || listing.specialization : listing.specialization}</p>
              )}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-ink-2">
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {listing.city}, {listing.country}</span>
                {claimed && listing.website && (
                  <a href={listing.website} target="_blank" rel="noopener nofollow" className="inline-flex items-center gap-1.5 underline underline-offset-4">
                    <Globe className="h-4 w-4" /> Website
                  </a>
                )}
                {socialLinks.map((s) => (
                  <a key={s.key} href={s.url} target="_blank" rel="noopener nofollow" className="underline underline-offset-4">
                    {s.label}
                  </a>
                ))}
                {phone && (
                  <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 underline underline-offset-4">
                    <Phone className="h-4 w-4" /> {phone}
                  </a>
                )}
              </div>
              {address && (
                <p className="inline-flex items-start gap-1.5 text-[15px] text-ink-2">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0" /> {address}
                </p>
              )}
            </div>

            {claimed && listing.bio && (
              <div className="prose-tricho border-t border-rule pt-8">
                {listing.bio.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}

            {profile && (profile.specialisms.length > 0 || profile.yearsInPractice != null) && (
              <div className="border-t border-rule pt-8">
                <p className="label text-muted-foreground mb-4">Specialisms</p>
                {profile.specialisms.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {profile.specialisms.map((s) => (
                      <li key={s} className="rounded-full border border-rule bg-card px-3.5 py-1.5 text-sm">{s}</li>
                    ))}
                  </ul>
                )}
                {profile.yearsInPractice != null && profile.yearsInPractice > 0 && (
                  <p className="mt-4 text-[15px] text-ink-2">
                    {shortName(listing.name, "They")} has been in practice for {profile.yearsInPractice}{" "}
                    {profile.yearsInPractice === 1 ? "year" : "years"}.
                  </p>
                )}
              </div>
            )}

            {claimed && listing.services.length > 0 && (
              <div className="border-t border-rule pt-8">
                <p className="label text-muted-foreground mb-4">Services</p>
                <ul className="flex flex-wrap gap-2">
                  {listing.services.map((s) => (
                    <li key={s} className="rounded-full border border-rule bg-card px-3.5 py-1.5 text-sm">{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {profile && (qualifications.length > 0 || profile.memberships.length > 0) && (
              <div className="border-t border-rule pt-8">
                <p className="label text-muted-foreground mb-4">Qualifications and memberships</p>
                {qualifications.length > 0 && (
                  <ul className="flex flex-col gap-2 text-[15px]">
                    {qualifications.map((q, i) => (
                      <li key={i} className="flex justify-between gap-4">
                        <span>{q.title}{q.body ? `, ${q.body}` : ""}</span>
                        {q.year && <span className="text-muted-foreground">{q.year}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {profile.memberships.length > 0 && (
                  <p className="mt-4 text-[15px] text-ink-2">
                    Member of {profile.memberships.map(membershipLabel).join(", ")}.
                  </p>
                )}
              </div>
            )}

            <section className="rounded-3xl border border-rule bg-card p-6 md:p-8" aria-labelledby="enquire">
              <h2 id="enquire" className="display text-2xl mb-1">Get in touch</h2>
              <p className="mb-6 text-[15px] text-ink-2">
                {claimed
                  ? `Your message goes straight to ${shortName(listing.name, "They")}, who will reply by email.`
                  : `${shortName(listing.name, "They")} hasn't claimed this listing yet. We'll keep your message safe and let them know it's waiting.`}
              </p>
              <EnquiryForm listingId={listing.id} name={listing.name} />
            </section>

            {!claimed && (
              <aside className="flex flex-col gap-4 rounded-3xl bg-ink p-6 text-paper md:flex-row md:items-center md:justify-between md:p-8">
                <div>
                  <p className="font-semibold">Is this you?</p>
                  <p className="mt-1 text-sm text-paper/70">
                    Claim this listing to add your photo, services and website, and to read your enquiries.
                  </p>
                </div>
                <Button asChild variant="paper" className="shrink-0">
                  <Link href={`/directory/claim/${listing.slug}`}>Claim listing <ArrowRight /></Link>
                </Button>
              </aside>
            )}

            <p className="text-sm text-muted-foreground">
              Trichollective checks every listing by hand but does not endorse individual treatments. If
              you&apos;re unsure who to see, <Link href="/find" className="underline underline-offset-4">answer three questions</Link>.
            </p>
          </div>
        </div>
      </Container>

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": claimed ? "LocalBusiness" : "Person",
            name: listing.name,
            url: absoluteUrl(`/directory/p/${listing.slug}`),
            ...(claimed && listing.photoUrl ? { image: listing.photoUrl.startsWith("/") ? absoluteUrl(listing.photoUrl) : listing.photoUrl } : {}),
            ...(claimed && listing.bio ? { description: listing.bio } : {}),
            address: { "@type": "PostalAddress", addressLocality: listing.city, addressCountry: listing.country },
            ...(claimed && (listing.website || socialLinks.length)
              ? { sameAs: [listing.website, ...socialLinks.map((s) => s.url)].filter(Boolean) }
              : {}),
            ...(phone ? { telephone: phone } : {}),
          },
          breadcrumbLd([
            { name: "Directory", path: "/directory" },
            { name: listing.name, path: `/directory/p/${listing.slug}` },
          ]),
        ]}
      />
    </>
  );
}
