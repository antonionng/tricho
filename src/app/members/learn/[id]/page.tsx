import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Paywall } from "@/components/members/Paywall";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";

export default async function LearnPiecePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getMemberContext();
  if (!ctx.session) redirect("/login");
  if (!ctx.allowed) {
    return <Paywall title="Learn" body="Education pieces are part of membership." />;
  }

  const { id } = await params;
  const piece = await prisma.educationPiece.findUnique({ where: { id } });
  if (!piece || !piece.published) notFound();

  const prompt = encodeURIComponent(
    `Help me apply this Trichollective education piece in practice: "${piece.title}". Summary: ${piece.summary}`
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
      <Link href="/members/learn" className="text-sm text-muted-foreground hover:text-foreground">
        ← Learn
      </Link>
      <article className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 space-y-5 shadow-sm">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="capitalize rounded-2xl bg-muted px-2 py-0.5">{piece.audience}</span>
          <span className="capitalize rounded-2xl bg-muted px-2 py-0.5">{piece.kind}</span>
        </div>
        <h1 className="tricho-title text-3xl md:text-4xl">
          {piece.title}
        </h1>
        <p className="text-muted-foreground leading-relaxed">{piece.summary}</p>
        <div className="prose-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {piece.body}
        </div>
      </article>
      <Button asChild className="rounded-2xl">
        <Link href={`/members/assistant?q=${prompt}`}>Ask Tricho-AI about this</Link>
      </Button>
    </div>
  );
}
