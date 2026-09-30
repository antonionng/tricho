import { images } from "@/content/images";
import Link from "next/link";
import { Container } from "@/components/site/primitives";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { FindFlow } from "./FindFlow";
import { guides } from "@/content/guides";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Who should I see about my hair or scalp?",
  description:
    "Answer three quick questions and we'll suggest whether a head spa therapist, trichologist or doctor is the right place to start. Signposting, not diagnosis.",
  path: "/find",
    og: { title: "Find out who to see about your hair or scalp", sub: "by answering three short questions.", eyebrow: "Find the right professional", img: images.ed05.src, variant: "photo" },
});

export default function FindPage() {
  return (
    <Container className="py-16 md:py-24">
      <div className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-4 flex flex-col gap-5">
          <p className="label text-muted-foreground">Find the right professional</p>
          <h1 className="display text-5xl">
            Find out who to see about your hair or scalp
            <br />
            <span className="text-fade">by answering three short questions.</span>
          </h1>
          <p className="text-ink-2">
            Hair and scalp care spans three kinds of professional. These questions help you choose where to
            start. We don&apos;t diagnose, and we&apos;ll always tell you when a doctor should see you first.
          </p>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <FindFlow />
        </div>
      </div>

      <div className="mt-24 grid gap-12 border-t border-rule pt-14 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="label text-muted-foreground mb-6">Read before you book</p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {guides.slice(0, 4).map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`} className="block h-full rounded-2xl border border-rule bg-card p-5 hover:border-ink/30">
                  <p className="font-semibold leading-snug">{g.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{g.readingMinutes} minute read</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-4 lg:col-start-9 flex flex-col gap-4">
          <p className="font-semibold">Plain-English scalp care, once a month</p>
          <p className="text-sm text-ink-2">Guides and advice from professionals, straight to your inbox.</p>
          <NewsletterForm source="find" />
        </div>
      </div>
    </Container>
  );
}
