import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArrowLink, Container, Pill, Section, SectionHeader } from "@/components/site/primitives";
import { Reveal } from "@/components/site/Reveal";
import { PageHero } from "@/components/editorial/PageHero";
import { SignupPanel } from "@/components/editorial/SignupPanel";
import { images, img } from "@/content/images";
import { guides } from "@/content/guides";
import { absoluteUrl, breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";

export const metadata = pageMetadata({
  title: "The Journal: selected pieces from Trichozette",
  description: `The public side of Trichozette, the monthly ${site.name} members' edition. Practical, carefully edited writing on hair and scalp care, free to read.`,
  path: "/journal",
    og: { title: "The Journal", sub: "Guides from Trichozette.", eyebrow: "Read", img: images.learning.src, variant: "photo" },
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Journal", path: "/journal" },
];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(iso)
  );
}

export default function JournalPage() {
  const pieces = guides
    .filter((g) => g.audience === "public")
    .slice()
    .sort((a, b) => (b.updated ?? b.published).localeCompare(a.updated ?? a.published));
  const [lead, ...rest] = pieces;

  return (
    <>
      <PageHero
        eyebrow="The Journal"
        title="Selected pieces"
        fade="from Trichozette."
        lede={
          <p>
            Trichozette is our monthly members&apos; edition: practical, carefully edited writing from
            people across cosmetic, clinical and medical hair care. A selection of pieces is published
            here, free for anyone to read.
          </p>
        }
        crumbs={crumbs}
      />

      {/* Lead piece */}
      {lead && (
        <Section className="pb-0 md:pb-0">
          <Container>
            <Link
              href={`/guides/${lead.slug}`}
              className="group grid overflow-hidden rounded-3xl border border-rule bg-card lg:grid-cols-12"
            >
              <div className="relative aspect-[4/3] overflow-hidden lg:col-span-7 lg:aspect-auto lg:min-h-[460px]">
                <Image
                  src={img(images.hairDetail, 1400)}
                  alt={images.hairDetail.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
              </div>
              <div className="flex flex-col gap-5 p-7 sm:p-10 lg:col-span-5 lg:justify-center">
                <div className="flex flex-wrap gap-2">
                  <Pill>{lead.category}</Pill>
                  <Pill>{lead.readingMinutes} minute read</Pill>
                </div>
                <h2 className="display text-4xl sm:text-5xl">{lead.title}</h2>
                <p className="text-[16px] leading-relaxed text-ink-2">{lead.intro}</p>
                <span className="mt-2 inline-flex items-center gap-2 text-[15px] font-medium">
                  Read the piece <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </Container>
        </Section>
      )}

      {/* The rest */}
      {rest.length > 0 && (
        <Section>
          <Container>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <SectionHeader eyebrow="Latest" title="More to read" />
              <ArrowLink href="/guides">All guides</ArrowLink>
            </div>
            <ul className="mt-10 grid gap-x-10 border-t border-rule md:grid-cols-2">
              {rest.map((g, i) => (
                <Reveal as="li" key={g.slug} delay={(i % 2) * 60} className="border-b border-rule">
                  <Link href={`/guides/${g.slug}`} className="group flex h-full flex-col gap-3 py-8">
                    <p className="label text-muted-foreground">{g.category}</p>
                    <h3 className="text-2xl font-semibold leading-snug tracking-tight group-hover:underline group-hover:decoration-ink/30 underline-offset-4">
                      {g.title}
                    </h3>
                    <p className="text-[15px] leading-relaxed text-ink-2 line-clamp-3">{g.description}</p>
                    <p className="mt-auto pt-2 text-[13px] text-muted-foreground">
                      {g.readingMinutes} minute read · {formatDate(g.updated ?? g.published)}
                    </p>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {/* About Trichozette */}
      <Section tone="paper-2">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHeader
                eyebrow="Trichozette"
                title="A monthly edition,"
                fade="for members."
              />
            </div>
            <div className="lg:col-span-7 prose-tricho">
              <p>
                Each month, members receive a new edition of Trichozette. It brings together
                practical techniques, conversations with practitioners, notes from the community&apos;s
                case rounds, and news from across Ireland and the UK.
              </p>
              <p>
                Pieces are drafted with the help of AI tools, then edited, checked and approved by{" "}
                {site.founder}, our founder, before anything is published. They are written to inform
                professionals and the public, and nothing in Trichozette or the Journal is medical
                advice.
              </p>
              <p>
                <Link href="/pricing">Membership</Link> includes every edition and the full archive.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Sign-up */}
      <Section>
        <Container>
          <SignupPanel
            eyebrow="The newsletter"
            title="New pieces, once a month."
            body="Sign up for our free monthly newsletter and we'll send you the pieces we publish here, plus news of events and courses."
            source="journal"
            cta="Subscribe"
          />
        </Container>
      </Section>

      <JsonLd
        data={[
          breadcrumbLd(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: `${site.name} Journal`,
            url: absoluteUrl("/journal"),
            description: "Selected pieces from Trichozette, the monthly members' edition.",
            publisher: { "@type": "Organization", name: site.name },
            blogPost: pieces.map((g) => ({
              "@type": "BlogPosting",
              headline: g.title,
              description: g.description,
              url: absoluteUrl(`/guides/${g.slug}`),
              datePublished: g.published,
              dateModified: g.updated ?? g.published,
            })),
          },
        ]}
      />
    </>
  );
}
