import { images } from "@/content/images";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, SectionHeader } from "@/components/site/primitives";
import { DirectorySearch } from "@/components/site/DirectorySearch";
import { ListingCard } from "@/components/directory/ListingCard";
import { Button } from "@/components/ui/button";
import { DISCIPLINES, type DisciplineId } from "@/content/disciplines";
import { listingCityPairs, searchListings, cityKey } from "@/lib/directory";
import { FREE_LISTING_DAYS } from "@/config/subscriptions";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = pageMetadata({
  title: "Find a hair and scalp professional near you",
  description:
    "Search head spa therapists, stylists, trichologists, nurses and doctors across Ireland and the UK. Every listing in the Trichollective directory is checked by a person.",
  path: "/directory",
    og: { title: "Find the right hair and scalp professional", sub: "close to where you live.", eyebrow: "The founding directory", img: images.clinic.src, variant: "photo" },
});

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; discipline?: string }>;
}) {
  const { q = "", discipline = "" } = await searchParams;
  const disciplineId = DISCIPLINES.some((d) => d.id === discipline) ? (discipline as DisciplineId) : undefined;
  const [listings, pairs] = await Promise.all([
    searchListings({ q, discipline: disciplineId }),
    listingCityPairs(),
  ]);
  const filtered = !!(q || disciplineId);

  const chip = (id: string, label: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (id) params.set("discipline", id);
    const active = (discipline || "") === id;
    return (
      <Link
        key={id || "all"}
        href={`/directory${params.size ? `?${params}` : ""}`}
        aria-current={active ? "page" : undefined}
        className={cn(
          "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
          active ? "border-ink bg-ink text-paper" : "border-rule bg-card text-ink-2 hover:border-ink/40"
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      <section className="border-b border-rule">
        <Container className="py-16 md:py-20">
          <SectionHeader
            as="h1"
            eyebrow="The founding directory"
            title="Find the right hair and scalp professional"
            fade="close to where you live."
            body="Cosmetic, clinical and medical hair and scalp professionals across Ireland and the UK. A person checks every listing before it appears."
          />
          <div className="mt-10 max-w-3xl">
            <DirectorySearch defaultQuery={q} defaultDiscipline={discipline} />
          </div>
          <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {chip("", "Everyone")}
            {DISCIPLINES.map((d) => chip(d.id, d.name))}
          </div>
        </Container>
      </section>

      <Container className="py-14 md:py-20">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <p className="text-[15px] text-ink-2" aria-live="polite">
            {listings.length === 0
              ? "No professionals match that search yet."
              : `${listings.length} ${listings.length === 1 ? "professional" : "professionals"}${filtered ? " match your search" : ""}`}
          </p>
          <Link href="/find" className="text-sm text-ink underline underline-offset-4">
            Not sure who you need? Answer three questions
          </Link>
        </div>

        {listings.length > 0 ? (
          <ul className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((l) => (
              <li key={l.id}>
                <ListingCard listing={l} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-3xl border border-rule bg-card p-10 text-center">
            <p className="display text-3xl">The directory is filling up.</p>
            <p className="mx-auto mt-3 max-w-lg text-ink-2">
              Try a nearby city or a different discipline. If you&apos;re a professional in this area,
              you could be the first listed here.
            </p>
            <Button asChild className="mt-6">
              <Link href="/directory/list">
                Add your founding listing <ArrowRight />
              </Link>
            </Button>
          </div>
        )}
      </Container>

      <section className="border-t border-rule bg-paper-2">
        <Container className="py-16 md:py-20">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5 flex flex-col gap-5">
              <p className="label text-muted-foreground">For professionals</p>
              <h2 className="display text-4xl">
                Be in the founding directory.
                <br />
                <span className="text-fade">Free for {FREE_LISTING_DAYS} days.</span>
              </h2>
              <p className="text-ink-2">
                Add a basic listing at no cost. Claim it with the Professional plan to add your photo,
                services and website, and to receive enquiries from the public directly.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/directory/list">Add your listing</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/pricing#professional">See the Professional plan</Link>
                </Button>
              </div>
            </div>
            <nav className="lg:col-span-7" aria-label="Browse by discipline and city">
              <p className="label text-muted-foreground mb-5">Browse</p>
              <div className="grid gap-8 sm:grid-cols-3">
                {DISCIPLINES.map((d) => (
                  <div key={d.id}>
                    <Link href={`/directory/${d.slug}`} className="font-medium text-ink hover:underline">
                      {d.name}
                    </Link>
                    <ul className="mt-3 flex flex-col gap-2">
                      {pairs
                        .filter((p) => p.discipline === d.id)
                        .slice(0, 8)
                        .map((p) => (
                          <li key={p.city}>
                            <Link
                              href={`/directory/${d.slug}/${cityKey(p.city)}`}
                              className="text-sm text-ink-2 hover:text-ink"
                            >
                              {p.city}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </nav>
          </div>
        </Container>
      </section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Directory", path: "/directory" }])} />
    </>
  );
}
