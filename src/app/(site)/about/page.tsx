import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLink, Container, Eyebrow, Section, SectionHeader } from "@/components/site/primitives";
import { images, img } from "@/content/images";
import { breadcrumbLd, JsonLd, organizationLd, pageMetadata, absoluteUrl } from "@/lib/seo";
import { site } from "@/config/site";
import { Timeline } from "@/components/site/Timeline";

export const metadata = pageMetadata({
  title: `About us`,
  description: `How Trichollective began at ${site.founder}'s gatherings at ${site.originPlace}, what we believe, and what we will and won't do as a community for hair and scalp professionals.`,
  path: "/about",
    og: { title: "It started in a room.", sub: "At Whittlebury Hall.", eyebrow: "About Trichollective", img: images.gathering.src, variant: "photo" },
});

const values = [
  {
    t: "Evidence over hype",
    d: "We would rather say we don't know than repeat a claim nobody can support. When members recommend a product or a treatment, we ask what it is based on.",
  },
  {
    t: "Respect across disciplines",
    d: "A head spa therapist, a trichologist and a dermatologist each see something the others might miss. Nobody here is more important than anybody else.",
  },
  {
    t: "The client comes first",
    d: "Every conversation, referral and course should leave the people in our chairs and clinics better cared for. When in doubt, we choose what is right for them.",
  },
  {
    t: "Share what you know",
    d: "The field moves forward when people pass on what they have learned. We make it easy to share, and we make sure the people who share are recognised.",
  },
];

const will = [
  "Review every directory listing by hand before it goes live",
  "Check qualifications before we add a verified badge",
  "Label sponsored content clearly, every time",
  "Tell the public when they should see a doctor",
  "Keep cases in the Case Room anonymised and private to verified professionals",
];

const wont = [
  "Diagnose anyone online, or suggest that we can",
  "Publish member counts, testimonials or statistics we can't stand behind",
  "Let brands post in clinical spaces",
  "Sell members' details to anyone",
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute inset-y-0 right-0 hidden w-[48%] lg:block">
          <Image
            src={img(images.gathering, 1600)}
            alt={images.gathering.alt}
            fill
            priority
            sizes="48vw"
            className="object-cover"
          />
          <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-paper to-transparent" />
        </div>
        <Container className="relative">
          <div className="grid min-h-[70svh] items-center py-16 lg:grid-cols-12 lg:py-24">
            <div className="flex flex-col gap-8 animate-rise lg:col-span-6">
              <Eyebrow rule>About Trichollective</Eyebrow>
              <h1 className="display text-5xl sm:text-6xl lg:text-7xl">
                It started in a room
                <br />
                <span className="text-fade">at {site.origin}.</span>
              </h1>
              <p className="lede max-w-xl">
                Trichollective brings together everyone who cares for hair and the scalp beneath it, from the treatment
                chair to the consulting room.
              </p>
            </div>
          </div>
        </Container>
        <div className="relative aspect-[4/3] w-full lg:hidden">
          <Image
            src={img(images.gathering, 1000)}
            alt={images.gathering.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* Story */}
      <Section tone="paper-2">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5 flex flex-col gap-6">
              <p className="label opacity-70">Founded by {site.founderFull}</p>
              <p className="display text-4xl md:text-5xl leading-[1.02]">
                The people who care for hair and scalp should be talking to each other.
              </p>
              <p className="text-[15px] leading-relaxed text-ink-2">{site.founderBio}</p>
              <figure className="border-l-2 border-ink pl-5">
                <p className="display text-2xl leading-tight">
                  {site.founder} believes that our hair reflects the harmony of our entire being, from the inside out.
                </p>
                <figcaption className="mt-3 text-sm text-muted-foreground">
                  From {site.founderPractice.name}
                </figcaption>
              </figure>
              <a
                href={site.founderPractice.url}
                target="_blank"
                rel="noopener"
                className="text-sm font-medium underline underline-offset-4"
              >
                {site.founder}&apos;s practice: {site.founderPractice.name}
              </a>
            </div>
            <div className="lg:col-span-7 prose-tricho">
              <p className="text-xl leading-relaxed text-ink">
                Cosmetic, clinical and medical professionals often see the same client at different points, yet
                they rarely meet. {site.founder} saw that from the treatment chair and from the consulting room, and
                decided to change it.
              </p>
              <p>
                In January 2026 she brought trichologists and hair professionals together at {site.originPlace}.
                In June they met again at Whittlebury Park, with talks on hair biology, patient perspectives,
                non-surgical hair restoration and building a UK trichology database. Head spa therapists,
                stylists, trichologists, nurses and doctors sat in the same room and learned from each other.
              </p>
              <p>
                Those days showed how much each discipline had to offer the others, and how much was lost in the
                months between them. So Trichollective now runs all year online, with a private community,
                courses, a public directory and Trichozette. It launches at {site.launch.title} on 5 October, and
                the conferences carry on in person, with {site.next.city} next.
              </p>
              <p>
                It is a closed, paid membership. That keeps the conversation professional, keeps the Case Room
                private, and means we answer to members rather than advertisers.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Timeline */}
      <Section>
        <Container>
          <SectionHeader eyebrow="So far" title="Trichollective began at Whittlebury Hall" fade="and launches online in Dublin." />
          <div className="mt-14">
            <Timeline />
          </div>
        </Container>
      </Section>

      {/* Values */}
      <Section>
        <Container>
          <SectionHeader
            eyebrow="What we believe"
            title="These are the four things"
            fade="we hold ourselves to."
          />
          <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-rule bg-rule md:grid-cols-2">
            {values.map((v, i) => (
              <li key={v.t} className="flex flex-col gap-4 bg-paper p-8 md:p-10">
                <p className="label text-muted-foreground">0{i + 1}</p>
                <h3 className="display text-3xl">{v.t}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2">{v.d}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Will and won't */}
      <Section tone="paper-2">
        <Container>
          <SectionHeader
            eyebrow="Our commitments"
            title="Here is what we will always do,"
            fade="and what we never will."
            body="Trust is the whole point of a professional community. These are promises, not aspirations."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-rule bg-card p-7 md:p-9">
              <p className="label mb-6 text-muted-foreground">We will</p>
              <ul className="flex flex-col gap-4 text-[15px] leading-relaxed">
                {will.map((w) => (
                  <li key={w} className="flex gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0" aria-hidden />
                    <span>{w}.</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-ink bg-ink p-7 text-paper md:p-9">
              <p className="label mb-6 text-paper/60">We won&apos;t</p>
              <ul className="flex flex-col gap-4 text-[15px] leading-relaxed">
                {wont.map((w) => (
                  <li key={w} className="flex gap-3">
                    <X className="mt-1 h-4 w-4 shrink-0" aria-hidden />
                    <span>{w}.</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* Contact */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <SectionHeader
                eyebrow="Contact"
                title="You will always reach a real person,"
                fade="and we read every message."
                body={
                  <>
                    For questions about membership, the directory or anything else, email{" "}
                    <a href={`mailto:${site.contactEmail}`} className="text-ink underline underline-offset-4">
                      {site.contactEmail}
                    </a>
                    . We reply to every message ourselves.
                  </>
                }
              />
            </div>
            <div className="flex flex-col gap-4 lg:col-span-5 lg:col-start-8 lg:justify-end">
              <ArrowLink href="/partners">Partnerships and sponsorship</ArrowLink>
              <ArrowLink href="/for-business">Business membership</ArrowLink>
              <ArrowLink href="/find">Looking for a professional?</ArrowLink>
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <section className="border-t border-rule bg-paper">
        <Container className="py-24 md:py-32">
          <div className="flex flex-col items-center gap-8 text-center">
            <h2 className="display max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
              A stronger hair industry,
              <br />
              <span className="text-fade">together.</span>
            </h2>
            <Button asChild size="xl">
              <Link href="/founding">
                Become a founding member <ArrowRight />
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: `About ${site.name}`,
            url: absoluteUrl("/about"),
            mainEntity: organizationLd(),
          },
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />
    </>
  );
}
