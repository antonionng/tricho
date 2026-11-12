import Link from "next/link";
import { MapPin, Mic, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/site/primitives";
import { PageHero } from "@/components/editorial/PageHero";
import { FeatureApplicationForm } from "@/components/site/FeatureApplicationForm";
import { images } from "@/content/images";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { auth } from "@/auth";
import { site } from "@/config/site";

export const metadata = pageMetadata({
  title: "Be featured on the podcast or Trichollective TV",
  description:
    "Members can apply to join the podcast or appear on Trichollective TV. Share your expertise, story or work, or propose a feature and record it from where you already work.",
  path: "/featured",
  og: {
    title: "Be featured on the podcast",
    sub: "or on Trichollective TV.",
    eyebrow: "Be featured",
    img: images.ed30.src,
    variant: "photo",
  },
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Be featured", path: "/featured" },
];

const ways = [
  {
    icon: Mic,
    t: "Be interviewed",
    d: "Tell us the expertise, story or work you'd like to share. We invite you on, ask the questions and look after the recording, so you can talk about the work itself.",
  },
  {
    icon: Video,
    t: "Lead the feature",
    d: "Propose your own feature and host it. You record from your salon, clinic or home and send it to us. The team does not need to travel to you.",
  },
  {
    icon: MapPin,
    t: "From where you already are",
    d: "A podcast conversation or a Trichollective TV feature can both be recorded on a phone where you work. You choose the format, or leave the choice with us.",
  },
];

export default async function FeaturedPage() {
  const session = await auth().catch(() => null);

  return (
    <>
      <PageHero
        eyebrow="Be featured"
        title="Share your work with the profession,"
        fade="on the podcast or Trichollective TV."
        lede={
          <p>
            Members can apply to be featured. Tell us what you would like to share, whether that is your
            expertise, a story from practice or a piece of work, and whether you would rather be interviewed
            or lead the feature yourself.
          </p>
        }
        image={images.ed30}
        imageClassName="mag-bw object-center"
        crumbs={crumbs}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg">
            <Link href="#apply">Apply to be featured</Link>
          </Button>
          <p className="text-sm text-muted-foreground">A real person reads every application.</p>
        </div>
      </PageHero>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="How it works"
            title="Join a conversation, or host one"
            fade="from wherever you practise."
          />
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-rule bg-rule md:grid-cols-3">
            {ways.map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex flex-col gap-4 bg-paper p-8 md:p-10">
                <Icon className="h-6 w-6 stroke-[1.25]" aria-hidden />
                <h3 className="display text-2xl">{t}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 max-w-2xl text-[15px] leading-relaxed text-ink-2">
            Guests share their own experience and stay within their scope of practice. Nothing on the
            podcast or Trichollective TV is medical advice. If you are not a member yet, you can still
            tell us about your work, or{" "}
            <Link href="/founding" className="text-ink underline underline-offset-4">
              look at founding membership
            </Link>{" "}
            first.
          </p>
        </Container>
      </Section>

      <Section tone="paper-2" id="apply">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="flex flex-col gap-6 lg:col-span-5">
              <SectionHeader
                eyebrow="Apply"
                title="Tell us what you'd like to share."
                fade="We'll reply within five working days."
                body={`Your note comes to the small team behind ${site.name}, led by ${site.founderFull}. If we invite you, we'll agree the shape of the feature by email before anything is recorded.`}
              />
              <ul className="flex flex-col divide-y divide-rule border-y border-rule">
                <li className="py-4 text-[15px] leading-relaxed text-ink-2">
                  <span className="font-medium text-ink">The podcast.</span> An unhurried conversation,
                  published with show notes and a full transcript.
                </li>
                <li className="py-4 text-[15px] leading-relaxed text-ink-2">
                  <span className="font-medium text-ink">Trichollective TV.</span> A short filmed feature.
                  You can record it where you work.
                </li>
                <li className="py-4 text-[15px] leading-relaxed text-ink-2">
                  <Link href="/podcast" className="font-medium text-ink underline underline-offset-4">
                    Hear the podcast
                  </Link>{" "}
                  while you decide what you would like to talk about.
                </li>
              </ul>
            </div>
            <div className="lg:col-span-7">
              <FeatureApplicationForm
                defaultName={session?.user?.name ?? ""}
                defaultEmail={session?.user?.email ?? ""}
                signedIn={!!session?.user}
              />
            </div>
          </div>
        </Container>
      </Section>

      <JsonLd data={breadcrumbLd(crumbs)} />
    </>
  );
}
