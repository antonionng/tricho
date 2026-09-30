import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ListChecks, Users } from "lucide-react";
import { Container, Section } from "@/components/site/primitives";
import { CheckoutButton } from "@/components/site/CheckoutButton";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { RememberSource } from "@/components/site/SourceCapture";
import { Button } from "@/components/ui/button";
import { images, img, type BrandImage } from "@/content/images";
import { FREE_LISTING_DAYS, tierById } from "@/config/subscriptions";

/** Shared layout for campaign landing pages (the Dublin QR code, the Instagram link). */
export function LaunchLanding({
  source,
  eyebrow,
  title,
  fade,
  lede,
  image = images.ed02,
  details,
  editionHref = "/trichozette/dublin",
}: {
  source: string;
  eyebrow: string;
  title: string;
  fade: string;
  lede: string;
  image?: BrandImage;
  details?: React.ReactNode;
  editionHref?: string;
}) {
  const pro = tierById("professional")!;
  const community = tierById("community")!;

  return (
    <>
      <RememberSource value={source} />
      <section className="relative overflow-hidden bg-ink text-paper">
        <Image src={img(image, 2000)} alt={image.alt} fill priority sizes="100vw" className="mag-bw object-cover object-top opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/20" />
        <Container className="relative">
          <div className="flex min-h-[78svh] max-w-2xl flex-col justify-end gap-7 py-16 md:py-24">
            <p className="label text-paper/70">{eyebrow}</p>
            <h1 className="display text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
              {title}
              <br />
              <span className="opacity-60">{fade}</span>
            </h1>
            <p className="text-lg leading-relaxed text-paper/80">{lede}</p>
            {details}
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <p className="label text-muted-foreground">Three things you can do in the next two minutes</p>
          <ol className="mt-10 grid gap-5 lg:grid-cols-3">
            <li className="flex flex-col gap-4 rounded-3xl border border-rule bg-card p-7">
              <ListChecks className="h-6 w-6 stroke-[1.5]" />
              <p className="display text-2xl leading-tight">
                Add your practice to the founding directory, free for {FREE_LISTING_DAYS} days.
              </p>
              <p className="text-[15px] leading-relaxed text-ink-2">
                People looking for a head spa therapist, stylist, trichologist or doctor will be able to find you,
                and you keep the founding badge if you stay.
              </p>
              <Button asChild className="mt-auto self-start">
                <Link href="/directory/list">
                  Add my free listing <ArrowRight />
                </Link>
              </Button>
            </li>
            <li className="flex flex-col gap-4 rounded-3xl bg-ink p-7 text-paper">
              <Users className="h-6 w-6 stroke-[1.5]" />
              <p className="display text-2xl leading-tight">
                Become a founding member and keep your founding price for as long as you stay.
              </p>
              <p className="text-[15px] leading-relaxed text-paper/75">
                Professional is £{pro.foundingPrice} a month instead of £{pro.price}, and Community is £
                {community.foundingPrice} instead of £{community.price}. You can cancel at any time.
              </p>
              <div className="mt-auto flex flex-col gap-3">
                <CheckoutButton plan="professional" founding variant="paper" errorTone="ink">
                  Professional at £{pro.foundingPrice} a month
                </CheckoutButton>
                <CheckoutButton plan="community" founding variant="outline" className="border-paper/30 text-paper hover:border-paper" errorTone="ink">
                  Community at £{community.foundingPrice} a month
                </CheckoutButton>
              </div>
            </li>
            <li className="flex flex-col gap-4 rounded-3xl border border-rule bg-card p-7">
              <BookOpen className="h-6 w-6 stroke-[1.5]" />
              <p className="display text-2xl leading-tight">Read Trichozette, the magazine written for people who work with hair and scalp.</p>
              <p className="text-[15px] leading-relaxed text-ink-2">
                The opening pages of every edition are free, including four years of looking back at what changed in
                cosmetic, clinical and medical practice.
              </p>
              <Button asChild variant="outline" className="mt-auto self-start">
                <Link href={editionHref}>
                  Open Trichozette <ArrowRight />
                </Link>
              </Button>
            </li>
          </ol>
        </Container>
      </Section>

      <section className="border-t border-rule bg-paper-2">
        <Container className="grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-20">
          <div>
            <p className="display text-3xl leading-tight">Not ready to decide today? Leave your email and we&apos;ll send you everything you need to catch up.</p>
          </div>
          <NewsletterForm source={source} cta="Send it to me" />
        </Container>
      </section>
    </>
  );
}
