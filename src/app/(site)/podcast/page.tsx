import { FileText, Headphones, Mic } from "lucide-react";
import { ArrowLink, Container, Section, SectionHeader } from "@/components/site/primitives";
import { PageHero } from "@/components/editorial/PageHero";
import { SignupPanel } from "@/components/editorial/SignupPanel";
import { images } from "@/content/images";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";

export const metadata = pageMetadata({
  title: "The podcast: conversations from the community",
  description: `A monthly podcast from ${site.name}. Unhurried conversations with head spa therapists, stylists, trichologists, nurses and doctors, each with a full transcript.`,
  path: "/podcast",
    og: { title: "The podcast", sub: "Conversations from the community.", eyebrow: "Listen", img: images.community.src, variant: "photo" },
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Podcast", path: "/podcast" },
];

export default function PodcastPage() {
  return (
    <>
      <PageHero
        eyebrow="The podcast"
        title="Conversations"
        fade="from the community."
        lede={
          <p>
            Once a month, we sit down with someone who works in hair and scalp care and talk about what
            they&apos;ve learned: how they practise, what they wish they&apos;d known sooner, and when
            they pass a client to a colleague.
          </p>
        }
        image={images.portraitA}
        crumbs={crumbs}
      />

      {/* Empty state */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHeader
                eyebrow="Episodes"
                title="The first episode"
                fade="is on its way."
                body="We're recording our first conversations now. When the first episode is ready, it will appear here with a full transcript."
              />
            </div>
            <div className="lg:col-span-7">
              <SignupPanel
                eyebrow="Hear it first"
                title="Get the first episode in your inbox."
                body="Leave your email and we'll send you the first episode as soon as it's published, followed by our monthly newsletter."
                source="podcast"
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* What to expect */}
      <Section tone="paper-2">
        <Container>
          <SectionHeader
            eyebrow="What to expect"
            title="Unhurried, practical"
            fade="and easy to follow."
          />
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-rule bg-rule md:grid-cols-3">
            {[
              {
                icon: Mic,
                t: "Every side of the field",
                d: "Guests come from cosmetic, clinical and medical practice, so you hear how each discipline sees the same client.",
              },
              {
                icon: Headphones,
                t: "Once a month",
                d: "A new episode each month, short enough for a commute and long enough to go beyond the basics.",
              },
              {
                icon: FileText,
                t: "Full transcripts",
                d: "Every episode comes with a transcript, so you can read instead of listen and find a moment again quickly.",
              },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex flex-col gap-4 bg-paper p-8 md:p-10">
                <Icon className="h-6 w-6 stroke-[1.25]" aria-hidden />
                <h3 className="display text-2xl">{t}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 max-w-2xl text-[15px] leading-relaxed text-ink-2">
            Our guests share their own experience. Nothing on the podcast is medical advice, and if you
            are worried about your hair or scalp, please speak to your GP or a qualified practitioner.
          </p>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeader
              eyebrow="In the meantime"
              title="Something to read"
              fade="while you wait."
              body="Selected pieces from Trichozette, our monthly members' edition, are free to read in the Journal."
            />
            <ArrowLink href="/journal">Visit the Journal</ArrowLink>
          </div>
        </Container>
      </Section>

      <JsonLd data={breadcrumbLd(crumbs)} />
    </>
  );
}
