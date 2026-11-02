import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, Building2, CalendarClock, Check, Globe, MapPin, Phone, Send, Sparkles, Users } from "lucide-react";
import { Container, Pill } from "@/components/site/primitives";
import { ListingPhoto, Monogram } from "@/components/directory/ListingCard";
import { EnquiryForm } from "@/components/directory/EnquiryForm";
import { PhotoGallery, type GalleryPhoto } from "@/components/partners/PhotoGallery";
import { Button } from "@/components/ui/button";
import { DISCIPLINES } from "@/content/disciplines";
import { images, img } from "@/content/images";
import { hasFullProfile, listingBySlug, cityKey } from "@/lib/directory";
import { absoluteUrl, breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { listPhotos } from "@/lib/photos";
import { PRACTITIONER } from "@/lib/showcase";
import { urlForFile } from "@/lib/storage";
import { SOCIAL_KEYS, SOCIAL_NETWORKS, membershipLabel, readQualifications, readSocials } from "@/lib/profile";
import { shortName } from "@/lib/names";
import { cn } from "@/lib/utils";
import { site } from "@/config/site";
import { profileCertificates } from "@/lib/courses";
import { CourseBadges } from "@/components/courses/CourseBadges";

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
              coverFileId: true,
            },
          },
        },
      },
    },
  });
  return row?.user?.profile ?? null;
}

/** Sample listings borrow editorial photos, so the directory never looks empty while it fills up. */
const SAMPLE_COVER = images.headSpa;
const SAMPLE_GALLERY = [images.clinic, images.salon, images.products, images.ed16, images.ed15, images.hairDetail];

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
  const who = shortName(listing.name, "They");
  // Everything beyond the basic listing respects the full-profile rules.
  const [profile, photoRows] = claimed
    ? await Promise.all([linkedProfile(listing.id), listing.userId ? listPhotos({ userId: listing.userId }) : Promise.resolve([])])
    : [null, []];
  // What the member uploaded always wins; sample listings fall back to editorial photos.
  const uploadedCover = claimed ? await urlForFile(profile?.coverFileId) : null;
  const cover = uploadedCover ?? (claimed && listing.isSample ? img(SAMPLE_COVER, 2000) : null);
  const gallery: GalleryPhoto[] = !claimed
    ? []
    : photoRows.length
      ? photoRows.slice(0, PRACTITIONER.photos).map((p) => ({ src: p.url, caption: p.caption }))
      : listing.isSample
        ? SAMPLE_GALLERY.map((i) => ({ src: img(i, 1600), caption: null }))
        : [];

  const qualifications = readQualifications(profile?.qualifications);
  const badges = claimed && listing.userId ? await profileCertificates(listing.userId) : [];
  const socials = readSocials(profile?.socials);
  const socialLinks = SOCIAL_KEYS.filter((k) => socials[k]).map((k) => ({ key: k, url: socials[k]!, label: SOCIAL_NETWORKS[k].label }));
  const phone = profile?.showPhone ? profile.phone : null;
  const address = profile?.showAddress
    ? [profile.addressLine1, profile.addressLine2, listing.city, profile.postcode].filter(Boolean).join(", ")
    : null;
  const verified = listing.isVerified || !!profile?.isVerified;
  const headline = claimed ? listing.headline || listing.specialization : listing.specialization;
  const years = profile?.yearsInPractice && profile.yearsInPractice > 0 ? profile.yearsInPractice : null;

  const facts = claimed
    ? [
        years && { icon: CalendarClock, value: `${years}`, label: years === 1 ? "year in practice" : "years in practice" },
        profile && profile.specialisms.length > 0 && { icon: Sparkles, value: `${profile.specialisms.length}`, label: profile.specialisms.length === 1 ? "specialism" : "specialisms" },
        verified && { icon: BadgeCheck, value: "Verified", label: "training checked by hand" },
        listing.acceptsReferrals && { icon: Users, value: "Referrals", label: "welcomes referrals from colleagues" },
      ].filter(Boolean) as { icon: typeof Sparkles; value: string; label: string }[]
    : [];

  return (
    <>
      {/* Hero */}
      <section className="pt-8 md:pt-10">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
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

          <div
            className={cn(
              "relative overflow-hidden rounded-[28px] bg-paper-2 md:rounded-[36px]",
              cover ? "aspect-[16/9] sm:aspect-[21/8]" : "h-36 md:h-48"
            )}
          >
            {cover ? (
              // Uploaded covers come from storage; a plain img avoids listing every host for next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={`${profile?.practiceName ?? listing.name}`} className="h-full w-full object-cover" />
            ) : (
              <div aria-hidden className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,var(--color-paper-3),transparent_60%),radial-gradient(circle_at_80%_80%,var(--color-rule),transparent_55%)]" />
            )}
          </div>

          <div className="relative -mt-16 flex flex-col gap-6 px-2 sm:-mt-20 md:flex-row md:items-end md:gap-8 md:px-8">
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-[6px] border-paper bg-paper-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)] sm:h-40 sm:w-40 md:h-48 md:w-48">
              {claimed && listing.photoUrl ? (
                <ListingPhoto src={listing.photoUrl} alt={`Portrait of ${listing.name}`} priority sizes="200px" className="object-cover" />
              ) : (
                <Monogram name={listing.name} className="absolute inset-0 text-5xl" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-3 pb-1">
              <div className="flex flex-wrap gap-2">
                {d && <Pill>{d.name}</Pill>}
                {listing.isFounding && <Pill tone="ink">Founding member</Pill>}
                {verified && (
                  <Pill tone="positive"><BadgeCheck className="h-3.5 w-3.5" /> Verified</Pill>
                )}
              </div>
              <h1 className="display text-4xl sm:text-5xl md:text-6xl">{listing.name}</h1>
              {profile?.practiceName && <p className="text-lg font-medium text-ink-2">{profile.practiceName}</p>}
            </div>
            <div className="flex flex-wrap gap-2 pb-2 md:justify-end">
              <Button asChild size="lg">
                <a href="#enquire">
                  <Send /> Send an enquiry
                </a>
              </Button>
              {claimed && listing.website && (
                <Button asChild size="lg" variant="outline">
                  <a href={listing.website} target="_blank" rel="noopener nofollow">
                    <Globe /> Website
                  </a>
                </Button>
              )}
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10 md:py-14">
        {headline && <p className="lede max-w-3xl md:px-8">{headline}</p>}
        <p className="mt-3 inline-flex items-center gap-1.5 text-[15px] text-ink-2 md:px-8">
          <MapPin className="h-4 w-4" /> {listing.city}, {listing.country}
        </p>

        {/* Key facts */}
        {facts.length > 0 && (
          <ul className={cn("mt-10 grid gap-3 sm:grid-cols-2", facts.length >= 3 && "lg:grid-cols-4")}>
            {facts.map((f) => (
              <li key={f.label} className="flex items-center gap-4 rounded-2xl border border-rule bg-card px-5 py-4">
                <f.icon className="h-6 w-6 shrink-0 stroke-[1.5]" aria-hidden />
                <span className="flex flex-col">
                  <span className="text-lg font-semibold leading-tight tracking-tight">{f.value}</span>
                  <span className="text-sm text-muted-foreground">{f.label}</span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="flex flex-col gap-12 lg:col-span-8">
            {claimed && listing.bio && (
              <section aria-labelledby="about">
                <p id="about" className="label mb-4 text-muted-foreground">About {who}</p>
                <div className="flex flex-col gap-5 text-lg leading-relaxed text-ink md:text-xl">
                  {listing.bio.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </section>
            )}

            {profile && profile.specialisms.length > 0 && (
              <section aria-labelledby="specialisms">
                <p id="specialisms" className="label mb-4 text-muted-foreground">Specialisms</p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {profile.specialisms.map((s) => (
                    <li key={s} className="flex items-center gap-3 rounded-2xl bg-paper-2 px-5 py-4 text-[15px] font-medium">
                      <Sparkles className="h-4 w-4 shrink-0" aria-hidden /> {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {claimed && listing.services.length > 0 && (
              <section aria-labelledby="services">
                <p id="services" className="label mb-4 text-muted-foreground">Services</p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {listing.services.map((s) => (
                    <li key={s} className="flex items-center gap-3 rounded-2xl border border-rule bg-card px-5 py-4 text-[15px]">
                      <Check className="h-4 w-4 shrink-0 text-positive" aria-hidden /> {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {gallery.length > 0 && (
              <section aria-labelledby="photos">
                <p id="photos" className="label mb-4 text-muted-foreground">Inside the practice</p>
                <PhotoGallery photos={gallery} name={listing.name} />
              </section>
            )}

            {badges.length > 0 && (
              <section aria-labelledby="courses">
                <p id="courses" className="label mb-4 text-muted-foreground">Courses completed with {site.name}</p>
                <CourseBadges badges={badges} className="sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0" />
              </section>
            )}

            {profile && (qualifications.length > 0 || profile.memberships.length > 0) && (
              <section aria-labelledby="qualifications">
                <p id="qualifications" className="label mb-4 text-muted-foreground">Qualifications and memberships</p>
                {qualifications.length > 0 && (
                  <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
                    {qualifications.map((q, i) => (
                      <li key={i} className="flex items-start justify-between gap-4 px-5 py-4 text-[15px]">
                        <span className="flex gap-3">
                          <BadgeCheck className={cn("mt-0.5 h-4 w-4 shrink-0", verified ? "text-positive" : "text-muted-foreground")} aria-hidden />
                          <span>
                            <span className="font-medium">{q.title}</span>
                            {q.body && <span className="text-ink-2">, {q.body}</span>}
                          </span>
                        </span>
                        {q.year && <span className="text-muted-foreground">{q.year}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {profile.memberships.length > 0 && (
                  <p className="mt-4 text-[15px] text-ink-2">Member of {profile.memberships.map(membershipLabel).join(", ")}.</p>
                )}
              </section>
            )}

            {(address || phone || socialLinks.length > 0) && (
              <section aria-labelledby="find" className="rounded-3xl bg-paper-2 p-6 md:p-8">
                <p id="find" className="label mb-4 text-muted-foreground">Where to find {who}</p>
                <div className="flex flex-col gap-3 text-[15px]">
                  {address && (
                    <p className="inline-flex items-start gap-2">
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0" /> {address}
                    </p>
                  )}
                  {phone && (
                    <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 underline underline-offset-4">
                      <Phone className="h-4 w-4" /> {phone}
                    </a>
                  )}
                  {socialLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {socialLinks.map((s) => (
                        <a key={s.key} href={s.url} target="_blank" rel="noopener nofollow" className="rounded-full border border-rule bg-card px-4 py-2 text-sm hover:border-ink/40">
                          {s.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:col-span-4">
            <div className="flex flex-col gap-4 lg:sticky lg:top-24">
              <section id="enquire" className="scroll-mt-24 rounded-3xl border border-rule bg-card p-6 shadow-[0_30px_60px_-40px_rgba(0,0,0,0.35)] md:p-7" aria-labelledby="enquire-title">
                <h2 id="enquire-title" className="display mb-1 text-2xl">Get in touch</h2>
                <p className="mb-6 text-[15px] text-ink-2">
                  {claimed
                    ? `Your message goes straight to ${who}, who will reply by email.`
                    : `${who} hasn't claimed this listing yet. We'll keep your message safe and let them know it's waiting.`}
                </p>
                <EnquiryForm listingId={listing.id} name={listing.name} />
              </section>

              {!claimed && (
                <div className="flex flex-col gap-4 rounded-3xl bg-ink p-6 text-paper">
                  <div>
                    <p className="font-semibold">Is this you?</p>
                    <p className="mt-1 text-sm text-paper/70">
                      Claim this listing to add your photos, services and website, and to read your enquiries.
                    </p>
                  </div>
                  <Button asChild variant="paper" className="self-start">
                    <Link href={`/directory/claim/${listing.slug}`}>Claim listing <ArrowRight /></Link>
                  </Button>
                </div>
              )}

              <p className="px-1 text-sm text-muted-foreground">
                Trichollective checks every listing by hand but does not endorse individual treatments. If you&apos;re unsure who to
                see, <Link href="/find" className="underline underline-offset-4">answer three questions</Link>.
              </p>
            </div>
          </aside>
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
