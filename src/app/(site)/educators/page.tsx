import Link from "next/link";
import { Check } from "lucide-react";
import { ArrowLink, Container, Eyebrow, Section, SectionHeader } from "@/components/site/primitives";
import { JoinEducatorButton } from "@/components/educators/JoinEducatorButton";
import { educatorMembership } from "@/config/subscriptions";
import { images } from "@/content/images";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";

const share = educatorMembership.defaultSharePct;

export const metadata = pageMetadata({
  title: "Teach on Trichollective as an Educator",
  description: `Write and sell your own courses to hair and scalp professionals. Educator membership is £${educatorMembership.annualPrice} a year and you keep ${share}% of every course sale, paid straight to your bank account.`,
  path: "/educators",
  og: { title: "Teach the profession, and keep 70% of every course you sell.", eyebrow: "Educators", img: images.ed22.src, variant: "photo" },
});

const steps = [
  { t: "Join and pay for the year", d: `Educator membership is £${educatorMembership.annualPrice} a year, and Professional membership is included from the day you join.` },
  { t: "Karley and the team approve you", d: "We read your profile and credentials, usually within five working days. If we can't approve you, we refund the fee in full." },
  { t: "Build your course", d: "Write lessons with case studies, scripts, video, handouts, knowledge checks and a final assessment in the course builder, or ask our team to build it with you." },
  { t: "We review it before it goes on sale", d: "Every course is read in full by the team, so learners can trust what they buy and you can trust the company your course keeps." },
  { t: "Learners enrol, and you're paid", d: `You keep ${share}% of each sale. Stripe pays your share into your bank account automatically, and your dashboard shows sales, learners and earnings.` },
];

const faqs = [
  { q: "Who can become an Educator?", a: "Trichologists, doctors, nurses, and experienced stylists, barbers and head spa therapists who teach within their own scope of practice. Tell us about your training and experience when you join, and we'll confirm you're a good fit." },
  { q: "What happens if I'm not approved?", a: "We explain our reasons and refund your membership fee in full." },
  { q: "Who owns my courses?", a: "You do. You give Trichollective a licence to host and sell them, and learners who buy a course keep access to it." },
  { q: "How much can I earn?", a: `You keep ${share}% of what each learner pays. A course priced at £79 that 100 learners buy earns you £${Math.round(79 * 100 * share / 100).toLocaleString("en-GB")}. Members pay the member price you set, and your share is worked out on what they actually pay.` },
  { q: "Do I need to make videos?", a: "No. Many good courses are written lessons with case studies and handouts. If you do use video, host it on Vimeo or YouTube and paste the link into the lesson." },
  { q: "Can Trichollective build the course for me?", a: "Yes. Our team can tailor a course with you from your notes, slides or talks, and you review it before it goes on sale." },
];

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Educators", path: "/educators" },
];

export default function EducatorsPage() {
  return (
    <>
      <section className="border-b border-rule bg-paper">
        <Container>
          <div className="flex max-w-3xl flex-col gap-7 py-16 md:py-24 animate-rise">
            <Eyebrow rule>Educators</Eyebrow>
            <h1 className="display text-[2.6rem] leading-[0.98] sm:text-6xl lg:text-[4.25rem]">
              Teach the profession,
              <br />
              <span className="text-fade">and keep {share}% of every course you sell.</span>
            </h1>
            <p className="lede max-w-2xl">
              Educator membership lets you build your own courses on Trichollective and sell them to practitioners across every discipline, with a certificate for every learner and your share paid straight to your bank account.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6" id="join">
              <JoinEducatorButton />
              <p className="text-[15px] text-ink-2">£{educatorMembership.annualPrice} a year, with Professional membership included.</p>
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHeader eyebrow="How it works" title="From joining to your first sale" fade="in five clear steps." />
            </div>
            <ol className="flex flex-col divide-y divide-rule border-y border-rule lg:col-span-7">
              {steps.map((s, i) => (
                <li key={s.t} className="flex gap-5 py-6">
                  <span className="display w-8 shrink-0 text-3xl leading-none">{i + 1}</span>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-lg font-semibold leading-snug tracking-tight">{s.t}</p>
                    <p className="text-[15px] leading-relaxed text-ink-2">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <Section tone="paper-2">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="flex flex-col gap-6 lg:col-span-5">
              <SectionHeader eyebrow="What's included" title={`Everything you need to teach,`} fade={`for £${educatorMembership.annualPrice} a year.`} />
              <JoinEducatorButton />
            </div>
            <ul className="flex flex-col divide-y divide-rule border-y border-rule lg:col-span-7">
              {educatorMembership.features.map((f) => (
                <li key={f} className="flex gap-4 py-4">
                  <Check className="mt-1 h-4 w-4 shrink-0 stroke-[2]" aria-hidden />
                  <p className="text-[16px] leading-relaxed">{f}.</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section>
        <Container size="narrow">
          <SectionHeader eyebrow="Questions" title="What educators ask us" fade="before they join." />
          <dl className="mt-10 flex flex-col divide-y divide-rule border-y border-rule">
            {faqs.map((f) => (
              <div key={f.q} className="flex flex-col gap-2 py-6">
                <dt className="text-lg font-semibold leading-snug tracking-tight">{f.q}</dt>
                <dd className="text-[15px] leading-relaxed text-ink-2">{f.a}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <JoinEducatorButton />
            <ArrowLink href="/terms/educators">Read the Educator terms</ArrowLink>
          </div>
          <p className="mt-6 text-[14px] text-muted-foreground">
            Want to talk it through first? <Link href="/contact" className="underline underline-offset-4">Get in touch</Link> and Karley will reply personally.
          </p>
        </Container>
      </Section>
      <JsonLd data={breadcrumbLd(crumbs)} />
    </>
  );
}
