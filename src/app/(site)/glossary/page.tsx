import Link from "next/link";
import { Container, SectionHeader } from "@/components/site/primitives";
import { glossary } from "@/content/glossary";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Hair and scalp glossary",
  description:
    "Short, plain definitions of the hair and scalp terms clients and professionals use, from alopecia areata to telogen effluvium and trichoscopy.",
  path: "/glossary",
    og: { title: "The words,", sub: "explained.", eyebrow: "Glossary" },
});

export default function GlossaryPage() {
  const sorted = [...glossary].sort((a, b) => a.term.localeCompare(b.term));
  const letters = [...new Set(sorted.map((t) => t.term[0].toUpperCase()))];
  return (
    <Container className="py-16 md:py-24">
      <SectionHeader as="h1" eyebrow="Glossary" title="The words," fade="explained." body="Terms you'll hear from professionals and read in our guides, defined in a sentence or two." />
      <div className="mt-14 flex flex-col gap-12">
        {letters.map((L) => (
          <section key={L} className="grid gap-6 border-t border-rule pt-8 md:grid-cols-12">
            <h2 className="display text-4xl md:col-span-2">{L}</h2>
            <ul className="grid gap-x-10 gap-y-6 md:col-span-10 md:grid-cols-2">
              {sorted.filter((t) => t.term[0].toUpperCase() === L).map((t) => (
                <li key={t.slug}>
                  <Link href={`/glossary/${t.slug}`} className="group block">
                    <p className="font-semibold group-hover:underline underline-offset-4">{t.term}</p>
                    <p className="mt-1 text-[15px] text-ink-2">{t.short}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Container>
  );
}
