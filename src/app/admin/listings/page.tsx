import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { reviewListing } from "@/app/directory/actions";
import { professionById } from "@/config/rooms";

export default async function AdminListingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  const pending = await prisma.directoryListing.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
  });
  const recent = await prisma.directoryListing.findMany({
    where: { status: { in: ["listed", "rejected"] } },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-3xl space-y-10">
        <header className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Admin
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Directory reviews</h1>
          <p className="text-muted-foreground">
            Free submissions wait here until you approve them. Phone numbers stay private.
          </p>
          <Link href="/directory" className="text-sm text-primary hover:underline">
            Open public directory
          </Link>
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            Pending ({pending.length})
          </h2>
          {pending.length === 0 && (
            <p className="rounded-2xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
              No listings waiting.
            </p>
          )}
          {pending.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border/50 bg-card p-6 space-y-3 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {professionById(item.profession)?.label} · {item.city}
                  </p>
                </div>
                <span className="text-xs rounded-full bg-amber-100 text-amber-900 px-3 py-1">
                  Pending
                </span>
              </div>
              {item.specialization && (
                <p className="text-sm">{item.specialization}</p>
              )}
              {item.bio && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.bio}</p>
              )}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Email: {item.email}</p>
                {item.phone && <p>Phone (private): {item.phone}</p>}
                {item.website && <p>Website: {item.website}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <form action={reviewListing}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <Button type="submit" className="rounded-full h-10 px-5">
                    Approve
                  </Button>
                </form>
                <form action={reviewListing}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <Button type="submit" variant="outline" className="rounded-full h-10 px-5">
                    Reject
                  </Button>
                </form>
              </div>
            </article>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Recent decisions</h2>
          {recent.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border/40 px-4 py-3 text-sm"
            >
              <span>
                {item.name} · {item.city}
              </span>
              <span className="text-muted-foreground capitalize">{item.status}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
