import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/site/primitives";
import { Reveal } from "@/components/site/Reveal";
import { PageHero } from "@/components/editorial/PageHero";
import { images, img } from "@/content/images";
import { CHAPTERS } from "@/content/chapters";
import { absoluteUrl, breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";

export const metadata = pageMetadata({
  title: "Chapters in Ireland, the UK, Europe and the United States",
  description: `Every ${site.name} member belongs to a country chapter: Ireland, England, Scotland, Wales, Europe or the United States. Find hair and scalp professionals near you to refer to and learn from.`,
  path: "/chapters",
    og: { title: "Find colleagues to refer to in your own country,", sub: "online and at local meetups.", eyebrow: "Community", img: images.dublin.src, variant: "photo" },
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Chapters", path: "/chapters" },
];

export default function ChaptersPage() {
  const countries = ["Ireland and Northern Ireland", "United Kingdom", "International"] as const;

  return (
    <>
      <PageHero
        eyebrow="Chapters"
        title="Find colleagues to refer to in your own country,"
        fade="online and at local meetups."
        lede={
          <p>
            When you join, you choose a chapter for Ireland, England, Scotland, Wales, Europe or the United
            States. It&apos;s where you meet the practitioners who work near you, hear about meetups and find
            the colleagues you&apos;ll refer clients to.
          </p>
        }
        image={images.community}
        crumbs={crumbs}
      />

      {countries.map((country, ci) => {
        const list = CHAPTERS.filter((c) => c.country === country);
        if (list.length === 0) return null;
        return (
          <Section key={country} tone={ci % 2 === 0 ? "paper" : "paper-2"}>
            <Container>
              <SectionHeader eyebrow={country} title={country === "United Kingdom" ? "Find colleagues to refer to across England, Scotland and Wales." : country === "International" ? "Connect with practitioners across Europe and the United States." : "Build your referral network across the whole island of Ireland."} />
              <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((c, i) => {
                  const image = c.imageKey ? images[c.imageKey] : null;
                  return (
                    <Reveal key={c.slug} delay={i * 60}>
                      <Link
                        href={`/chapters/${c.slug}`}
                        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-rule bg-card transition-shadow hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]"
                      >
                        {image ? (
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <Image
                              src={img(image, 800)}
                              alt={image.alt}
                              fill
                              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                              className="mag-bw object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                            />
                          </div>
                        ) : (
                          <div className="flex aspect-[4/3] items-end bg-paper-2 p-7">
                            <p className="display text-6xl text-fade">{c.city}</p>
                          </div>
                        )}
                        <div className="flex flex-1 flex-col gap-3 p-7">
                          <p className="label text-muted-foreground">{c.country}</p>
                          <h3 className="display text-3xl">{c.city}</h3>
                          <p className="text-[15px] leading-relaxed text-ink-2">{c.blurb}</p>
                          <span className="mt-auto pt-3 inline-flex items-center gap-2 text-[15px] font-medium">
                            Visit the chapter{" "}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            </Container>
          </Section>
        );
      })}

      <section className="border-t border-rule bg-paper">
        <Container className="py-24 md:py-28">
          <div className="flex flex-col items-center gap-8 text-center">
            <h2 className="display text-5xl sm:text-6xl max-w-3xl">
              If you practise somewhere else,
              <br />
              <span className="text-fade">join the nearest chapter and tell us where.</span>
            </h2>
            <p className="lede max-w-xl">
              New chapters open when enough members in a place ask for one. Choose the closest chapter
              when you join and tell us where you practise, and we&apos;ll let you know when yours opens.
            </p>
            <Button asChild size="xl">
              <Link href="/pricing">
                Join a chapter <ArrowRight />
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      <JsonLd
        data={[
          breadcrumbLd(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${site.name} local chapters`,
            itemListElement: CHAPTERS.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: absoluteUrl(`/chapters/${c.slug}`),
              name: `${c.city} chapter`,
            })),
          },
        ]}
      />
    </>
  );
}
