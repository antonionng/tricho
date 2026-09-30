import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLink, Container, Eyebrow, Section, SectionHeader } from "@/components/site/primitives";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { images, img } from "@/content/images";
import { tierById } from "@/config/subscriptions";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";

const business = tierById("business")!;

export const metadata = pageMetadata({
  title: `Jobs in hair and scalp care`,
  description:
    "Roles at clinics, salons, head spas and brands across Ireland and the UK, posted by Trichollective Business members. Hire from people who already care about scalp health.",
  path: "/jobs",
    og: { title: "Jobs in hair and scalp care", eyebrow: "Careers", img: images.salon.src, variant: "photo" },
});

export default function JobsPage() {
  return (
    <>
      <Section className="pb-12 md:pb-16">
        <Container>
          <div className="flex flex-col gap-8 animate-rise">
            <Eyebrow rule>Jobs</Eyebrow>
            <h1 className="display max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
              Work with people
              <br />
              <span className="text-fade">who care about hair.</span>
            </h1>
            <p className="lede max-w-2xl">
              Roles at clinics, salons, head spas and brands across Ireland and the UK, posted by
              Trichollective Business members.
            </p>
          </div>
        </Container>
      </Section>

      {/* Honest board state */}
      <section className="pb-20 md:pb-28">
        <Container>
          <div className="flex flex-col items-center gap-5 rounded-3xl border border-dashed border-rule bg-card px-6 py-16 text-center md:py-20">
            <Briefcase className="h-7 w-7 stroke-[1.25]" aria-hidden />
            <h2 className="text-2xl font-semibold tracking-tight">No roles are listed yet</h2>
            <p className="max-w-lg text-[15px] leading-relaxed text-ink-2">
              The jobs board opens with Trichollective online. Roles posted by Business members will appear
              here as soon as they are published. Leave your email below and we&apos;ll let you know when the
              first ones go up.
            </p>
          </div>
        </Container>
      </section>

      {/* Two sides */}
      <Section tone="paper-2">
        <Container>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-6 overflow-hidden rounded-3xl border border-ink bg-ink text-paper">
              <div className="relative aspect-[16/9]">
                <Image
                  src={img(images.salon, 1000)}
                  alt={images.salon.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover opacity-90"
                />
              </div>
              <div className="flex flex-1 flex-col gap-5 p-7 pt-0 md:p-10 md:pt-2">
                <p className="label text-paper/60">For employers</p>
                <h2 className="display text-4xl">Post a job.</h2>
                <p className="text-[15px] leading-relaxed text-paper/80">
                  Job posts are included with Business membership, along with a business page, five
                  Professional seats for your team and a listing in member perks. Your roles are seen by
                  head spa therapists, stylists, trichologists, nurses and doctors who are already part of
                  the community.
                </p>
                <p className="text-sm text-paper/60">
                  £{business.price} a month, or £{business.annualPrice} a year. Cancel anytime.
                </p>
                <div className="mt-auto pt-2">
                  <Button asChild size="lg" variant="paper">
                    <Link href="/for-business">
                      See Business membership <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 overflow-hidden rounded-3xl border border-rule bg-card">
              <div className="relative aspect-[16/9]">
                <Image
                  src={img(images.headSpa, 1000)}
                  alt={images.headSpa.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-5 p-7 pt-0 md:p-10 md:pt-2">
                <p className="label text-muted-foreground">For candidates</p>
                <h2 className="display text-4xl">Hear about roles first.</h2>
                <p className="text-[15px] leading-relaxed text-ink-2">
                  Join the newsletter and we&apos;ll tell you when new roles are posted, along with news from
                  the community and the next gathering. You can unsubscribe at any time.
                </p>
                <div className="mt-auto pt-2">
                  <NewsletterForm source="jobs" cta="Notify me" />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeader
              eyebrow="While you wait"
              title="Build the skills"
              fade="employers look for."
              body="Short courses written by practitioners, each with a certificate anyone can check online."
            />
            <div className="flex flex-col gap-3">
              <ArrowLink href="/learn">Browse courses</ArrowLink>
              <ArrowLink href="/certification">About certification</ArrowLink>
            </div>
          </div>
        </Container>
      </Section>

      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Jobs", path: "/jobs" },
        ])}
      />
    </>
  );
}
