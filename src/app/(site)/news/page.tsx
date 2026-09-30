import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/site/primitives";
import { NewsEntry } from "@/components/news/NewsEntry";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { Button } from "@/components/ui/button";
import { news } from "@/content/news";
import { getMemberContext } from "@/lib/member";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = pageMetadata({
  title: "Hair and scalp news for professionals",
  description:
    "The latest news for cosmetic, clinical and medical hair professionals in the UK and Ireland: regulation, treatments, research and product safety, with sources.",
  path: "/news",
    og: { title: "Here is what is changing in hair", sub: "and scalp care right now.", eyebrow: "Trichozette · News" },
});

const FILTERS = [
  { id: "", label: "All news" },
  { id: "cosmetic", label: "Cosmetic" },
  { id: "clinical", label: "Clinical" },
  { id: "medical", label: "Medical" },
] as const;

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d = "" } = await searchParams;
  const ctx = await getMemberContext();
  const items = d ? news.filter((n) => n.disciplines.includes(d as "cosmetic")) : news;

  return (
    <>
      <section className="border-b border-rule">
        <Container className="py-16 md:py-20">
          <SectionHeader
            as="h1"
            eyebrow="Trichozette · News"
            title="Here is what is changing in hair"
            fade="and scalp care right now."
            body="Real news from regulators, professional bodies and researchers, summarised plainly with a link to every source. Members also get a note on why each story matters in practice."
          />
          <nav className="mt-10 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" aria-label="Filter by discipline">
            {FILTERS.map((f) => (
              <Link
                key={f.id || "all"}
                href={f.id ? `/news?d=${f.id}` : "/news"}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm",
                  d === f.id ? "border-ink bg-ink text-paper" : "border-rule bg-card text-ink-2 hover:border-ink/40"
                )}
              >
                {f.label}
              </Link>
            ))}
          </nav>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="grid gap-14 lg:grid-cols-12">
            <ol className="lg:col-span-8 flex flex-col divide-y divide-rule border-y border-rule">
              {items.map((item) => (
                <li key={item.id} className="py-8">
                  <NewsEntry item={item} showWhy={ctx.allowed} lockedHref="/founding" />
                </li>
              ))}
            </ol>
            <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-3xl bg-ink p-7 text-paper">
                <p className="label text-paper/60">For members</p>
                <p className="display mt-3 text-3xl leading-tight">What it means for your practice.</p>
                <p className="mt-3 text-[15px] leading-relaxed text-paper/75">
                  Members see why each story matters, read it alongside Trichozette, and discuss it with colleagues
                  from every discipline.
                </p>
                <Button asChild variant="paper" className="mt-6">
                  <Link href="/founding">Become a founding member <ArrowRight /></Link>
                </Button>
              </div>
              <div className="rounded-3xl border border-rule bg-card p-7">
                <p className="font-semibold">The month&apos;s news, by email</p>
                <p className="mt-2 text-sm text-ink-2">A short round-up in the monthly newsletter.</p>
                <NewsletterForm source="news" className="mt-4" />
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: items.map((n, i) => ({ "@type": "ListItem", position: i + 1, url: n.url, name: n.headline })),
          },
          breadcrumbLd([
            { name: "Trichozette", path: "/trichozette" },
            { name: "News", path: "/news" },
          ]),
        ]}
      />
    </>
  );
}
