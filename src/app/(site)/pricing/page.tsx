import { images } from "@/content/images";
import { Check, CreditCard, RotateCcw, ShieldCheck } from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/site/primitives";
import { FaqList } from "@/components/site/FaqList";
import { pricingFaqs } from "@/content/faqs";
import { FREE_LISTING_DAYS, subscriptionTiers } from "@/config/subscriptions";
import { breadcrumbLd, faqLd, JsonLd, pageMetadata, absoluteUrl } from "@/lib/seo";
import { site } from "@/config/site";
import { PricingTable } from "./PricingTable";

export const metadata = pageMetadata({
  title: `Membership and pricing`,
  description: `Compare Trichollective plans for hair and scalp professionals. A free founding listing for ${FREE_LISTING_DAYS} days, Community from £6 a month at the founding price, Professional and Business. Cancel anytime.`,
  path: "/pricing",
    og: { title: "Choose the plan that fits your practice,", sub: "and cancel whenever you like.", eyebrow: "Membership", img: images.salon.src, variant: "photo" },
});

type Cell = boolean | string;
const columns = ["Founding listing", "Community", "Professional", "Business"] as const;
const shortColumns = ["Free listing", "Community", "Professional", "Business"] as const;

const comparison: { group: string; rows: { label: string; values: [Cell, Cell, Cell, Cell] }[] }[] = [
  {
    group: "The directory",
    rows: [
      { label: "Basic listing: name, discipline, city and specialism", values: [`${FREE_LISTING_DAYS} days`, false, true, true] },
      { label: "Full profile with photo, services and website", values: [false, false, true, true] },
      { label: "Enquiries from the public sent to you", values: ["Held until you claim", false, true, true] },
      { label: "Verified badge after a manual check", values: [false, false, true, true] },
      { label: "Business page", values: [false, false, false, true] },
    ],
  },
  {
    group: "Community",
    rows: [
      { label: "Open spaces, your local chapter and direct messages", values: [false, true, true, true] },
      { label: "The Case Room for anonymised case discussion", values: [false, false, true, true] },
      { label: "Referral network across disciplines", values: [false, false, true, true] },
      { label: "Monthly live masterclass and recordings", values: [false, true, true, true] },
    ],
  },
  {
    group: "Learning",
    rows: [
      { label: "Trichozette and the podcast", values: [false, true, true, true] },
      { label: "The monthly newsletter", values: [true, true, true, true] },
      { label: "Member prices on courses and gatherings", values: [false, true, true, true] },
      { label: "CPD log", values: [false, false, true, true] },
      { label: "The Assistant", values: [false, false, true, true] },
    ],
  },
  {
    group: "For your business",
    rows: [
      { label: "Member perks from partner brands", values: [false, true, true, true] },
      { label: "Professional seats for your team", values: [false, false, "1", "5"] },
      { label: "Job posts on the jobs board", values: [false, false, false, true] },
      { label: "A listing in member perks", values: [false, false, false, true] },
      { label: "Quarterly engagement summary", values: [false, false, false, true] },
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

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const { cancelled } = await searchParams;

  const offersLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${site.name} membership`,
    description: site.description,
    brand: { "@type": "Organization", name: site.name },
    offers: subscriptionTiers.map((t) => ({
      "@type": "Offer",
      name: t.name,
      price: t.foundingPrice ?? t.price,
      priceCurrency: "GBP",
      url: absoluteUrl(`/pricing#${t.id}`),
      availability: "https://schema.org/InStock",
    })),
  };

  return (
    <>
      <Section className="pb-12 md:pb-16">
        <Container>
          {cancelled === "1" && (
            <div
              role="status"
              className="mx-auto mb-12 max-w-2xl rounded-2xl border border-rule bg-card px-6 py-5 text-[15px] leading-relaxed text-ink-2"
            >
              Your checkout was cancelled and you have not been charged. Take your time. If you have a
              question before joining, email us at{" "}
              <a href={`mailto:${site.contactEmail}`} className="text-ink underline underline-offset-4">
                {site.contactEmail}
              </a>
              .
            </div>
          )}
          <SectionHeader
            as="h1"
            align="center"
            eyebrow="Membership"
            title="Choose the plan that fits your practice,"
            fade="and cancel whenever you like."
            body={`Start with a free founding listing for ${FREE_LISTING_DAYS} days, or join the community today. Founding members keep their founding price for as long as they stay, and founding places are limited.`}
          />
        </Container>
      </Section>

      <section className="pb-20 md:pb-28">
        <Container>
          <PricingTable />

          <ul className="mt-12 grid gap-6 border-t border-rule pt-10 sm:grid-cols-3">
            {[
              {
                icon: RotateCcw,
                t: "14-day refund",
                d: "If Trichollective isn't right for you, email us within 14 days of your first payment and we will refund it in full.",
              },
              {
                icon: Check,
                t: "Cancel anytime",
                d: "No contract. Cancel from your account whenever you like and keep access until the end of the period you have paid for.",
              },
              {
                icon: ShieldCheck,
                t: "Secure payment by Stripe",
                d: "Payments are handled by Stripe. Your card details never touch our servers.",
              },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex gap-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5]" aria-hidden />
                <div>
                  <p className="font-medium text-ink">{t}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Full comparison */}
      <Section tone="paper-2" id="compare">
        <Container>
          <SectionHeader
            eyebrow="Compare plans"
            title="Compare everything each plan includes,"
            fade="side by side."
            body="Every plan includes the monthly newsletter. The table shows what each one adds."
          />
          {/* Phones: one block per feature, no sideways scrolling */}
          <div className="mt-12 md:hidden">
            <div className="sticky top-16 z-10 grid grid-cols-4 gap-1 border-b border-ink bg-paper-2 py-3 text-center text-[11px] font-medium leading-tight">
              {shortColumns.map((c, i) => (
                <span key={c} className={i === 2 ? "text-ink" : "text-muted-foreground"}>
                  {c}
                </span>
              ))}
            </div>
            {comparison.map((g) => (
              <div key={g.group}>
                <p className="pt-8 pb-2 font-semibold text-ink">{g.group}</p>
                <dl className="divide-y divide-rule border-t border-rule">
                  {g.rows.map((r) => (
                    <div key={r.label} className="py-4">
                      <dt className="text-[15px] text-ink-2">{r.label}</dt>
                      <dd className="mt-3 grid grid-cols-4 gap-1 text-center">
                        {r.values.map((v, i) => (
                          <span key={columns[i]} className={`rounded-lg py-1.5 ${i === 2 ? "bg-card" : ""}`}>
                            <span className="sr-only">{columns[i]}: </span>
                            <CellValue value={v} />
                          </span>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          <div className="mt-12 hidden md:block">
            <table className="w-full border-collapse text-left text-[15px]">
              <caption className="sr-only">Feature comparison of Trichollective plans</caption>
              <thead>
                <tr className="border-b border-ink">
                  <th scope="col" className="w-[36%] py-4 pr-4 font-normal">
                    <span className="sr-only">Feature</span>
                  </th>
                  {columns.map((c) => (
                    <th
                      key={c}
                      scope="col"
                      className={`label px-3 py-4 text-center font-medium ${c === "Professional" ? "text-ink" : "text-muted-foreground"}`}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              {comparison.map((g) => (
                <tbody key={g.group}>
                  <tr>
                    <th scope="colgroup" colSpan={5} className="pt-10 pb-3 text-left font-semibold text-ink">
                      {g.group}
                    </th>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={r.label} className="border-t border-rule">
                      <th scope="row" className="py-4 pr-4 font-normal text-ink-2">
                        {r.label}
                      </th>
                      {r.values.map((v, i) => (
                        <td
                          key={columns[i]}
                          className={`px-3 py-4 text-center ${i === 2 ? "bg-card" : ""}`}
                        >
                          <CellValue value={v} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="flex flex-col gap-6 lg:col-span-4">
              <SectionHeader eyebrow="Questions" title="Here are the answers to common questions before you join." />
              <p className="flex items-start gap-3 text-[15px] leading-relaxed text-ink-2">
                <CreditCard className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5]" aria-hidden />
                <span>
                  Something we haven&apos;t answered? Email{" "}
                  <a href={`mailto:${site.contactEmail}`} className="text-ink underline underline-offset-4">
                    {site.contactEmail}
                  </a>{" "}
                  and a person will reply.
                </span>
              </p>
            </div>
            <div className="lg:col-span-8">
              <FaqList faqs={pricingFaqs} />
            </div>
          </div>
        </Container>
      </Section>

      <JsonLd
        data={[
          faqLd(pricingFaqs),
          offersLd,
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]),
        ]}
      />
    </>
  );
}
