import Image from "next/image";
import Link from "next/link";
import { CalendarDays, FlaskConical, Gift, Mic, Newspaper, Presentation } from "lucide-react";
import { ArrowLink, Container, Eyebrow, Section, SectionHeader } from "@/components/site/primitives";
import { images, img } from "@/content/images";
import { breadcrumbLd, JsonLd, pageMetadata, absoluteUrl } from "@/lib/seo";
import { site } from "@/config/site";
import { PartnerForm } from "./PartnerForm";

export const metadata = pageMetadata({
  title: `Partner with us: sponsorship and trials`,
  description:
    "Sponsor an issue of Trichozette, a podcast episode, a gathering or a masterclass, run a product trial with members or offer a featured perk. Reach hair and scalp professionals across Ireland and the UK.",
  path: "/partners",
    og: { title: "Partner with Trichollective", eyebrow: "For business", img: images.gathering.src, variant: "photo" },
});

const options = [
  {
    icon: Newspaper,
    t: "Sponsor an issue of Trichozette",
    d: "Support one monthly edition. Your name appears on the issue, clearly marked as its sponsor, alongside an optional labelled feature.",
  },
  {
    icon: Mic,
    t: "Sponsor a podcast episode",
    d: "A short, labelled mention at the start and end of an episode, read by the host.",
  },
  {
    icon: CalendarDays,
    t: "Sponsor a gathering",
    d: "Support one of our in-person conferences, with space to show your work and time to meet members.",
  },
  {
    icon: Presentation,
    t: "Sponsor a masterclass",
    d: "Support a monthly live masterclass on a subject related to your work. The teaching stays independent.",
  },
  {
    icon: FlaskConical,
    t: "Product trials with members",
    d: "Put your product or device in the hands of practitioners who volunteer to try it, and hear what they honestly think.",
  },
  {
    icon: Gift,
    t: "Featured perks",
    d: "Offer members a discount or trial, featured in the perks directory and the monthly newsletter.",
  },
];

export default function PartnersPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-paper">
        <Container>
          <div className="grid gap-12 py-16 md:py-24 lg:grid-cols-12 lg:items-center lg:gap-16">
            <div className="flex flex-col gap-8 animate-rise lg:col-span-6">
              <Eyebrow rule>Partnerships</Eyebrow>
              <h1 className="display text-5xl sm:text-6xl lg:text-7xl">
                Support the work.
                <br />
                <span className="text-fade">Meet the people.</span>
              </h1>
              <p className="lede max-w-xl">
                Brands, device makers and clinics can support Trichollective and reach the cosmetic, clinical
                and medical professionals who make up its membership. Every partnership is labelled, and every
                one is chosen with care.
              </p>
              <p className="label text-ink">Rate card available on request</p>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl lg:col-span-6 lg:aspect-[5/6]">
              <Image
                src={img(images.gathering, 1200)}
                alt={images.gathering.alt}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Options */}
      <Section tone="paper-2">
        <Container>
          <SectionHeader
            eyebrow="Ways to partner"
            title="There are six ways"
            fade="to work with Trichollective."
            body="Each option can stand alone or be combined over a season. Tell us what you have in mind and we'll suggest what fits."
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
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHeader
                eyebrow="Our terms"
                title="Clear lines between content and sponsorship"
                fade="keep our members' trust."
              />
            </div>
            <div className="prose-tricho lg:col-span-7">
              <p>
                Members trust Trichollective because the conversation is honest. We keep it that way by
                labelling everything that is paid for, keeping brands out of clinical spaces, and never
                letting a sponsor decide what is taught.
              </p>
              <p>
                We say no to partnerships that make medical claims we can&apos;t support, or that don&apos;t
                fit the people we serve. If you want an ongoing presence rather than a single sponsorship,{" "}
                <Link href="/for-business">Business membership</Link> may suit you better.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Enquiry */}
      <Section tone="paper-2" id="enquire">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="flex flex-col gap-6 lg:col-span-4">
              <SectionHeader
                eyebrow="Enquire"
                title="Tell us what you have in mind"
                fade="and we will come back to you personally."
                body="The rate card is available on request. Send us a few details and we'll reply with it, along with ideas that suit your company."
              />
              <p className="text-[15px] text-ink-2">
                Prefer email?{" "}
                <a href={`mailto:${site.contactEmail}`} className="text-ink underline underline-offset-4">
                  {site.contactEmail}
                </a>
              </p>
              <ArrowLink href="/for-business">Business membership</ArrowLink>
            </div>
            <div className="relative lg:col-span-8">
              <PartnerForm />
            </div>
          </div>
        </Container>
      </Section>

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: `Partner with ${site.name}`,
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
