import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Mic, Package, ShieldCheck, Tag, Users } from "lucide-react";
import { ArrowLink, Container, Eyebrow, Section, SectionHeader } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { PartnerApplicationForm } from "@/components/site/PartnerApplicationForm";
import { images, img } from "@/content/images";
import { premiumBusiness, tierById } from "@/config/subscriptions";
import { foundingPartnerPlacesLeft } from "@/lib/founding";
import { PARTNER_CATEGORIES } from "@/lib/partners";
import { breadcrumbLd, JsonLd, pageMetadata, absoluteUrl } from "@/lib/seo";
import { site } from "@/config/site";
import { CheckoutButton } from "@/components/site/CheckoutButton";
import { BusinessCheckout, BusinessPrice } from "./BusinessCheckout";

export const dynamic = "force-dynamic";

const business = tierById("business")!;
const gbp = (n: number) => `£${n.toLocaleString("en-GB")}`;

export const metadata = pageMetadata({
  title: `Business and Premium Business for clinics, salons and brands`,
  description: `Two ways to reach hair and scalp professionals across Ireland and the UK. Business gives you a directory page, five seats, job posts and a member perk for £${business.price} a month. Premium Business adds a masterclass, Trichozette features and conference presence, by application, with at most two partners in each category.`,
  path: "/for-business",
  og: { title: "Reach the practitioners who recommend products to their clients.", eyebrow: "For business", img: images.ed16.src, variant: "photo" },
});

const who = [
  { t: "Clinics", d: "Hair loss, trichology and dermatology clinics that want to be known to the practitioners who refer, and to hire trained staff." },
  { t: "Salons and head spas", d: "Teams who want shared CPD, peer support and a directory page where clients looking for scalp care can find them." },
  { t: "Brands", d: "Haircare and scalp care brands that want their products known to the professionals who recommend them." },
  { t: "Device makers and educators", d: "Makers of scalp cameras, LED and UV devices, and training providers, who want to reach the salons and clinics deciding what to buy and learn." },
];

type Cell = boolean | string;

/** Every Business and Premium Business benefit, side by side. */
const comparison: { group: string; rows: { label: string; business: Cell; premium: Cell }[] }[] = [
  {
    group: "Your presence",
    rows: [
      { label: "A business page in the public directory", business: true, premium: true },
      { label: "A partner page on Trichollective and the Premium partner badge", business: false, premium: true },
    ],
  },
  {
    group: "Your team",
    rows: [
      { label: "Professional membership for five of your team, including the Case Room and CPD", business: true, premium: true },
      { label: "Job posts on the jobs board, seen by trained hair and scalp professionals", business: true, premium: true },
    ],
  },
  {
    group: "Education and editorial",
    rows: [
      { label: "One sponsored masterclass a year, reviewed so that it teaches rather than sells, kept in the member library", business: false, premium: true },
      { label: "The option to co-develop a course with a certificate, subject to clinical review", business: false, premium: true },
      { label: "One labelled partner feature in Trichozette a year", business: false, premium: true },
      { label: "“Supported by” on one Trichozette edition each quarter", business: false, premium: true },
      { label: "Two newsletter spotlights a year", business: false, premium: true },
    ],
  },
  {
    group: "Conferences",
    rows: [
      { label: "A talk or demo slot at one conference a year", business: false, premium: true },
      { label: "Sampling or a delegate-bag insert at the other conferences", business: false, premium: true },
    ],
  },
  {
    group: "Perks, trials and reporting",
    rows: [
      { label: "A member perk offered to every member", business: true, premium: "With tracked redemptions" },
      { label: "An opt-in product trial panel with structured feedback", business: false, premium: true },
      { label: "A report on how members engaged with you", business: "Quarterly summary", premium: "Quarterly, covering content and perks" },
    ],
  },
];

function CellValue({ value }: { value: Cell }) {
  if (value === true)
    return (
      <>
        <Check className="mx-auto h-4 w-4" aria-hidden />
        <span className="sr-only">Included</span>
      </>
    );
  if (value === false)
    return (
      <>
        <span aria-hidden className="text-mute">
          –
        </span>
        <span className="sr-only">Not included</span>
      </>
    );
  return <span className="text-sm text-ink-2">{value}</span>;
}

export default async function ForBusinessPage() {
  const partnerLeft = await foundingPartnerPlacesLeft();
  const foundingOpen = partnerLeft > 0;
  const premiumPrice = foundingOpen ? premiumBusiness.foundingAnnualPrice : premiumBusiness.annualPrice;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute inset-y-0 right-0 hidden w-[46%] lg:block">
          <Image
            src={img(images.ed16, 1600)}
            alt={images.ed16.alt}
            fill
            priority
            sizes="46vw"
            className="mag-bw object-cover"
          />
          <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-paper to-transparent" />
        </div>
        <Container className="relative">
          <div className="grid min-h-[75svh] items-center py-16 lg:grid-cols-12 lg:py-24">
            <div className="flex flex-col gap-8 animate-rise lg:col-span-7">
              <Eyebrow rule>For business</Eyebrow>
              <h1 className="display text-5xl sm:text-6xl lg:text-7xl">
                Reach the practitioners
                <br />
                <span className="text-fade">who recommend products to their clients.</span>
              </h1>
              <p className="lede max-w-xl">
                Choose Business to give your clinic, salon or brand a directory page, five Professional seats, job
                posts and a member perk. Choose Premium Business to teach, write and exhibit alongside the
                profession as one of a small number of partners.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="xl">
                  <Link href="#compare">
                    Compare the two tiers <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="xl" variant="outline">
                  <Link href="#apply">Talk to us about a partnership</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
        <div className="relative aspect-[4/3] w-full lg:hidden">
          <Image
            src={img(images.ed16, 1000)}
            alt={images.ed16.alt}
            fill
            priority
            sizes="100vw"
            className="mag-bw object-cover"
          />
        </div>
      </section>

      {/* Who it's for */}
      <Section tone="paper-2">
        <Container>
          <SectionHeader
            eyebrow="Who it's for"
            title="Clinics, salons, brands and device makers"
            fade="each reach the practitioners who matter to them."
          />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {who.map((w) => (
              <li key={w.t} className="flex flex-col gap-3 bg-paper p-7">
                <h3 className="display text-2xl">{w.t}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2">{w.d}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* The two tiers */}
      <Section id="compare">
        <Container>
          <SectionHeader
            eyebrow="Two tiers"
            title="Join Business today,"
            fade="or go further with Premium."
            body="Both are open to any clinic, salon or brand, and you can join either one online straight away. Premium Business adds education, editorial and conference placements with the practitioners who recommend products to their clients."
          />

          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            <article className="flex min-w-0 flex-col gap-6 rounded-3xl border border-rule bg-card p-7 md:p-9">
              <header className="flex flex-col gap-3">
                <p className="label text-muted-foreground">{business.name}</p>
                <BusinessPrice />
              </header>
              <p className="text-[15px] leading-relaxed text-ink-2">{business.summary}</p>
              <ul className="flex flex-col gap-3 text-[15px]">
                {business.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[15px] text-ink-2">
                Need more than five seats?{" "}
                <a href={`mailto:${site.contactEmail}?subject=Business%20seats`} className="text-ink underline underline-offset-4">
                  Talk to us
                </a>{" "}
                and we will set up the right number for your team.
              </p>
              <div className="mt-auto pt-2">
                <BusinessCheckout showNote={false} />
              </div>
            </article>

            <article className="flex min-w-0 flex-col gap-6 rounded-3xl border border-ink bg-ink p-7 text-paper md:p-9">
              <header className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="label text-paper/70">{premiumBusiness.name}</p>
                  <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium leading-none text-ink">
                    Join online
                  </span>
                </div>
                <p className="display text-5xl">
                  {gbp(premiumPrice)}
                  <span className="text-base font-normal opacity-60">/yr</span>
                </p>
                <p className="text-sm text-paper/70">
                  {foundingOpen ? (
                    <>
                      Founding partner price for the first {premiumBusiness.foundingPlaces} partners, kept while you
                      stay.{" "}
                      <s aria-label={`Standard price ${gbp(premiumBusiness.annualPrice)} a year`}>
                        {gbp(premiumBusiness.annualPrice)}
                      </s>{" "}
                      a year after that. Billed yearly, and your partner page goes live as soon as you join.
                    </>
                  ) : (
                    "Billed yearly, and your partner page goes live as soon as you join."
                  )}
                </p>
                {foundingOpen && (
                  <p className="label text-paper">
                    {partnerLeft} of {premiumBusiness.foundingPlaces} founding partner places remaining
                  </p>
                )}
              </header>
              <p className="text-[15px] leading-relaxed text-paper/80">{premiumBusiness.summary}</p>
              <ul className="flex flex-col gap-3 text-[15px]">
                {premiumBusiness.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-2">
                <CheckoutButton plan="premium" interval="year" variant="paper" errorTone="ink">
                  Join Premium for {gbp(premiumPrice)} a year
                </CheckoutButton>
              </div>
            </article>
          </div>
        </Container>
      </Section>

      {/* Benefits side by side */}
      <Section tone="paper-2" id="benefits">
        <Container>
          <SectionHeader
            eyebrow="Benefits compared"
            title="See what each tier gives you,"
            fade="line by line."
            body="Premium Business includes everything in Business, then adds education, editorial and conference placements."
          />
          <div className="mt-12 overflow-hidden rounded-3xl border border-rule bg-paper">
            <table className="w-full border-collapse text-left text-[15px]">
              <caption className="sr-only">Business compared with Premium Business</caption>
              <thead>
                <tr className="border-b border-ink">
                  <th scope="col" className="py-4 pr-3 pl-4 font-normal sm:pl-5">
                    <span className="sr-only">Benefit</span>
                  </th>
                  <th scope="col" className="label w-[4.75rem] px-2 py-4 text-center font-medium text-muted-foreground sm:w-40">
                    Business
                  </th>
                  <th scope="col" className="label w-[4.75rem] bg-card px-2 py-4 text-center font-medium text-ink sm:w-48">
                    Premium
                  </th>
                </tr>
              </thead>
              {comparison.map((g) => (
                <tbody key={g.group}>
                  <tr>
                    <th scope="colgroup" colSpan={3} className="px-5 pt-8 pb-3 text-left font-semibold text-ink">
                      {g.group}
                    </th>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={r.label} className="border-t border-rule">
                      <th scope="row" className="py-4 pr-3 pl-4 font-normal text-ink-2 sm:pl-5">
                        {r.label}
                      </th>
                      <td className="px-2 py-4 text-center">
                        <CellValue value={r.business} />
                      </td>
                      <td className="bg-card px-2 py-4 text-center">
                        <CellValue value={r.premium} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
              <tbody>
                <tr className="border-t border-ink">
                  <th scope="row" className="py-4 pr-3 pl-5 font-medium text-ink">
                    Price
                  </th>
                  <td className="px-2 py-4 text-center text-sm text-ink-2">
                    {gbp(business.price)} a month or {gbp(business.annualPrice)} a year
                  </td>
                  <td className="bg-card px-2 py-4 text-center text-sm text-ink-2">
                    {foundingOpen
                      ? `${gbp(premiumBusiness.foundingAnnualPrice)} a year for founding partners, then ${gbp(premiumBusiness.annualPrice)}`
                      : `${gbp(premiumBusiness.annualPrice)} a year`}
                  </td>
                </tr>
                <tr className="border-t border-rule">
                  <th scope="row" className="py-4 pr-3 pl-5 font-medium text-ink">
                    How you join
                  </th>
                  <td className="px-2 py-4 text-center text-sm text-ink-2">Online, straight away</td>
                  <td className="bg-card px-2 py-4 text-center text-sm text-ink-2">Online, straight away</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Prices include VAT where applicable.</p>
        </Container>
      </Section>

      {/* Conference presence, framed honestly */}
      <Section>
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="relative hidden aspect-[4/5] overflow-hidden rounded-3xl lg:col-span-5 lg:block">
              <Image
                src={img(images.ed15, 900)}
                alt={images.ed15.alt}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="mag-bw object-cover"
              />
            </div>
            <div className="flex flex-col gap-8 lg:col-span-7">
              <SectionHeader
                eyebrow="Conference presence"
                title="Our conferences are small on purpose,"
                fade="so every conversation counts."
              />
              <div className="prose-tricho">
                <p>
                  Each Trichollective conference averages about 50 practitioners, and every one of them works with
                  hair and scalp clients. You will not meet thousands of people. You will meet the trichologists,
                  clinicians and salon owners who decide what to use and what to recommend.
                </p>
                <p>
                  That is why Premium Business includes one talk or demo slot a year rather than a stand at every
                  event. One well-prepared session in front of the right room does more than repeating the same
                  pitch, and sampling or a delegate-bag insert at the other conferences keeps your products in
                  practitioners&apos; hands all year.
                </p>
              </div>
              <ul className="grid gap-5 sm:grid-cols-3">
                {[
                  { icon: Users, t: "About 50 per event", d: "Highly targeted practitioners, not general visitors." },
                  { icon: Mic, t: "One talk or demo a year", d: "Time to teach properly, with questions from the room." },
                  { icon: Package, t: "Sampling at the others", d: "Or a delegate-bag insert, so you stay present." },
                ].map(({ icon: Icon, t, d }) => (
                  <li key={t} className="flex flex-col gap-2 border-t border-rule pt-4">
                    <Icon className="h-5 w-5 stroke-[1.5]" aria-hidden />
                    <p className="font-medium text-ink">{t}</p>
                    <p className="text-[15px] leading-relaxed text-ink-2">{d}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* Guardrails */}
      <Section tone="ink">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="flex flex-col gap-6 lg:col-span-5">
              <Eyebrow rule className="text-paper">
                How we protect members
              </Eyebrow>
              <h2 className="display text-4xl sm:text-5xl">
                Members trust what they read here,
                <br />
                <span className="opacity-60">so your presence carries weight.</span>
              </h2>
            </div>
            <div className="flex flex-col gap-8 lg:col-span-7">
              <p className="text-lg leading-relaxed text-paper/80">
                Members come to Trichollective for honest conversation with their peers. That is also what makes
                them worth reaching, so every partnership follows the same rules.
              </p>
              <ul className="flex flex-col divide-y divide-paper/15 border-y border-paper/15">
                {premiumBusiness.guardrails.map((g, i) => {
                  const Icon = [Tag, ShieldCheck][i] ?? ShieldCheck;
                  return (
                    <li key={g} className="flex gap-4 py-5">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5]" aria-hidden />
                      <p className="font-medium">{g}.</p>
                    </li>
                  );
                })}
                <li className="flex gap-4 py-5">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5]" aria-hidden />
                  <p className="font-medium">Sponsored masterclasses and courses are reviewed so that they teach rather than sell.</p>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* Application */}
      <Section tone="paper-2" id="apply">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="flex flex-col gap-6 lg:col-span-4">
              <SectionHeader
                eyebrow="Talk to us"
                title="Tell us about your brand"
                fade="and we will reply personally."
              />
              <div className="flex flex-col gap-4 text-[15px] leading-relaxed text-ink-2">
                <p>
                  You can join Premium online and your partner page goes live as soon as you pay. If you would like
                  to plan your masterclass, editorial or conference placements with us first, tell us about your
                  brand here.
                </p>
                <p>
                  {foundingOpen
                    ? `${partnerLeft} of ${premiumBusiness.foundingPlaces} founding partner places remain at ${gbp(premiumBusiness.foundingAnnualPrice)} a year, kept for as long as you stay.`
                    : `Founding partner places have all been taken. Premium Business is ${gbp(premiumBusiness.annualPrice)} a year.`}
                </p>
                <p>
                  If you would rather start with Business, you can{" "}
                  <Link href="#compare" className="text-ink underline underline-offset-4">
                    join online today
                  </Link>{" "}
                  and move up to Premium whenever you are ready.
                </p>
              </div>
              <p className="text-[15px] text-ink-2">
                Prefer email?{" "}
                <a href={`mailto:${site.contactEmail}`} className="text-ink underline underline-offset-4">
                  {site.contactEmail}
                </a>
              </p>
              <ArrowLink href="/partners">See our partners</ArrowLink>
            </div>
            <div className="relative lg:col-span-8">
              <PartnerApplicationForm categories={PARTNER_CATEGORIES} />
            </div>
          </div>
        </Container>
      </Section>

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: `${site.name} Business membership`,
            description: business.summary,
            provider: { "@type": "Organization", name: site.name, url: site.url },
            areaServed: ["Ireland", "United Kingdom"],
            offers: [
              {
                "@type": "Offer",
                name: business.name,
                price: business.price,
                priceCurrency: "GBP",
                url: absoluteUrl("/for-business#compare"),
              },
              {
                "@type": "Offer",
                name: premiumBusiness.name,
                price: premiumPrice,
                priceCurrency: "GBP",
                url: absoluteUrl("/for-business#compare"),
              },
            ],
          },
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "For business", path: "/for-business" },
          ]),
        ]}
      />
    </>
  );
}
