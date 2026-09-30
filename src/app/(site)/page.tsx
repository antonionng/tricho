import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  MessagesSquare,
  Mic,
  Newspaper,
  Search,
  Users,
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
import { StickyJoin } from "@/components/site/StickyJoin";
import { ProductPreview } from "@/components/site/ProductPreview";
import { FaqList } from "@/components/site/FaqList";
import { DirectorySearch } from "@/components/site/DirectorySearch";
import { images, img } from "@/content/images";
import { editions } from "@/content/gazette";
import { Cover } from "@/components/gazette/Cover";
import { ParallaxImage } from "@/components/gazette/Parallax";
import { coverImage } from "@/components/gazette/art";
import { gazetteFonts } from "@/components/gazette/fonts";
import { DISCIPLINES } from "@/content/disciplines";
import { courses } from "@/content/courses";
import { homeFaqs } from "@/content/faqs";
import { flagshipTier, subscriptionTiers, FREE_LISTING_DAYS } from "@/config/subscriptions";
import { getPublicStats, STAT_THRESHOLDS } from "@/lib/stats";
import { faqLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";

export const revalidate = 600;

export const metadata = pageMetadata({
  title: `${site.name}: the community for hair and scalp professionals`,
  description:
    "Join the community where cosmetic, clinical and medical hair professionals learn, refer and grow together. Courses, a public directory, gatherings and the monthly Trichozette.",
  path: "/",
    og: { title: "Join early.", sub: "Be in the founding directory.", eyebrow: "Cosmetic · Clinical · Medical", img: images.heroPortrait.src, variant: "photo" },
});

const pillars = [
  { icon: Users, label: "Founding directory", href: "/directory" },
  { icon: Newspaper, label: "Trichozette", href: "/trichozette" },
  { icon: Mic, label: "Podcast", href: "/podcast" },
  { icon: MessagesSquare, label: "Community", href: "/community" },
];

export default async function HomePage() {
  const stats = await getPublicStats();
  const proof = [
    stats.members >= STAT_THRESHOLDS.members && { value: stats.members, label: "members" },
    stats.listings >= STAT_THRESHOLDS.listings && { value: stats.listings, label: "professionals listed" },
    stats.cities >= STAT_THRESHOLDS.cities && { value: stats.cities, label: "cities" },
  ].filter(Boolean) as { value: number; label: string }[];

  return (
    <>
      {/* 1. Hero — the poster, made into a page */}
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute inset-y-0 right-0 hidden w-[52%] lg:block">
          <Image
            src={img(images.heroPortrait, 1600)}
            alt={images.heroPortrait.alt}
            fill
            priority
            sizes="52vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-paper to-transparent" />
        </div>

        <Container className="relative">
          <div className="grid min-h-[calc(100svh-72px)] items-center py-16 lg:grid-cols-12 lg:py-24">
            <div className="lg:col-span-7 xl:col-span-6 flex flex-col gap-8 animate-rise">
              <Eyebrow rule>Cosmetic · Clinical · Medical</Eyebrow>
              <h1 className="display text-[3.4rem] leading-[0.92] sm:text-7xl lg:text-[5.5rem]">
                Join early.
                <br />
                <span className="text-fade">Be in the founding directory.</span>
              </h1>
              <p className="lede max-w-xl">
                Trichollective is the community where head spa therapists, stylists, trichologists,
                nurses and doctors learn from each other and refer to each other, all year round.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="xl">
                  <Link href="/founding">
                    Become a founding member <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="xl" variant="outline">
                  <Link href="/directory/list">List free for {FREE_LISTING_DAYS} days</Link>
                </Button>
              </div>
              <div className="flex flex-col gap-1">
                <p className="label text-ink">Launching at {site.launch.title}, 5 October</p>
                <p className="label text-muted-foreground">Founding places are limited</p>
              </div>
            </div>
          </div>
        </Container>

        {/* Mobile hero image */}
        <div className="relative aspect-square w-full lg:hidden">
          <Image
            src={img(images.heroPortrait, 1000)}
            alt={images.heroPortrait.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_15%]"
          />
        </div>

        {/* Pillars row, as on the poster */}
        <div className="relative border-t border-rule bg-paper-2">
          <Container>
            <ul className="grid grid-cols-2 md:grid-cols-4">
              {pillars.map(({ icon: Icon, label, href }, i) => (
                <li
                  key={label}
                  className={`${i % 2 === 1 ? "border-l" : ""} ${i === 2 ? "md:border-l" : ""} ${
                    i >= 2 ? "border-t md:border-t-0" : ""
                  } border-rule`}
                >
                  <Link href={href} className="group flex flex-col items-center gap-4 py-8 md:py-10 transition-colors hover:bg-paper-3/60">
                    <Icon className="h-7 w-7 stroke-[1.25] transition-transform group-hover:-translate-y-0.5" aria-hidden />
                    <span className="label text-center text-ink">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </div>
      </section>

      {/* 2. Proof strip — live numbers only, and the origin story */}
      <section className="border-b border-rule">
        <Container>
          <div className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
            <p className="text-[15px] text-ink-2 max-w-xl">
              Trichollective began as a gathering at {site.originPlace}, where professionals from every
              side of hair and scalp care met to share what they know. Now it runs all year.
            </p>
            {proof.length > 0 && (
              <dl className="flex gap-10">
                {proof.map((p) => (
                  <div key={p.label}>
                    <dt className="label text-muted-foreground">{p.label}</dt>
                    <dd className="display text-4xl">{p.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </Container>
      </section>

      {/* 3. Three doors */}
      <Section>
        <Container>
          <SectionHeader
            eyebrow="Who it's for"
            title="One place for everyone"
            fade="who cares for hair."
            body="Choose the door that fits you. Each one leads somewhere useful, whether you practise, run a business or are looking for help yourself."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "I practise",
                body: "Head spa, styling, trichology, nursing or medicine. Join the community, learn, and be found by the clients who need you.",
                href: "/pricing",
                cta: "See membership",
                image: images.salon,
              },
              {
                title: "I run a clinic or brand",
                body: "Reach a specialist audience that trusts each other's recommendations, and hire from the people who care most.",
                href: "/for-business",
                cta: "Business membership",
                image: images.products,
              },
              {
                title: "I'm looking for help",
                body: "Not sure whether you need a head spa, a trichologist or a doctor? Answer three questions and we'll point you the right way.",
                href: "/find",
                cta: "Find a professional",
                image: images.hairDetail,
              },
            ].map((door, i) => (
              <Reveal key={door.title} delay={i * 80}>
                <Link
                  href={door.href}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-rule bg-card transition-shadow hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={img(door.image, 900)}
                      alt={door.image.alt}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-7">
                    <h3 className="display text-3xl">{door.title}</h3>
                    <p className="text-[15px] leading-relaxed text-ink-2">{door.body}</p>
                    <span className="mt-auto pt-4 inline-flex items-center gap-2 text-[15px] font-medium">
                      {door.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* 4. What members get — real product */}
      <Section tone="paper-2">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5 flex flex-col gap-8">
              <SectionHeader
                eyebrow="Every month, as a member"
                title="Something new"
                fade="every week."
                body="Membership isn't a login you forget about. Each month brings a new edition of Trichozette, a podcast episode, a live masterclass and a community that keeps the conversation going between gatherings."
              />
              <ul className="flex flex-col divide-y divide-rule border-y border-rule">
                {[
                  { icon: MessagesSquare, t: "The community", d: "Spaces for every part of the field, your local chapter and direct messages." },
                  { icon: Newspaper, t: "Trichozette", d: "A monthly edition of practical, well-edited pieces from members and experts." },
                  { icon: CalendarDays, t: "Live masterclasses", d: "One a month, recorded, so you can watch when your diary allows." },
                  { icon: BookOpen, t: "Courses and certificates", d: "Short courses with certificates anyone can check online." },
                  { icon: Search, t: "The directory and referrals", d: "Be found by the public and pass clients to the right colleague." },
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
              <ArrowLink href="/community">Take the tour of the community</ArrowLink>
            </div>
            <div className="lg:col-span-7">
              <Reveal>
                <ProductPreview />
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* 5. The three disciplines */}
      <Section>
        <Container>
          <SectionHeader
            eyebrow="Why it works"
            title="Three disciplines."
            fade="One conversation."
            body="Most platforms serve one kind of professional. Trichollective brings cosmetic, clinical and medical practice together, so a client can be passed to the right person at the right time."
          />
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-rule bg-rule md:grid-cols-3">
            {DISCIPLINES.map((d) => (
              <div key={d.id} className="flex flex-col gap-5 bg-paper p-8 md:p-10">
                <p className="label text-muted-foreground">{d.name}</p>
                <p className="display text-2xl leading-tight">{d.who}</p>
                <p className="text-[15px] leading-relaxed text-ink-2">{d.role}</p>
                <Link
                  href={`/directory/${d.slug}`}
                  className="mt-auto inline-flex items-center gap-2 text-[15px] font-medium"
                >
                  Find {d.name.toLowerCase()} professionals <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Trichozette: the magazine, in its own editorial register */}
      <section className={`mag relative overflow-hidden bg-[#0a0a0a] text-white ${gazetteFonts}`}>
        <ParallaxImage
          src={img(coverImage(editions[0]), 2000)}
          alt=""
          className="absolute inset-0 h-full opacity-40"
          strength={0.14}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/30" />
        <Container className="relative py-24 md:py-32">
          <div className="grid items-center gap-16 lg:grid-cols-12">
            <div className="lg:col-span-6 flex flex-col gap-7">
              <p className="mag-caps text-[10px] text-white/60">The magazine</p>
              <h2 className="mag-didone text-[11.5vw] font-medium uppercase leading-[0.85] tracking-[-0.02em] lg:text-[5.4vw]">
                Trichozette
              </h2>
              <p className="mag-didone max-w-lg text-[26px] italic leading-[1.25] text-white/85">
                Editorial features, real news and three perspectives on every story, from the chair, the clinic
                and the consulting room.
              </p>
              <p className="mag-serif max-w-lg text-[17px] leading-[1.65] text-white/70">
                Every edition mixes long reads with quizzes, checklists and questions to test yourself on. Read the
                opening features of any edition free; members read everything.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Button asChild size="lg" variant="paper">
                  <Link href={`/trichozette/${editions[0].slug}`}>
                    Read the latest edition <ArrowRight />
                  </Link>
                </Button>
                <Link href="/trichozette" className="mag-caps text-[10px] text-white/80 underline underline-offset-4">
                  All {editions.length} editions
                </Link>
              </div>
            </div>
            <div className="lg:col-span-6">
              <ul className="grid grid-cols-3 gap-4 lg:gap-5">
                {editions.slice(0, 3).map((e, i) => (
                  <Reveal as="li" key={e.slug} delay={i * 90} className={i === 1 ? "lg:-translate-y-10" : i === 2 ? "lg:translate-y-6" : ""}>
                    <Link href={`/trichozette/${e.slug}`} className="group block">
                      <div className="transition-transform duration-700 group-hover:-translate-y-2">
                        <Cover edition={e} className="shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]" sizes="(min-width:1024px) 16vw, 30vw" />
                      </div>
                      <p className="mag-caps mt-4 text-[9px] text-white/55">{e.theme}</p>
                    </Link>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. Courses */}
      <Section tone="paper-2">
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeader
              eyebrow="Learn"
              title="Courses that make"
              fade="Monday easier."
              body="Short, practical courses written and reviewed by practitioners, each with a certificate at the end."
            />
            <ArrowLink href="/learn">All courses</ArrowLink>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {courses.slice(0, 3).map((c, i) => (
              <Reveal key={c.slug} delay={i * 80}>
                <Link
                  href={`/courses/${c.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-rule bg-card"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={img(images[c.imageKey], 800)}
                      alt={images[c.imageKey].alt}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <div className="flex flex-wrap gap-2">
                      <Pill>{c.hours} hours</Pill>
                      {c.status === "coming-soon" && <Pill>Opening soon</Pill>}
                    </div>
                    <h3 className="text-xl font-semibold leading-snug tracking-tight">{c.title}</h3>
                    <p className="text-[15px] text-ink-2">{c.summary}</p>
                    <p className="mt-auto pt-3 text-sm text-muted-foreground">
                      {c.memberPriceGBP === 0 ? "Free for members" : `£${c.memberPriceGBP} for members`} · £
                      {c.priceGBP} otherwise
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* 7. Directory search */}
      <Section>
        <Container size="narrow">
          <div className="flex flex-col items-center gap-8 text-center">
            <SectionHeader
              align="center"
              eyebrow="The founding directory"
              title="Find the right person"
              fade="near you."
              body="Search cosmetic, clinical and medical professionals across Ireland and the UK. Every listing is reviewed by a person before it goes live."
            />
            <DirectorySearch />
            <p className="text-sm text-muted-foreground">
              Are you a professional?{" "}
              <Link href="/directory/list" className="underline underline-offset-4 text-ink">
                Add your founding listing, free for {FREE_LISTING_DAYS} days
              </Link>
            </p>
          </div>
        </Container>
      </Section>

      {/* 8. Gatherings */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="absolute inset-0 opacity-40">
          <Image src={img(images.gathering, 1800)} alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
        <Container className="relative py-24 md:py-32">
          <div className="max-w-2xl flex flex-col gap-7">
            <Eyebrow rule className="text-paper">Gatherings</Eyebrow>
            <h2 className="display text-5xl md:text-6xl">
              It started in a room.
              <br />
              <span className="opacity-60">It still does.</span>
            </h2>
            <p className="text-lg leading-relaxed text-paper/80">
              Trichollective began with professionals meeting in person at {site.originPlace}. The gatherings
              are still the heart of it: talks from members, new techniques and technology up close, and
              faces put to names. Members hear about each one first.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={site.launch.ticketUrl}
                target="_blank"
                rel="noopener"
                className="group flex flex-col gap-2 rounded-2xl border border-paper/20 bg-paper/5 p-5 backdrop-blur transition-colors hover:border-paper/50"
              >
                <span className="label text-paper/60">Launch · Monday 5 October</span>
                <span className="text-xl font-semibold">{site.launch.title}</span>
                <span className="text-sm text-paper/70">{site.launch.venue}. 9.30am to 6pm.</span>
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium">
                  Get tickets on Eventbrite <ArrowUpRight className="h-4 w-4" />
                </span>
              </a>
              <div className="flex flex-col gap-2 rounded-2xl border border-paper/10 p-5">
                <span className="label text-paper/60">Next</span>
                <span className="text-xl font-semibold">{site.next.city}</span>
                <span className="text-sm text-paper/70">{site.next.status}. Members will hear first.</span>
              </div>
            </div>
            <div>
              <Button asChild size="lg" variant="paper">
                <Link href="/events">
                  All events <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* 9. Pricing teaser */}
      <Section tone="paper-2">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHeader
                eyebrow="Membership"
                title="Simple plans."
                fade="Cancel anytime."
                body={`Start with a free founding listing for ${FREE_LISTING_DAYS} days, or join the community from £${subscriptionTiers[0].price} a month. Founding members keep their founding price for as long as they stay.`}
              />
            </div>
            <div className="lg:col-span-7 grid gap-4 sm:grid-cols-3">
              {subscriptionTiers.map((t) => (
                <Link
                  key={t.id}
                  href={`/pricing#${t.id}`}
                  className={`flex flex-col gap-3 rounded-3xl border p-6 transition-colors ${
                    t.id === flagshipTier.id ? "border-ink bg-ink text-paper" : "border-rule bg-card hover:border-ink/40"
                  }`}
                >
                  <p className="label opacity-70">{t.name}</p>
                  <p className="display text-4xl">
                    £{t.foundingPrice ?? t.price}
                    <span className="text-base font-normal opacity-60">/mo</span>
                  </p>
                  {t.foundingPrice && (
                    <p className="text-xs opacity-70">Founding price. £{t.price} after founding places go.</p>
                  )}
                  <p className="text-sm opacity-80">{t.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* 10. FAQ */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeader eyebrow="Questions" title="Good to know" />
            </div>
            <div className="lg:col-span-8">
              <FaqList faqs={homeFaqs} />
            </div>
          </div>
        </Container>
      </Section>

      {/* 11. Final call to action */}
      <section className="border-t border-rule bg-paper">
        <Container className="py-24 md:py-32">
          <div className="flex flex-col items-center gap-8 text-center">
            <h2 className="display text-5xl sm:text-6xl lg:text-7xl max-w-4xl">
              A stronger hair industry,
              <br />
              <span className="text-fade">together.</span>
            </h2>
            <p className="lede max-w-xl">
              Join now and you&apos;ll be part of the founding group that shapes what Trichollective
              becomes.
            </p>
            <Button asChild size="xl">
              <Link href="/founding">
                Become a founding member <ArrowRight />
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      <StickyJoin label="Join" note="Founding places are limited." href="/founding" />
      <JsonLd data={faqLd(homeFaqs)} />
    </>
  );
}
