import Image from "next/image";
import {
  BarChart3,
  Briefcase,
  Building2,
  Gift,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react";
import { ArrowLink, Container, Eyebrow, Section, SectionHeader } from "@/components/site/primitives";
import { CheckoutButton } from "@/components/site/CheckoutButton";
import { images, img } from "@/content/images";
import { tierById } from "@/config/subscriptions";
import { breadcrumbLd, JsonLd, pageMetadata, absoluteUrl } from "@/lib/seo";
import { site } from "@/config/site";

const business = tierById("business")!;

export const metadata = pageMetadata({
  title: `Business membership for clinics, salons and brands`,
  description: `Business membership puts your clinic, salon, brand or device company in front of hair and scalp professionals across Ireland and the UK. A business page, five seats, job posts and a perks listing for £${business.price} a month.`,
  path: "/for-business",
    og: { title: "Reach the people who understand the scalp.", eyebrow: "For business", img: images.products.src, variant: "photo" },
});

const who = [
  { t: "Clinics", d: "Hair loss, trichology and dermatology clinics looking for referrals and good people to hire." },
  { t: "Salons and head spas", d: "Teams who want to learn together and be found by clients who value scalp care." },
  { t: "Brands", d: "Haircare and scalp care brands who want honest feedback from the people who use their products." },
  { t: "Device makers", d: "Makers of scalp cameras, LED and UV devices and other equipment used in salons and clinics." },
];

const includes = [
  { icon: Building2, t: "A business page", d: "A page in the directory for your clinic, salon or company, with your services, locations and team." },
  { icon: Users, t: "Five Professional seats", d: "Five members of your team get full Professional membership, including the Case Room and the referral network." },
  { icon: Briefcase, t: "Job posts", d: "Post roles on the jobs board, where they are seen by practitioners who already care about scalp health." },
  { icon: Gift, t: "A listing in member perks", d: "Offer members a discount or trial, and appear in the perks directory every member can browse." },
  { icon: BarChart3, t: "A quarterly engagement summary", d: "A plain report each quarter on how members viewed and responded to your page, perks and posts." },
];

export default function ForBusinessPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute inset-y-0 right-0 hidden w-[50%] lg:block">
          <Image
            src={img(images.products, 1600)}
            alt={images.products.alt}
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
          <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-paper to-transparent" />
        </div>
        <Container className="relative">
          <div className="grid min-h-[75svh] items-center py-16 lg:grid-cols-12 lg:py-24">
            <div className="flex flex-col gap-8 animate-rise lg:col-span-6">
              <Eyebrow rule>Business membership</Eyebrow>
              <h1 className="display text-5xl sm:text-6xl lg:text-7xl">
                Be known by the people
                <br />
                <span className="text-fade">who know hair.</span>
              </h1>
              <p className="lede max-w-xl">
                Trichollective brings together cosmetic, clinical and medical hair and scalp professionals
                across Ireland and the UK. Business membership gives your clinic, salon or brand a trusted
                place among them.
              </p>
              <div className="flex flex-col gap-3">
                <CheckoutButton plan="business" size="xl" wrapperClassName="items-start">
                  Join for £{business.price} a month
                </CheckoutButton>
                <p className="text-sm text-muted-foreground">
                  Or £{business.annualPrice} a year, two months free. Cancel anytime.
                </p>
              </div>
            </div>
          </div>
        </Container>
        <div className="relative aspect-[4/3] w-full lg:hidden">
          <Image
            src={img(images.products, 1000)}
            alt={images.products.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* Who it's for */}
      <Section tone="paper-2">
        <Container>
          <SectionHeader
            eyebrow="Who it's for"
            title="Business membership is for the clinics, salons and brands"
            fade="that make this work possible."
          />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {who.map((w) => (
              <li key={w.t} className="flex flex-col gap-3 bg-paper p-7">
                <h3 className="display text-2xl">{w.t}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2">{w.d}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* What's included */}
      <Section>
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="flex flex-col gap-8 lg:col-span-5">
              <SectionHeader
                eyebrow="What's included"
                title="Your team gets everything it needs"
                fade="to take part fully."
                body={`Business membership is £${business.price} a month, or £${business.annualPrice} a year. There is no contract and no setup fee.`}
              />
              <div className="relative hidden aspect-[4/5] overflow-hidden rounded-3xl lg:block">
                <Image
                  src={img(images.clinic, 900)}
                  alt={images.clinic.alt}
                  fill
                  sizes="40vw"
                  className="object-cover"
                />
              </div>
            </div>
            <ul className="flex flex-col divide-y divide-rule border-y border-rule lg:col-span-7">
              {includes.map(({ icon: Icon, t, d }) => (
                <li key={t} className="flex gap-5 py-6">
                  <Icon className="mt-0.5 h-6 w-6 shrink-0 stroke-[1.25]" aria-hidden />
                  <div>
                    <p className="text-lg font-medium text-ink">{t}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Member protection */}
      <Section tone="ink">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="flex flex-col gap-6 lg:col-span-5">
              <Eyebrow rule className="text-paper">
                How we protect members
              </Eyebrow>
              <h2 className="display text-4xl sm:text-5xl">
                Trust is why it works.
                <br />
                <span className="opacity-60">We look after it.</span>
              </h2>
            </div>
            <div className="flex flex-col gap-8 lg:col-span-7">
              <p className="text-lg leading-relaxed text-paper/80">
                Members come to Trichollective for honest conversation with their peers. That is also what
                makes them worth reaching, so we keep a clear line between the two.
              </p>
              <ul className="flex flex-col divide-y divide-paper/15 border-y border-paper/15">
                {[
                  {
                    icon: ShieldCheck,
                    t: "Brands don't post in clinical spaces",
                    d: "The Case Room and the hair loss spaces are for practitioners only. Brand accounts cannot post there.",
                  },
                  {
                    icon: Tag,
                    t: "Sponsored content is always labelled",
                    d: "Anything paid for, from a Trichozette feature to a podcast episode, says so plainly.",
                  },
                ].map(({ icon: Icon, t, d }) => (
                  <li key={t} className="flex gap-4 py-5">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5]" aria-hidden />
                    <div>
                      <p className="font-medium">{t}</p>
                      <p className="mt-1 text-[15px] text-paper/70">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <section className="bg-paper">
        <Container className="py-24 md:py-32">
          <div className="flex flex-col items-center gap-8 text-center">
            <h2 className="display max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
              Join as a business.
              <br />
              <span className="text-fade">Start this week.</span>
            </h2>
            <p className="lede max-w-xl">
              Pay by card through Stripe and we&apos;ll help you set up your business page and invite your
              team. If it isn&apos;t right for you, we refund your first payment within 14 days.
            </p>
            <CheckoutButton plan="business" size="xl" wrapperClassName="items-center">
              Join for £{business.price} a month
            </CheckoutButton>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-8">
              <ArrowLink href="/partners">Looking to sponsor or partner instead?</ArrowLink>
              <ArrowLink href="/pricing#business">Compare all plans</ArrowLink>
            </div>
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
            "@type": "Service",
            name: `${site.name} Business membership`,
            description: business.summary,
            provider: { "@type": "Organization", name: site.name, url: site.url },
            areaServed: ["Ireland", "United Kingdom"],
            offers: {
              "@type": "Offer",
              price: business.price,
              priceCurrency: "GBP",
              url: absoluteUrl("/for-business"),
            },
          },
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "For business", path: "/for-business" },
          ]),
        ]}
      />
    </>
  );
}
