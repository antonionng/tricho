import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Lightbulb, Lock, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow, Section, SectionHeader } from "@/components/site/primitives";
import { Reveal } from "@/components/site/Reveal";
import { FaqList } from "@/components/site/FaqList";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { StickyJoin } from "@/components/site/StickyJoin";
import { CheckoutButton } from "@/components/site/CheckoutButton";
import { images, img } from "@/content/images";
import type { Faq } from "@/content/faqs";
import { FREE_LISTING_DAYS, freeListing, subscriptionTiers } from "@/config/subscriptions";
import { breadcrumbLd, faqLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";

export const metadata = pageMetadata({
  title: `Founding membership`,
  description: `Join Trichollective early and keep the founding price for as long as you stay. A founding badge, a live welcome session with ${site.founder} and a say in what we build first. Founding places are limited.`,
  path: "/founding",
    og: { title: "Join early, and keep your founding price", sub: "for as long as you stay.", eyebrow: "Founding membership", img: images.heroPortrait.src, variant: "photo" },
});

const foundingTiers = subscriptionTiers.filter((t) => t.foundingPrice);

const benefits = [
  {
    icon: Lock,
    t: "The founding price, for as long as you stay",
    d: "The price you join at is the price you keep, for as long as you stay a member. When the founding places are gone, new members pay the standard price.",
  },
  {
    icon: BadgeCheck,
    t: "The founding badge",
    d: "A mark on your profile and directory listing that tells colleagues and clients you were here from the start.",
  },
  {
    icon: Video,
    t: `A live welcome session with ${site.founder}`,
    d: "Meet the founder and the other founding members online, put faces to the names you will refer to, and ask anything you like.",
  },
  {
    icon: Lightbulb,
    t: "A say in what we build first",
    d: "Founding members vote on which courses, spaces and features come next, so the platform fits the way you actually practise.",
  },
];

const foundingFaqs: Faq[] = [
  {
    q: "How long does the founding price last?",
    a: "For as long as you stay a member. If you cancel and come back later, you would join at the standard price at that time.",
  },
  {
    q: "How many founding places are there?",
    a: "Founding places are limited, and the offer closes at the end of the founding period. When it closes, the standard price applies to new members.",
  },
  {
    q: "Do I need an account before I pay?",
    a: "No. Choose a plan and pay with your email address. Your account is created from that email, and you sign in with it afterwards.",
  },
  {
    q: "I'm not sure yet. Can I try it for free?",
    a: `You can add a free founding listing to the directory for ${FREE_LISTING_DAYS} days, or join the newsletter below to hear how things are going. If you join and it isn't right for you, email us within 14 days of your first payment for a full refund.`,
  },
  {
    q: "Is this the same as the Facebook group?",
    a: "No. The group stays as it is. Trichollective is a separate, private community for professionals, where you get peer review in the Case Room, a directory listing, courses with a CPD log, Trichozette and live sessions in one place.",
  },
];

export default function FoundingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute inset-y-0 right-0 hidden w-[50%] lg:block">
          <Image
            src={img(images.headSpa, 1600)}
            alt={images.headSpa.alt}
            fill
            priority
            sizes="50vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-paper to-transparent" />
        </div>

        <Container className="relative">
          <div className="grid min-h-[calc(100svh-72px)] items-center py-16 lg:grid-cols-12 lg:py-24">
            <div className="flex flex-col gap-8 animate-rise lg:col-span-7 xl:col-span-6">
              <Eyebrow rule>Founding membership</Eyebrow>
              <h1 className="display text-[3.4rem] leading-[0.92] sm:text-7xl lg:text-[5.5rem]">
                Join early and keep
                <br />
                <span className="text-fade">your founding price for as long as you stay.</span>
              </h1>
              <p className="lede max-w-xl">
                Trichollective launches online at {site.launch.title} on 5 October. Join now to be in the
                founding directory, bring cases to colleagues from day one and vote on what we build first.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="xl">
                  <Link href="#plans">
                    See founding plans <ArrowRight />
                  </Link>
                </Button>
              </div>
              <div className="flex flex-col gap-1">
                <p className="label text-ink">From £{foundingTiers[0]?.foundingPrice} a month</p>
                <p className="label text-muted-foreground">Founding places are limited</p>
              </div>
            </div>
          </div>
        </Container>

        <div className="relative aspect-[4/5] w-full lg:hidden">
          <Image
            src={img(images.headSpa, 1000)}
            alt={images.headSpa.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* Note for the head spa group */}
      <section className="border-y border-rule">
        <Container>
          <p className="max-w-3xl py-8 text-[15px] leading-relaxed text-ink-2">
            If you have come from the head spa group, welcome. Trichollective grew out of {site.founder}
            &apos;s gatherings, which began at {site.originPlace}, where head spa therapists, stylists,
            trichologists, nurses and doctors met to share what they know. Now you can ask those same
            colleagues a question on any day of the year, in one private place.
          </p>
        </Container>
      </section>

      {/* What founding members get */}
      <Section>
        <Container>
          <SectionHeader
            eyebrow="What founding members get"
            title="Join first and you pay less, for as long as you stay,"
            fade="and help decide what we build next."
            body="Every member gets the community, Trichozette, live masterclasses and member prices. Founding members also get these."
          />
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-rule bg-rule sm:grid-cols-2">
            {benefits.map(({ icon: Icon, t, d }, i) => (
              <Reveal key={t} delay={i * 60} className="h-full">
                <div className="flex h-full flex-col gap-4 bg-paper p-8 md:p-10">
                  <Icon className="h-6 w-6 stroke-[1.25]" aria-hidden />
                  <h3 className="display text-2xl leading-tight">{t}</h3>
                  <p className="text-[15px] leading-relaxed text-ink-2">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Plans */}
      <Section tone="paper-2" id="plans">
        <Container>
          <SectionHeader
            eyebrow="Founding plans"
            title="Choose your plan now and keep the founding price"
            fade="for as long as you remain a member."
            body="Pay by card through Stripe. You don't need an account first: we create it from the email you pay with. Cancel anytime."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {foundingTiers.map((t) => {
              const dark = !!t.featured;
              return (
                <article
                  key={t.id}
                  id={t.id}
                  className={`flex scroll-mt-28 flex-col gap-6 rounded-3xl border p-7 md:p-9 ${
                    dark ? "border-ink bg-ink text-paper" : "border-rule bg-card"
                  }`}
                >
                  <header className="flex flex-col gap-3">
                    <p className={`label ${dark ? "text-paper/70" : "text-muted-foreground"}`}>{t.name}</p>
                    <p className="display text-6xl">
                      £{t.foundingPrice}
                      <span className="text-base font-normal opacity-60">/mo</span>
                    </p>
                    <p className={`text-sm ${dark ? "text-paper/70" : "text-muted-foreground"}`}>
                      Founding price. <s aria-label={`Standard price £${t.price} a month`}>£{t.price}</s> for
                      members who join later.
                    </p>
                  </header>
                  <p className={`text-[15px] leading-relaxed ${dark ? "text-paper/80" : "text-ink-2"}`}>
                    {t.summary}
                  </p>
                  <ul className="flex flex-col gap-2.5 text-[15px]">
                    {t.features.map((f) => (
                      <li key={f} className="flex gap-3">
                        <span className="mt-2.5 h-px w-3 shrink-0 bg-current opacity-60" aria-hidden />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-2">
                    <CheckoutButton
                      plan={t.id}
                      founding
                      size="xl"
                      variant={dark ? "paper" : "outline"}
                      errorTone={dark ? "ink" : "paper"}
                      className="w-full"
                    >
                      Join {t.name} at £{t.foundingPrice}
                    </CheckoutButton>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Running a clinic, salon or brand? See{" "}
            <Link href="/for-business" className="text-ink underline underline-offset-4">
              Business membership
            </Link>
            . Want to compare every plan?{" "}
            <Link href="/pricing" className="text-ink underline underline-offset-4">
              See full pricing
            </Link>
            .
          </p>
        </Container>
      </Section>

      {/* Free listing alternative */}
      <Section>
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl lg:col-span-6">
              <Image
                src={img(images.clinic, 1200)}
                alt={images.clinic.alt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-7 lg:col-span-6">
              <SectionHeader
                eyebrow="Not ready to join?"
                title={`Be found by the public free for ${FREE_LISTING_DAYS} days,`}
                fade="and decide about membership later."
                body={freeListing.summary}
              />
              <ul className="flex flex-col divide-y divide-rule border-y border-rule text-[15px]">
                {freeListing.features.map((f) => (
                  <li key={f} className="py-4 text-ink-2">
                    {f}
                  </li>
                ))}
              </ul>
              <div>
                <Button asChild size="lg" variant="outline">
                  <Link href="/directory/list">
                    Add your founding listing <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section tone="paper-2">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeader eyebrow="Questions" title="Know exactly how the founding price works before you join." />
            </div>
            <div className="lg:col-span-8">
              <FaqList faqs={foundingFaqs} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Undecided */}
      <Section>
        <Container size="narrow">
          <div className="flex flex-col items-center gap-8 text-center">
            <SectionHeader
              align="center"
              eyebrow="Still deciding"
              title="See what members are discussing each month"
              fade="before you decide to join."
              body="Leave your email and we'll send the monthly newsletter, with news from the community and dates for the next masterclass and conference. You can unsubscribe at any time."
            />
            <NewsletterForm source="founding" className="max-w-md" />
          </div>
        </Container>
      </Section>

      <StickyJoin label="Join" note="Founding places are limited." href="#plans" />
      <JsonLd
        data={[
          faqLd(foundingFaqs),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Founding membership", path: "/founding" },
          ]),
        ]}
      />
    </>
  );
}
