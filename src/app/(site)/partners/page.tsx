import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, FlaskConical, Gift, Mail, Newspaper, Presentation } from "lucide-react";
import { ArrowLink, Container, Eyebrow, Pill, Section, SectionHeader } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { images, img } from "@/content/images";
import { premiumBusiness } from "@/config/subscriptions";
import { foundingPartnerPlacesLeft } from "@/lib/founding";
import { partnerTierLabel, publishedPartners, partnerLogoSrc } from "@/lib/partners";
import { ProudSupporters } from "@/components/site/ProudSupporters";
import { breadcrumbLd, JsonLd, pageMetadata, absoluteUrl } from "@/lib/seo";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: `Our partners`,
  description:
    "The brands, device makers and educators who support Trichollective and the hair and scalp professionals in it. Everything a partner sponsors is clearly labelled.",
  path: "/partners",
  og: { title: "The partners who support hair and scalp professionals.", eyebrow: "Partners", img: images.ed09.src, variant: "photo" },
});

const options = [
  {
    icon: Presentation,
    t: "Teach a masterclass",
    d: "Lead one sponsored masterclass a year, reviewed so that it teaches rather than sells, and kept in the member library afterwards. You can also co-develop a certificated course, subject to clinical review.",
  },
  {
    icon: Newspaper,
    t: "Appear in Trichozette",
    d: "Publish one labelled partner feature a year, and carry “Supported by” on one edition each quarter.",
  },
  {
    icon: Mail,
    t: "Be spotlighted in the newsletter",
    d: "Reach every member's inbox with two newsletter spotlights a year, clearly marked as sponsored.",
  },
  {
    icon: CalendarDays,
    t: "Speak at a conference",
    d: "Give a talk or demo at one conference a year, in a room of about 50 practitioners, with sampling or a delegate-bag insert at the others.",
  },
  {
    icon: FlaskConical,
    t: "Run a product trial",
    d: "Put your product in the hands of members who opt in to try it, and receive structured feedback you can act on.",
  },
  {
    icon: Gift,
    t: "Offer a member perk",
    d: "Give members a discount or trial, and see how many redeem it in your quarterly report.",
  },
];

export default async function PartnersPage() {
  const [everyone, placesLeft] = await Promise.all([publishedPartners(), foundingPartnerPlacesLeft()]);
  // Charities have their own band, and gifted pages are found only through the directory.
  const partners = everyone.filter((p) => p.kind === "brand");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-paper">
        <Container>
          <div className="grid gap-12 py-16 md:py-24 lg:grid-cols-12 lg:items-center lg:gap-16">
            <div className="flex flex-col gap-8 animate-rise lg:col-span-6">
              <Eyebrow rule>Partners</Eyebrow>
              <h1 className="display text-5xl sm:text-6xl lg:text-7xl">
                The partners who support
                <br />
                <span className="text-fade">hair and scalp professionals.</span>
              </h1>
              <p className="lede max-w-xl">
                Our partners are brands, device makers and educators who help keep Trichollective independent, and
                everything they sponsor is clearly labelled.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/for-business#compare">
                    Become a partner <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/for-business#compare">Compare Business and Premium</Link>
                </Button>
              </div>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl lg:col-span-6 lg:aspect-[5/6]">
              <Image
                src={img(images.ed09, 1200)}
                alt={images.ed09.alt}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="mag-bw object-cover"
              />
            </div>
          </div>
        </Container>
      </section>

      <ProudSupporters />

      {/* Showcase */}
      <Section tone="paper-2" id="partners">
        <Container>
          <SectionHeader
            eyebrow="Our partners"
            title={partners.length ? "Meet the companies" : "Founding partner places are available"}
            fade={partners.length ? "supporting the profession with us." : undefined}
            body={
              partners.length
                ? "Premium partners are listed first. Members see each partner's perk in the member area."
                : undefined
            }
          />

          {partners.length ? (
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {partners.map((p) => {
                const logo = partnerLogoSrc(p.logoUrl);
                return (
                  <li key={p.id}>
                    <Link
                      href={`/partners/${p.slug}`}
                      className="group flex h-full flex-col gap-5 rounded-3xl border border-rule bg-paper p-7 transition-colors hover:border-ink"
                    >
                      <div className="flex h-16 items-center">
                        {logo ? (
                          // Partner logos come from anywhere, so a plain img rather than next/image.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logo} alt={`${p.name} logo`} className="max-h-16 max-w-[180px] object-contain" loading="lazy" />
                        ) : (
                          <span className="display text-3xl">{p.name}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Pill tone={p.tier === "premium" ? "ink" : "default"}>{partnerTierLabel(p.tier)}</Pill>
                        <Pill>{p.category}</Pill>
                      </div>
                      <div className="flex flex-col gap-2">
                        <h3 className="text-xl font-semibold leading-snug tracking-tight">{p.name}</h3>
                        <p className="line-clamp-4 text-[15px] leading-relaxed text-ink-2">{p.blurb}</p>
                      </div>
                      <span className="mt-auto inline-flex items-center gap-2 text-[15px] font-medium text-ink">
                        About {p.name}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-12 flex flex-col gap-5 rounded-3xl border border-dashed border-rule bg-paper p-8 md:p-10">
              <p className="max-w-2xl text-[15px] leading-relaxed text-ink-2">
                We are choosing our first partners now.{" "}
                {placesLeft > 0
                  ? `${placesLeft} of ${premiumBusiness.foundingPlaces} founding partner places remain at £${premiumBusiness.foundingAnnualPrice.toLocaleString("en-GB")} a year, kept for as long as the partner stays.`
                  : `Premium Business is £${premiumBusiness.annualPrice.toLocaleString("en-GB")} a year.`}{" "}
                Partners who join will be shown here.
              </p>
              <ArrowLink href="/for-business#compare">Join as a founding partner</ArrowLink>
            </div>
          )}
        </Container>
      </Section>

      {/* Options */}
      <Section>
        <Container>
          <SectionHeader
            eyebrow="What partners do"
            title="Premium partners teach, write and exhibit"
            fade="alongside the profession all year."
            body="Premium Business includes all six, together with everything in Business: a directory page, five Professional seats and job posts."
          />
          <ul className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
            {options.map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex flex-col gap-4 bg-paper p-8">
                <Icon className="h-6 w-6 stroke-[1.25]" aria-hidden />
                <h3 className="text-xl font-semibold leading-snug tracking-tight">{t}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2">{d}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Principles */}
      <Section tone="paper-2">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHeader
                eyebrow="Our terms"
                title="Clear labelling keeps members' trust,"
                fade="which is what makes a partnership worth having."
              />
            </div>
            <div className="prose-tricho lg:col-span-7">
              <p>
                Members trust Trichollective because the conversation is honest. We keep it that way by labelling
                everything that is paid for, keeping brands out of the clinical spaces, and never letting a partner
                decide what is taught.
              </p>
              <ul>
                {premiumBusiness.guardrails.map((g) => (
                  <li key={g}>{g}.</li>
                ))}
              </ul>
              <p>
                We say no to partnerships that make clinical claims we can&apos;t support, or that don&apos;t fit the
                people we serve. If you would like a presence without the editorial and conference placements,{" "}
                <Link href="/for-business#compare">Business membership</Link> may suit you better, and you can join it
                online today.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <section className="bg-paper">
        <Container className="py-24 md:py-32">
          <div className="flex flex-col items-center gap-8 text-center">
            <h2 className="display max-w-4xl text-5xl sm:text-6xl">
              Tell us about your company
              <br />
              <span className="text-fade">and we will reply personally.</span>
            </h2>
            <p className="lede max-w-xl">
              Join online and your partner page goes live as soon as you pay.{" "}
              {placesLeft > 0
                ? `${placesLeft} of ${premiumBusiness.foundingPlaces} founding partner places remain.`
                : `Founding partner places have all been taken. Premium Business is £${premiumBusiness.annualPrice.toLocaleString("en-GB")} a year.`}
            </p>
            <Button asChild size="xl">
              <Link href="/for-business#compare">
                Become a partner <ArrowRight />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Questions first?{" "}
              <a href={`mailto:${site.contactEmail}`} className="text-ink underline underline-offset-4">
                {site.contactEmail}
              </a>
            </p>
          </div>
        </Container>
      </section>

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${site.name} partners`,
            url: absoluteUrl("/partners"),
            description: metadata.description,
          },
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Partners", path: "/partners" },
          ]),
        ]}
      />
    </>
  );
}
