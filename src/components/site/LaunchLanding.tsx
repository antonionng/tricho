import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Lock, MessagesSquare, Search, Stethoscope } from "lucide-react";
import { Container, Section } from "@/components/site/primitives";
import { CheckoutButton } from "@/components/site/CheckoutButton";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { RememberSource } from "@/components/site/SourceCapture";
import { StickyJoin } from "@/components/site/StickyJoin";
import { Button } from "@/components/ui/button";
import { images, img, type BrandImage } from "@/content/images";
import { FREE_LISTING_DAYS, tierById } from "@/config/subscriptions";

/**
 * Shared layout for campaign landing pages (the Trichollective Ireland QR code, the
 * Instagram link). Built for a phone in the room: both founding plans sit in the hero,
 * above the fold, with the free listing as a quieter second choice.
 */
export function LaunchLanding({
  source,
  eyebrow,
  title,
  fade,
  lede,
  image = images.ed02,
  details,
  editionHref = "/trichozette/dublin",
  placesLeft,
  cancelled = false,
  qr,
  currency = "gbp",
}: {
  source: string;
  eyebrow: string;
  title: string;
  fade: string;
  lede: string;
  image?: BrandImage;
  details?: React.ReactNode;
  editionHref?: string;
  /** Founding member places still available, counted on the server. */
  placesLeft?: number;
  /** The visitor came back from Stripe without paying. */
  cancelled?: boolean;
  /** A QR code shown beside the hero on larger screens, for presenting the page on a projector. */
  qr?: { svg: string; shortUrl: string };
  /** The currency shown and charged. The Ireland page uses euro so the page and Stripe always match. */
  currency?: "gbp" | "eur";
}) {
  const pro = tierById("professional")!;
  const community = tierById("community")!;
  const business = tierById("business")!;
  // When the founding places are gone, checkout charges the standard price, so say so.
  const founding = placesLeft === undefined || placesLeft > 0;
  const eur = currency === "eur";
  const sym = eur ? "€" : "£";
  const proPrices = eur && pro.eur ? pro.eur : pro;
  const communityPrices = eur && community.eur ? community.eur : community;
  const proPrice = founding ? proPrices.foundingPrice! : proPrices.price;
  const communityPrice = founding ? communityPrices.foundingPrice! : communityPrices.price;
  const businessPrice = eur && business.eur ? business.eur.price : business.price;
  const placesNote =
    placesLeft === undefined
      ? "Founding places are limited."
      : placesLeft > 0
        ? `${placesLeft} founding ${placesLeft === 1 ? "place" : "places"} left.`
        : "The founding places have all been taken.";

  const benefits = [
    {
      icon: MessagesSquare,
      t: "Ask colleagues across every discipline, on any day of the year.",
      d: "Head spa therapists, stylists, trichologists, nurses and doctors share what they know in one private community, with a live masterclass and case round every month.",
    },
    {
      icon: Stethoscope,
      t: "Bring difficult cases to the Case Room for peer review.",
      d: "Share an anonymised case and hear from colleagues in cosmetic, clinical and medical practice, then refer the client on with confidence.",
    },
    {
      icon: Search,
      t: "Be found by clients in the public directory.",
      d: "Professional members have a full profile with photo, services and website, and enquiries from the public come straight to their inbox.",
    },
    {
      icon: Lock,
      t: "Keep the founding price for as long as you stay.",
      d: `Professional is ${sym}${proPrices.foundingPrice} a month instead of ${sym}${proPrices.price}, and Community is ${sym}${communityPrices.foundingPrice} instead of ${sym}${communityPrices.price}. You can cancel at any time.`,
    },
  ];

  return (
    <>
      <RememberSource value={source} />
      <section id="join" className="relative scroll-mt-20 overflow-hidden bg-ink text-paper">
        <Image
          src={img(image, 2000)}
          alt={image.alt}
          fill
          priority
          sizes="100vw"
          className="mag-bw object-cover object-top opacity-50 md:object-[70%_20%] md:opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/85 to-black md:bg-gradient-to-r md:from-black md:via-black/75 md:to-black/10" />
        <Container className="relative">
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16">
          <div className="flex max-w-3xl flex-col gap-5 py-7 md:gap-6 md:py-20 lg:py-24">
            <p className="label text-paper/70">{eyebrow}</p>
            <h1 className="display text-[2.3rem] leading-[0.98] sm:text-5xl lg:text-6xl">
              {title} <span className="opacity-60">{fade}</span>
            </h1>
            <p className="max-w-2xl text-[17px] leading-relaxed text-paper/80 md:text-lg">{lede}</p>
            {details && <div className="hidden md:block">{details}</div>}

            {cancelled && (
              <p role="status" className="rounded-2xl border border-paper/20 bg-paper/10 px-4 py-3 text-[15px] leading-relaxed text-paper/90">
                Your payment was not taken. You can choose a plan below whenever you are ready, or add a free listing instead.
              </p>
            )}

            <div className="flex flex-col gap-3">
              <p className="label text-paper">{placesNote}</p>
              <div className="flex max-w-2xl flex-col gap-3 sm:flex-row">
                <CheckoutButton
                  source={source}
                  currency={currency}
                  plan="professional"
                  founding={founding}
                  size="xl"
                  variant="paper"
                  errorTone="ink"
                  className="w-full"
                  wrapperClassName="sm:flex-1"
                >
                  Professional at {sym}{proPrice} a month
                </CheckoutButton>
                <CheckoutButton
                  source={source}
                  currency={currency}
                  plan="community"
                  founding={founding}
                  size="xl"
                  variant="outline"
                  errorTone="ink"
                  className="w-full border-paper/40 text-paper hover:border-paper"
                  wrapperClassName="sm:flex-1"
                >
                  Community at {sym}{communityPrice} a month
                </CheckoutButton>
              </div>
              <p className="text-[13px] leading-relaxed text-paper/65">
                {founding
                  ? `Founding prices are in ${eur ? "euro" : "pounds"} and stay the same for as long as you remain a member. You can cancel at any time.`
                  : `Prices are in ${eur ? "euro" : "pounds"}, and you can cancel at any time.`}
              </p>
            </div>

            <Link
              href="/directory/list"
              className="inline-flex items-center gap-1.5 self-start text-[15px] text-paper underline decoration-paper/40 underline-offset-4 hover:decoration-paper"
            >
              Or add your free directory listing <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#business"
              className="-mt-3 inline-flex items-center gap-1.5 self-start text-[15px] text-paper underline decoration-paper/40 underline-offset-4 hover:decoration-paper"
            >
              Joining as a clinic, salon or brand? See the Business plan <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          {qr && (
            <figure className="hidden w-[340px] shrink-0 rounded-3xl bg-paper p-6 text-ink shadow-2xl lg:block">
              {/* Generated on the server by the qrcode library from our own URL. */}
              <div className="aspect-square w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr.svg }} />
              <figcaption className="mt-4 space-y-1 text-center">
                <p className="text-[17px] font-medium leading-snug">Scan with your phone camera to join.</p>
                <p className="text-sm text-ink-2">Or go to {qr.shortUrl}</p>
              </figcaption>
            </figure>
          )}
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <p className="label text-muted-foreground">What founding members get</p>
          <h2 className="display mt-4 max-w-3xl text-3xl leading-tight md:text-4xl">
            Membership gives you the colleagues, the cases and the clients that are hard to find on your own.
          </h2>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-rule bg-rule sm:grid-cols-2">
            {benefits.map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex flex-col gap-3 bg-paper p-6 md:p-8">
                <Icon className="h-6 w-6 stroke-[1.5]" aria-hidden />
                <p className="text-lg font-semibold leading-snug tracking-tight">{t}</p>
                <p className="text-[15px] leading-relaxed text-ink-2">{d}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="paper-2">
        <Container>
          <p className="label text-muted-foreground">Choose your plan</p>
          <h2 className="display mt-4 max-w-3xl text-3xl leading-tight md:text-4xl">
            Both plans include the community, and Professional adds the directory profile and the Case Room.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <article className="flex flex-col gap-4 rounded-3xl bg-ink p-6 text-paper md:p-8">
              <p className="label text-paper/70">{pro.name}</p>
              <p className="display text-5xl">
                {sym}{proPrice}
                <span className="text-base font-normal opacity-60"> a month</span>
              </p>
              <p className="text-[15px] leading-relaxed text-paper/80">{pro.audience}.</p>
              <p className="text-[15px] leading-relaxed text-paper/80">{pro.summary}</p>
              <CheckoutButton source={source} currency={currency} plan="professional" founding={founding} size="xl" variant="paper" errorTone="ink" className="w-full" wrapperClassName="mt-auto pt-2">
                Join {pro.name} at {sym}{proPrice}
              </CheckoutButton>
            </article>
            <article className="flex flex-col gap-4 rounded-3xl border border-rule bg-card p-6 md:p-8">
              <p className="label text-muted-foreground">{community.name}</p>
              <p className="display text-5xl">
                {sym}{communityPrice}
                <span className="text-base font-normal opacity-60"> a month</span>
              </p>
              <p className="text-[15px] leading-relaxed text-ink-2">{community.audience}.</p>
              <p className="text-[15px] leading-relaxed text-ink-2">{community.summary}</p>
              <CheckoutButton source={source} currency={currency} plan="community" founding={founding} size="xl" variant="outline" className="w-full" wrapperClassName="mt-auto pt-2">
                Join {community.name} at {sym}{communityPrice}
              </CheckoutButton>
            </article>
          </div>
          <article id="business" className="mt-5 flex scroll-mt-20 flex-col gap-6 rounded-3xl border border-rule bg-card p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex max-w-2xl flex-col gap-3">
              <p className="label text-muted-foreground">{business.name}, for clinics, salons and brands</p>
              <p className="display text-4xl">
                {sym}
                {businessPrice}
                <span className="text-base font-normal opacity-60"> a month</span>
              </p>
              <p className="text-[15px] leading-relaxed text-ink-2">
                Your business gets its own page in the directory, five of your team get Professional membership, and you can
                introduce each of them on your page with a photo, their role and a few words about their work.
              </p>
              <p className="text-[15px] leading-relaxed text-ink-2">
                You can also advertise roles to trained hair and scalp professionals and offer members a perk.
              </p>
            </div>
            <CheckoutButton source={source} currency={currency} plan="business" interval="month" size="xl" className="w-full md:w-auto" wrapperClassName="md:shrink-0">
              Join {business.name} at {sym}
              {businessPrice}
            </CheckoutButton>
          </article>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            You pay securely by card through Stripe and do not need an account first. We create your account from the email
            you pay with, and you sign in with that same email afterwards.
          </p>
        </Container>
      </Section>

      <Section>
        <Container>
          <p className="label text-muted-foreground">Not ready to become a member?</p>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-3xl border border-rule bg-card p-6 md:p-8">
              <p className="text-xl font-semibold leading-snug tracking-tight">
                Add your practice to the directory for free, with your full profile included for {FREE_LISTING_DAYS} days.
              </p>
              <p className="text-[15px] leading-relaxed text-ink-2">
                Clients looking for a head spa therapist, stylist, trichologist or doctor near them will be able to find you.
                Your listing stays free for as long as you like.
              </p>
              <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                <Button asChild size="lg">
                  <Link href="/directory/list">
                    Add my free listing <ArrowRight />
                  </Link>
                </Button>
                <Link href="/signup" className="text-[15px] text-ink underline underline-offset-4">
                  Create a free account instead
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-4 rounded-3xl border border-rule bg-card p-6 md:p-8">
              <BookOpen className="h-6 w-6 stroke-[1.5]" aria-hidden />
              <p className="text-xl font-semibold leading-snug tracking-tight">
                Read Trichozette, the magazine written for people who work with hair and scalp.
              </p>
              <p className="text-[15px] leading-relaxed text-ink-2">
                The opening pages of every edition are free, including four years of looking back at what changed in
                cosmetic, clinical and medical practice.
              </p>
              <Button asChild variant="outline" size="lg" className="mt-auto self-start">
                <Link href={editionHref}>
                  Open Trichozette <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <section className="border-t border-rule bg-paper-2 pb-24 xl:pb-0">
        <Container className="grid gap-8 py-14 md:grid-cols-2 md:items-center md:py-20">
          <p className="display text-3xl leading-tight">
            If you would rather decide later, leave your email and we will send you everything you need to catch up.
          </p>
          <NewsletterForm source={source} cta="Send it to me" />
        </Container>
      </section>

      <StickyJoin label={founding ? "Join as a founding member" : "Choose a plan"} note={placesNote} href="#join" />
    </>
  );
}
