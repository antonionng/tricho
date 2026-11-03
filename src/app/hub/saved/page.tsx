import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireConsumer } from "@/lib/consumer-session";
import { publicListingWhere } from "@/lib/stats";
import { professionById } from "@/config/rooms";
import { unsaveListing } from "../actions";

export const metadata = { title: "Saved professionals" };

export default async function HubSavedPage() {
  const me = await requireConsumer();
  const saved = await prisma.savedListing.findMany({
    where: { userId: me.userId },
    orderBy: { createdAt: "desc" },
    select: {
      listingId: true,
      listing: { select: { id: true, name: true, slug: true, city: true, country: true, profession: true, headline: true } },
    },
  });
  // A listing that has since left the directory stays saved, but without a link.
  const live = new Set(
    (
      await prisma.directoryListing.findMany({
        where: { AND: [publicListingWhere(), { id: { in: saved.map((s) => s.listingId) } }] },
        select: { id: true },
      })
    ).map((l) => l.id)
  );

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="display text-4xl sm:text-5xl">Your saved professionals are kept here for you.</h1>
        <p className="lede max-w-2xl">Save professionals from the directory, and come back to them whenever you are ready to get in touch.</p>
      </section>
      {saved.length === 0 ? (
        <div className="space-y-4 rounded-3xl border border-rule bg-card p-6">
          <p className="text-[15px] text-ink-2">You have not saved anyone yet. Press Save on a professional&apos;s profile in the directory to keep them here.</p>
          <Link href="/directory" className="inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper">
            Search the directory
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {saved.map(({ listing }) => {
            const isLive = live.has(listing.id) && listing.slug;
            return (
              <li key={listing.id} className="flex flex-col gap-3 rounded-3xl border border-rule bg-card p-6">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-ink">{listing.name}</h2>
                  <p className="text-sm text-ink-2">
                    {[professionById(listing.profession)?.label, [listing.city, listing.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {listing.headline && <p className="text-[15px] text-ink-2">{listing.headline}</p>}
                {!isLive && <p className="text-sm text-ink-2">This professional is no longer listed in the directory.</p>}
                <div className="mt-auto flex flex-wrap gap-3 pt-2">
                  {isLive && (
                    <Link href={`/directory/p/${listing.slug}`} className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
                      View their profile
                    </Link>
                  )}
                  <form action={unsaveListing}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <button type="submit" className="rounded-full border border-rule px-4 py-2 text-sm text-ink hover:border-ink">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
