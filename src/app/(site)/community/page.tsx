import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarDays,
  Cpu,
  Flower2,
  Hand,
  Lock,
  Mail,
  Microscope,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ArrowLink,
  Container,
  Eyebrow,
  Pill,
  Section,
  SectionHeader,
} from "@/components/site/primitives";
import { Reveal } from "@/components/site/Reveal";
import { ProductPreview } from "@/components/site/ProductPreview";
import { StickyJoin } from "@/components/site/StickyJoin";
import { images, img } from "@/content/images";
import { CHAPTERS } from "@/content/chapters";
import { DISCIPLINES } from "@/content/disciplines";
import { breadcrumbLd, JsonLd, pageMetadata, absoluteUrl } from "@/lib/seo";

export const metadata = pageMetadata({
  title: `How the community works`,
  description:
    "Take the tour of the Trichollective community: spaces for every part of hair and scalp care, the private Case Room, local chapters, direct messages, live case rounds and a referral network across disciplines.",
  path: "/community",
    og: { title: "Everything you need to understand hair and scalp", sub: "is here, whoever you are.", eyebrow: "The community", img: images.community.src, variant: "photo" },
});

const spaces = [
  {
    icon: Flower2,
    name: "Head Spa & Scalp Care",
    body: "Techniques, routines, products and the day-to-day craft of looking after the scalp.",
  },
  {
    icon: Microscope,
    name: "Hair Loss & Trichology",
    body: "Shedding, thinning and scalp conditions, discussed by the people who see them every week.",
  },
  {
    icon: Lock,
    name: "The Case Room",
    body: "Private to verified professionals. Cases are shared anonymised, with nothing that could identify a client.",
    tag: "Verified professionals only",
  },
  {
    icon: Cpu,
    name: "Devices & Technology",
    body: "Scalp cameras, LED and UV devices and the rest of the kit, with honest notes from people who use them.",
  },
  {
    icon: TrendingUp,
    name: "Business & Marketing",
    body: "Pricing, bookings, hiring and finding clients, from people who run clinics, salons and head spas.",
  },
  {
    icon: Hand,
    name: "Introductions",
    body: "Say hello, tell people what you do and where, and find the members you should know.",
  },
  {
    icon: Sparkles,
    name: "Wins",
    body: "A new qualification, a full diary, a client you helped. Share it with people who understand what it took.",
  },
];

export default function CommunityPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-paper">
        <Container>
          <div className="grid gap-12 py-16 md:py-24 lg:grid-cols-12 lg:items-center lg:gap-16">
            <div className="flex flex-col gap-8 animate-rise lg:col-span-5">
              <Eyebrow rule>The community</Eyebrow>
              <h1 className="display text-5xl sm:text-6xl lg:text-7xl">
                Between gatherings,
                <br />
                <span className="text-fade">the room stays open.</span>
              </h1>
              <p className="lede">
                Trichollective is a private community for cosmetic, clinical and medical hair and scalp
                professionals. Here is how it works, and what you will find when you join.
              </p>
            </div>
            <div className="lg:col-span-7">
              <ProductPreview />
            </div>
          </div>
        </Container>
      </section>

      {/* Spaces */}
      <Section tone="paper-2">
        <Container>
          <SectionHeader
            eyebrow="Spaces"
            title="There is a space for every part"
            fade="of hair and scalp care."
            body="Conversations are organised by topic, so you can follow what matters to your work and ignore what doesn't. Nothing is lost in a feed, and everything useful stays searchable."
          />
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {spaces.map(({ icon: Icon, name, body, tag }, i) => (
              <Reveal as="li" key={name} delay={(i % 3) * 60}>
                <div
                  className={`flex h-full flex-col gap-4 rounded-3xl border p-7 ${
                    tag ? "border-ink bg-ink text-paper" : "border-rule bg-card"
                  }`}
                >
                  <Icon className="h-6 w-6 stroke-[1.25]" aria-hidden />
                  <h3 className="text-xl font-semibold tracking-tight">{name}</h3>
                  <p className={`text-[15px] leading-relaxed ${tag ? "text-paper/80" : "text-ink-2"}`}>{body}</p>
                  {tag && (
                    <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium leading-none text-ink">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> {tag}
                    </span>
                  )}
                </div>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Chapters */}
      <Section>
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeader
              eyebrow="Local chapters"
              title="Meet the people"
              fade="who practise near you."
              body="When you join, you choose a chapter. It is where you find members in your area, hear about local meet-ups, and build the relationships that referrals depend on."
            />
            <ArrowLink href="/chapters">All chapters</ArrowLink>
          </div>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CHAPTERS.map((c) => {
              const image = c.imageKey ? images[c.imageKey] : null;
              return (
                <li key={c.slug}>
                  <Link
                    href={`/chapters/${c.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-rule bg-card transition-shadow hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]"
                  >
                    {image ? (
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image
                          src={img(image, 800)}
                          alt={image.alt}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[16/10] items-end bg-paper-2 p-6">
                        <p className="display text-5xl text-ink/15">{c.city}</p>
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-2 p-6">
                      <p className="label text-muted-foreground">{c.country}</p>
                      <h3 className="text-xl font-semibold tracking-tight">{c.city}</h3>
                      <p className="text-[15px] leading-relaxed text-ink-2">{c.blurb}</p>
                      <span className="mt-auto inline-flex items-center gap-2 pt-3 text-[15px] font-medium">
                        Visit the chapter <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      {/* Direct messages */}
      <section className="border-y border-rule">
        <Container>
          <div className="grid gap-10 py-16 md:grid-cols-12 md:items-center md:py-20">
            <div className="flex flex-col gap-4 md:col-span-5">
              <p className="label opacity-70">Direct messages</p>
              <h2 className="display text-4xl sm:text-5xl">
                Ask quietly.
                <br />
                <span className="text-fade">Get a real answer.</span>
              </h2>
            </div>
            <p className="lede md:col-span-7">
              Some questions are better asked one to one. Message any member directly to follow up on a
              post, ask for a second opinion or arrange a referral. Messages are private, and anyone who
              misuses them loses access.
            </p>
          </div>
        </Container>
      </section>

      {/* Referrals: the unique part */}
      <section id="referrals" className="relative scroll-mt-20 overflow-hidden bg-ink text-paper">
        <div className="absolute inset-y-0 right-0 hidden w-[45%] opacity-60 lg:block">
          <Image
            src={img(images.clinic, 1400)}
            alt=""
            fill
            sizes="45vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/60 to-transparent" />
        </div>
        <Container className="relative py-24 md:py-32">
          <div className="flex max-w-2xl flex-col gap-8">
            <Eyebrow rule className="text-paper">
              The referral network
            </Eyebrow>
            <h2 className="display text-5xl md:text-6xl">
              The right person,
              <br />
              <span className="opacity-60">at the right time.</span>
            </h2>
            <p className="text-lg leading-relaxed text-paper/80">
              A head spa therapist notices a change in a client&apos;s scalp. A trichologist needs a
              doctor&apos;s opinion. A doctor wants somewhere gentle to send a patient for ongoing scalp care.
              Trichollective is built so each of them knows exactly who to call.
            </p>
            <ol className="flex flex-col divide-y divide-paper/15 border-y border-paper/15">
              {DISCIPLINES.map((d, i) => (
                <li key={d.id} className="flex gap-5 py-5">
                  <span className="label pt-1 text-paper/50">0{i + 1}</span>
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="mt-1 text-[15px] text-paper/70">{d.who}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="text-[15px] leading-relaxed text-paper/70">
              Professional members can see who practises what, and where, across all three disciplines. You can
              pass a client on with a short note, so the next professional knows why they are coming. We
              never diagnose, and the referral network is no substitute for medical advice. It simply makes
              it easier to pass someone on well.
            </p>
            <div>
              <Button asChild size="lg" variant="paper">
                <Link href="/pricing#professional">
                  See Professional membership <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Live sessions and recordings */}
      <Section>
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl lg:col-span-5">
              <Image
                src={img(images.learning, 1000)}
                alt={images.learning.alt}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-8 lg:col-span-7 lg:justify-center">
              <SectionHeader
                eyebrow="Live"
                title="Learn live in the room,"
                fade="or catch up whenever it suits you."
              />
              <ul className="flex flex-col divide-y divide-rule border-y border-rule">
                {[
                  {
                    icon: CalendarDays,
                    t: "A monthly masterclass",
                    d: "A practitioner or specialist teaches one subject in depth, with time for questions.",
                  },
                  {
                    icon: Microscope,
                    t: "Case rounds",
                    d: "Verified professionals walk through anonymised cases together, with each discipline adding what it sees.",
                  },
                  {
                    icon: PlayCircle,
                    t: "Recordings",
                    d: "Every masterclass is recorded and kept in the library, so you can watch when your diary allows.",
                  },
                ].map(({ icon: Icon, t, d }) => (
                  <li key={t} className="flex gap-4 py-5">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5]" aria-hidden />
                    <div>
                      <p className="font-medium text-ink">{t}</p>
                      <p className="mt-1 text-[15px] text-ink-2">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <ArrowLink href="/events">See upcoming sessions and gatherings</ArrowLink>
            </div>
          </div>
        </Container>
      </Section>

      {/* Recognition */}
      <Section tone="paper-2">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHeader
                eyebrow="Recognition"
                title="When you share what you know,"
                fade="the community notices."
                body="Members who answer questions, share cases and help newcomers build a contribution level over time. Higher levels come with real opportunities."
              />
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              {[
                { t: "Speaking slots", d: "An invitation to lead a masterclass, a case round or a talk at a gathering." },
                { t: "Featured in the directory", d: "A place among featured professionals, where the public looks first." },
                { t: "Writing for Trichozette", d: "A chance to publish a piece in the monthly edition, with editorial help." },
                { t: "A say in the programme", d: "An early look at plans, and a voice in what the community does next." },
              ].map((p) => (
                <li key={p.t} className="flex flex-col gap-3 rounded-3xl border border-rule bg-card p-6">
                  <Award className="h-5 w-5 stroke-[1.5]" aria-hidden />
                  <p className="font-medium text-ink">{p.t}</p>
                  <p className="text-[15px] leading-relaxed text-ink-2">{p.d}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Standards */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHeader
                eyebrow="Standards"
                title="This is a careful, professional place"
                fade="to talk about your work."
                body="A community is only as good as the way it is looked after. These are the standards every member agrees to."
              />
            </div>
            <ul className="flex flex-col divide-y divide-rule border-y border-rule lg:col-span-7">
              {[
                {
                  icon: ShieldCheck,
                  t: "Client privacy comes first",
                  d: "Cases are anonymised before they are shared. Posts that could identify a client are removed.",
                },
                {
                  icon: BadgeCheck,
                  t: "Evidence over hype",
                  d: "Claims about products and treatments should be backed by evidence or clearly labelled as experience.",
                },
                {
                  icon: Hand,
                  t: "Respect across disciplines",
                  d: "Everyone here cares for hair and scalp in a different way. Disagree with the idea, never the person.",
                },
                {
                  icon: Mail,
                  t: "No selling in the conversation",
                  d: "Brands have their own place in member perks. Sponsored content is always labelled.",
                },
              ].map(({ icon: Icon, t, d }) => (
                <li key={t} className="flex gap-4 py-5">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5]" aria-hidden />
                  <div>
                    <p className="font-medium text-ink">{t}</p>
                    <p className="mt-1 text-[15px] text-ink-2">{d}</p>
                  </div>
                </li>
              ))}
              <li className="py-5 text-[15px] leading-relaxed text-ink-2">
                Posts are moderated by people, not only by software. Anyone can report a post, and reports are
                reviewed promptly. <Pill className="ml-1">Moderated</Pill>
              </li>
            </ul>
          </div>
        </Container>
      </Section>

      {/* Final CTA */}
      <section className="border-t border-rule bg-paper">
        <Container className="py-24 md:py-32">
          <div className="flex flex-col items-center gap-8 text-center">
            <h2 className="display max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
              Come and join
              <br />
              <span className="text-fade">the conversation.</span>
            </h2>
            <p className="lede max-w-xl">
              Founding members keep their founding price for as long as they stay. Founding places are
              limited.
            </p>
            <Button asChild size="xl">
              <Link href="/founding">
                Become a founding member <ArrowRight />
              </Link>
            </Button>
            <ArrowLink href="/pricing">Compare all plans</ArrowLink>
          </div>
        </Container>
      </section>

      <StickyJoin label="Join" note="Founding places are limited." href="/founding" />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "How the Trichollective community works",
            url: absoluteUrl("/community"),
            description: metadata.description,
          },
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Community", path: "/community" },
          ]),
        ]}
      />
    </>
  );
}
