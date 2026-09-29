import Link from "next/link";
import { redirect } from "next/navigation";
import { Paywall } from "@/components/members/Paywall";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";

export default async function LearnPage() {
  const ctx = await getMemberContext();
  if (!ctx.session) redirect("/login");
  if (!ctx.allowed) {
    return (
      <Paywall title="Learn" body="The education library is part of membership." />
    );
  }

  const pieces = await prisma.educationPiece.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const preferred = ctx.profession || "everyone";
  const sorted = [...pieces].sort((a, b) => {
    const aScore = a.audience === preferred ? 0 : a.audience === "everyone" ? 1 : 2;
    const bScore = b.audience === preferred ? 0 : b.audience === "everyone" ? 1 : 2;
    return aScore - bScore || a.sortOrder - b.sortOrder;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary uppercase tracking-wide">Learn</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Education that is useful on day one
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Short, evidence-cautious pieces from Trichollective HQ. Pieces for your profession sit at
          the top.
        </p>
      </header>

      <div className="grid gap-4">
        {sorted.length === 0 && (
          <p className="rounded-2xl border border-border/50 bg-card p-8 text-sm text-muted-foreground">
            Education is being published. Check back shortly.
          </p>
        )}
        {sorted.map((piece) => (
          <Link
            key={piece.id}
            href={`/members/learn/${piece.id}`}
            className="rounded-2xl border border-border/50 bg-card p-6 space-y-2 shadow-sm hover:border-primary/30 transition-colors"
          >
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="capitalize rounded-full bg-muted px-2 py-0.5">{piece.audience}</span>
              <span className="capitalize rounded-full bg-muted px-2 py-0.5">{piece.kind}</span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight">{piece.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{piece.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
