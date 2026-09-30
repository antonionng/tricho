import { images } from "@/content/images";
import { notFound } from "next/navigation";
import { DisciplineListings } from "@/components/directory/DisciplineListings";
import { DISCIPLINES, disciplineBySlug } from "@/content/disciplines";
import { listingCityPairs, searchListings } from "@/lib/directory";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 600;

export function generateStaticParams() {
  return DISCIPLINES.map((d) => ({ discipline: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ discipline: string }> }) {
  const d = disciplineBySlug((await params).discipline);
  if (!d) return {};
  return pageMetadata({
    title: `${d.plural} in Ireland and the UK`,
    description: `Find ${d.plural.toLowerCase()} near you. ${d.who} Every listing in the Trichollective directory is checked by a person.`,
    path: `/directory/${d.slug}`,
    og: { title: d.plural, eyebrow: "The founding directory", img: images[d.imageKey].src, variant: "photo" },
  });
}

export default async function DisciplinePage({ params }: { params: Promise<{ discipline: string }> }) {
  const d = disciplineBySlug((await params).discipline);
  if (!d) notFound();
  const [listings, pairs] = await Promise.all([searchListings({ discipline: d.id }), listingCityPairs()]);
  return (
    <>
      <DisciplineListings
        discipline={d}
        listings={listings}
        cities={pairs.filter((p) => p.discipline === d.id).map((p) => p.city)}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: "Directory", path: "/directory" },
          { name: d.name, path: `/directory/${d.slug}` },
        ])}
      />
    </>
  );
}
