import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { professionById } from "@/config/rooms";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const listings = await prisma.directoryListing.findMany({
    where: {
      status: "listed",
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { city: { contains: query, mode: "insensitive" } },
              { specialization: { contains: query, mode: "insensitive" } },
              { bio: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ kind: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 md:py-20 border-b border-border/40">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <p className="tricho-caps text-foreground/40">Find someone</p>
            <h1 className="tricho-title text-4xl md:text-6xl text-foreground">
              The Directory
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Professionals who have asked to be listed. Members are marked. Listings are reviewed
              by Trichollective — nothing invented.
            </p>
            <form action="/directory" className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search by name, specialisation, or city"
                className="w-full pl-12 h-14 rounded-2xl border border-black/10 bg-card/80 outline-none text-sm focus:ring-2 focus:ring-foreground/15"
              />
            </form>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button asChild className="rounded-2xl h-11 px-6">
                <Link href="/directory/list">List your practice (free)</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-2xl h-11 px-6">
                <Link href="/join">Become a member</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          {listings.length === 0 ? (
            <div className="max-w-xl mx-auto text-center space-y-6 rounded-2xl border border-border/50 bg-card p-10 shadow-sm">
              <p className="text-muted-foreground leading-relaxed">
                {query
                  ? `No listings match “${query}” yet. Try another city, or list your own practice.`
                  : "These are the professionals who have asked to be listed. The directory grows as people submit and as members join after each Trichollective conference."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="rounded-2xl h-11 px-6">
                  <Link href="/directory/list">List your practice</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl h-11 px-6">
                  <Link href="/find">Who should I see?</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((pro) => (
                <article
                  key={pro.id}
                  className="rounded-2xl border border-border/50 bg-card p-7 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-semibold tracking-tight leading-tight">
                      {pro.name}
                    </h2>
                    <span
                      className={`text-[11px] font-medium rounded-2xl px-2.5 py-1 shrink-0 ${
                        pro.kind === "member"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {pro.kind === "member" ? "Member" : "Listed"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {professionById(pro.profession)?.label}
                    {pro.specialization ? ` · ${pro.specialization}` : ""}
                  </p>
                  <p className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mr-1.5" />
                    {pro.city}
                  </p>
                  {pro.bio && (
                    <p className="text-sm text-foreground/80 line-clamp-4 leading-relaxed">
                      {pro.bio}
                    </p>
                  )}
                  {pro.website && (
                    <a
                      href={
                        pro.website.startsWith("http") ? pro.website : `https://${pro.website}`
                      }
                      className="text-sm text-primary hover:underline inline-block"
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
