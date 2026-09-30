import Link from "next/link";
import { ArrowRight, FileCheck2, Link2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLink, Container, Section, SectionHeader } from "@/components/site/primitives";
import { FaqList } from "@/components/site/FaqList";
import { PageHero } from "@/components/editorial/PageHero";
import { CertificatePreview } from "@/components/editorial/CertificatePreview";
import { images } from "@/content/images";
import { courses } from "@/content/courses";
import { breadcrumbLd, faqLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";

export const metadata = pageMetadata({
  title: "Certificates of completion and how to check one",
  description:
    "Show clients and employers exactly what you have studied. Every Trichollective certificate of completion can be verified online, and every course is reviewed by a qualified practitioner first.",
  path: "/certification",
    og: { title: "Show clients a certificate they can check.", sub: "Verified online in seconds.", eyebrow: "Certification", img: images.ed17.src, variant: "photo" },
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Learn", path: "/learn" },
  { name: "Certification", path: "/certification" },
];

const faqs = [
  {
    q: "Is a Trichollective certificate a qualification?",
    a: "No. It is a certificate of completion. It shows that you finished a course and its final assessment. It is not an accredited qualification and does not license you to offer any treatment.",
  },
  {
    q: "Do courses count towards CPD?",
    a: "Your study hours are added to your CPD log automatically, so you have a record to show your professional body. The courses themselves are not CPD-accredited yet. When a course is, the course page and the certificate will say so, along with the accrediting body.",
  },
  {
    q: "Can a certificate be withdrawn?",
    a: "Yes, in rare cases, for example if it was issued in error. The public page will then say that the certificate is no longer valid, so nobody is misled.",
  },
  {
    q: "What if I lose the link to my certificate?",
    a: "Every certificate you earn is kept in your account, and you can copy its public link from there at any time.",
  },
];

export default function CertificationPage() {
  return (
    <>
      <PageHero
        eyebrow="Certification"
        title="Show clients and employers a certificate"
        fade="they can check for themselves in seconds."
        lede={
          <p>
            Finish a {site.name} course and you receive a certificate of completion with its own web
            address. Every course behind it has been reviewed by a qualified practitioner, and it is
            honest about what it is: not an accredited qualification.
          </p>
        }
        image={images.ed17}
        imageClassName="mag-bw object-top"
        crumbs={crumbs}
      />

      {/* How certificates work */}
      <Section>
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-16">
            <div className="lg:col-span-5 flex flex-col gap-8">
              <SectionHeader
                eyebrow="How it works"
                title="Your certificate tells a client exactly"
                fade="what you studied, for how long and who checked it."
              />
              <div className="prose-tricho">
                <p>
                  Each certificate records your name, the course you completed, the number of study
                  hours, the date you finished and the practitioner who reviewed the course.
                </p>
                <p>
                  It is a <strong>certificate of completion</strong>, not an accredited qualification.
                  It shows that you studied the material and passed the course&apos;s final
                  assessment. It does not license you to offer a treatment, and it doesn&apos;t replace
                  the training your profession requires.
                </p>
                <p>
                  Your study hours go into your CPD log automatically. If we add CPD accreditation to a
                  course later, the course page and the certificate will name the accrediting body, so it
                  is always clear which courses carry it.
                </p>
              </div>
            </div>
            <div className="lg:col-span-7">
              <CertificatePreview
                courseTitle={courses[0]?.title ?? "Course title"}
                hours={courses[0]?.hours ?? 3}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Verify */}
      <Section tone="paper-2" id="verify">
        <Container>
          <SectionHeader
            eyebrow="Checking a certificate"
            title="Anyone can verify a certificate"
            fade="at its own address on our site."
            body="If a practitioner shows you a Trichollective certificate, you don't need to take it on trust. Here is how to check it."
          />
          <ol className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Link2,
                t: "Find the web address",
                d: `Every certificate carries a unique public address that starts with ${site.url.replace(/^https?:\/\//, "")}/certificates/ followed by its reference.`,
              },
              {
                icon: FileCheck2,
                t: "Open it on our site",
                d: "Type the address into your browser yourself, rather than following a link someone sends you. The page shows the holder's name, the course and the date.",
              },
              {
                icon: ShieldCheck,
                t: "Compare the details",
                d: `If the details don't match, or the page says it can't find the certificate, please let us know at ${site.contactEmail}.`,
              },
            ].map(({ icon: Icon, t, d }, i) => (
              <li key={t} className="flex flex-col gap-4 rounded-3xl border border-rule bg-card p-7 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="label text-muted-foreground">Step {i + 1}</span>
                  <Icon className="h-5 w-5 stroke-[1.5]" aria-hidden />
                </div>
                <p className="text-xl font-semibold leading-snug tracking-tight">{t}</p>
                <p className="text-[15px] leading-relaxed text-ink-2 break-words">{d}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Reviewer */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHeader
                eyebrow="Why a reviewer signs off"
                title="You learn only what a qualified reviewer"
                fade="has read and put their name to."
              />
            </div>
            <div className="lg:col-span-7 prose-tricho">
              <p>
                <strong>Every course is reviewed by a qualified practitioner before it opens.</strong>{" "}
                Hair and scalp care sits across cosmetic, clinical and medical practice, and the line
                between them matters. A reviewer from the right discipline checks that each lesson is
                accurate, stays within the scope of the people it&apos;s written for, and says clearly
                when a client should be referred on.
              </p>
              <p>
                Our courses are drafted with the help of AI tools and edited by our team. Nothing
                opens until a person with the right qualifications has read it and agreed to put their
                name to it. That name appears on the course page and on every certificate issued for
                it.
              </p>
              <p>
                If a reviewer asks for changes, the course waits until they are made. If guidance
                changes after a course opens, we update the lessons and the reviewer checks them again.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Questions */}
      <Section tone="paper-2">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeader eyebrow="Questions" title="Know what a certificate can and cannot say about you." />
            </div>
            <div className="lg:col-span-8">
              <FaqList faqs={faqs} />
            </div>
          </div>
        </Container>
      </Section>

      <section className="border-t border-rule bg-paper">
        <Container className="py-24 md:py-28">
          <div className="flex flex-col items-center gap-8 text-center">
            <h2 className="display text-5xl sm:text-6xl max-w-3xl">
              Learn something you will use in consultations,
              <br />
              <span className="text-fade">and show clients the proof.</span>
            </h2>
            <Button asChild size="xl">
              <Link href="/learn">
                See the courses <ArrowRight />
              </Link>
            </Button>
            <ArrowLink href="/guides">Or start with our free guides</ArrowLink>
          </div>
        </Container>
      </section>

      <JsonLd data={[breadcrumbLd(crumbs), faqLd(faqs)]} />
    </>
  );
}
