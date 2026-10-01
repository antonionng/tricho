import { images } from "@/content/images";
import { notFound } from "next/navigation";
import { DisciplineListings } from "@/components/directory/DisciplineListings";
import { disciplineBySlug } from "@/content/disciplines";
import { cityKey, listingCityPairs, searchListings } from "@/lib/directory";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 600;

async function resolve(params: Promise<{ discipline: string; city: string }>) {
  const { discipline, city } = await params;
  const d = disciplineBySlug(discipline);
  if (!d) return null;
  const pairs = await listingCityPairs();
  const match = pairs.find((p) => p.discipline === d.id && cityKey(p.city) === city);
  // Only real pages: a city page exists when someone is listed there.
  if (!match) return null;
  return { d, city: match.city, cities: pairs.filter((p) => p.discipline === d.id).map((p) => p.city) };
}

export async function generateMetadata({ params }: { params: Promise<{ discipline: string; city: string }> }) {
  const r = await resolve(params);
  if (!r) return {};
  return pageMetadata({
    title: `${r.d.plural} in ${r.city}`,
    description: `Find ${r.d.plural.toLowerCase()} in ${r.city}. ${r.d.who} Listings are checked by Trichollective before they appear.`,
    path: `/directory/${r.d.slug}/${cityKey(r.city)}`,
    og: { title: `${r.d.plural} in ${r.city}`, eyebrow: "The founding directory", img: images[r.d.imageKey].src, variant: "photo" },
  });
}

export default async function DisciplineCityPage({ params }: { params: Promise<{ discipline: string; city: string }> }) {
  const r = await resolve(params);
  if (!r) notFound();
  const listings = await searchListings({ discipline: r.d.id, city: r.city });
  return (
    <>
      <DisciplineListings discipline={r.d} city={r.city} listings={listings} cities={r.cities} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Directory", path: "/directory" },
          { name: r.d.name, path: `/directory/${r.d.slug}` },
          { name: r.city, path: `/directory/${r.d.slug}/${cityKey(r.city)}` },
        ])}
      />
    </>
  );
}
