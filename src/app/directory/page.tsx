import Link from "next/link";
import { MapPin, Search, Verified } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const profiles = await prisma.trichologistProfile.findMany({
    where: query
      ? {
          OR: [
            { specialization: { contains: query, mode: "insensitive" } },
            { location: { contains: query, mode: "insensitive" } },
            { bio: { contains: query, mode: "insensitive" } },
            { user: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: { user: { select: { name: true, role: true } } },
    orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="min-h-screen bg-[#D1D0CB]">
      <section className="py-20 border-b border-black/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <span className="tricho-caps text-black/40">The Professional Network</span>
            <h1 className="text-5xl md:text-7xl tricho-title uppercase text-black tracking-tighter">
              The Directory
            </h1>
            <p className="text-lg font-sans font-medium text-black/60 max-w-2xl mx-auto">
              Trichologists, doctors, and stylists in the collective. Verified listings are
              checked by Trichollective.
            </p>
            <form action="/directory" className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black/40" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search by name, specialisation, or city"
                className="w-full pl-12 h-14 border border-black/20 bg-white/50 outline-none text-sm"
              />
            </form>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          {profiles.length === 0 ? (
            <div className="max-w-xl mx-auto text-center space-y-6 border border-black/10 bg-white/30 p-12">
              <p className="font-sans font-medium text-black/70">
                {query
                  ? `No listings match “${query}”.`
                  : "The directory is open. Members publish their own listing from inside the collective."}
              </p>
              <Button
                asChild
                className="tricho-caps rounded-none bg-black text-[#D1D0CB] h-12 px-8"
              >
                <Link href="/members/profile">List your practice</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((pro) => (
                <article
                  key={pro.id}
                  className="border border-black/10 bg-white/30 p-8 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-sans font-black uppercase tracking-tight text-xl leading-tight">
                      {pro.user.name || "Member"}
                    </h2>
                    {pro.isVerified && <Verified className="h-4 w-4 shrink-0" />}
                  </div>
                  <p className="tricho-caps text-[10px] text-black/50">
                    {pro.specialization || pro.user.role}
                  </p>
                  {pro.location && (
                    <p className="flex items-center text-xs font-sans font-medium text-black/50">
                      <MapPin className="h-3 w-3 mr-1" />
                      {pro.location}
                    </p>
                  )}
                  {pro.bio && (
                    <p className="font-sans text-sm text-black/70 line-clamp-4">{pro.bio}</p>
                  )}
                  {pro.website && (
                    <a
                      href={pro.website.startsWith("http") ? pro.website : `https://${pro.website}`}
                      className="tricho-caps text-[10px] border-b border-black pb-0.5 inline-block"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Website
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
