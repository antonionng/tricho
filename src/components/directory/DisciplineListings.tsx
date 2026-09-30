import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, SectionHeader } from "@/components/site/primitives";
import { ListingCard } from "@/components/directory/ListingCard";
import { Button } from "@/components/ui/button";
import { guides } from "@/content/guides";
import type { Discipline } from "@/content/disciplines";
import type { PublicListing } from "@/lib/directory";
import { cityKey } from "@/lib/directory";
import { FREE_LISTING_DAYS } from "@/config/subscriptions";

/** Shared layout for /directory/[discipline] and /directory/[discipline]/[city]. */
export function DisciplineListings({
  discipline,
  city,
  listings,
  cities,
}: {
  discipline: Discipline;
  city?: string;
  listings: PublicListing[];
  cities: string[];
}) {
  const place = city ? ` in ${city}` : " in Ireland and the UK";
  const related = guides.filter((g) => g.related.discipline === discipline.id).slice(0, 3);

  return (
    <>
      <section className="border-b border-rule">
        <Container className="py-16 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
            <Link href="/directory" className="hover:text-ink">Directory</Link>
            <span className="mx-2">/</span>
            {city ? (
              <>
                <Link href={`/directory/${discipline.slug}`} className="hover:text-ink">{discipline.name}</Link>
                <span className="mx-2">/</span>
                <span className="text-ink">{city}</span>
              </>
            ) : (
              <span className="text-ink">{discipline.name}</span>
            )}
          </nav>
          <SectionHeader
            as="h1"
            eyebrow={discipline.name}
            title={`${discipline.plural}${place}`}
            body={`${discipline.who} ${discipline.role}`}
          />
          <ul className="mt-8 flex flex-wrap gap-2">
            {discipline.helpsWith.map((h) => (
              <li key={h} className="rounded-full border border-rule bg-card px-3.5 py-1.5 text-sm text-ink-2">
                {h}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Container className="py-14 md:py-20">
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
            <p className="display text-3xl">No one is listed here yet.</p>
            <p className="mx-auto mt-3 max-w-lg text-ink-2">
              Search the whole directory, or if you practise here, add your founding listing, free for{" "}
              {FREE_LISTING_DAYS} days.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild variant="outline"><Link href="/directory">Search everyone</Link></Button>
              <Button asChild><Link href="/directory/list">Add your listing <ArrowRight /></Link></Button>
            </div>
          </div>
        )}

        {cities.length > 1 && (
          <nav className="mt-16 border-t border-rule pt-10" aria-label="Other cities">
            <p className="label text-muted-foreground mb-4">{discipline.name} professionals by city</p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {cities.map((c) => (
                <li key={c}>
                  <Link href={`/directory/${discipline.slug}/${cityKey(c)}`} className="text-[15px] text-ink-2 hover:text-ink">
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {related.length > 0 && (
          <section className="mt-16 border-t border-rule pt-10">
            <p className="label text-muted-foreground mb-6">Helpful guides</p>
            <ul className="grid gap-5 md:grid-cols-3">
              {related.map((g) => (
                <li key={g.slug}>
                  <Link href={`/guides/${g.slug}`} className="block rounded-2xl border border-rule bg-card p-6 hover:border-ink/30">
                    <p className="font-semibold leading-snug">{g.title}</p>
                    <p className="mt-2 text-sm text-ink-2 line-clamp-3">{g.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </>
  );
}
