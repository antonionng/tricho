import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/site/primitives";
import { Paywall } from "@/components/members/Paywall";
import { MemberPage } from "@/components/members/MemberPage";
import { PlainTextBody } from "@/components/members/PlainTextBody";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Learn" };

export default async function LearnPiecePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/learn");
  if (!ctx.allowed) return <Paywall title="Learn" body="The library is part of membership." />;

  const { id } = await params;
  const piece = await prisma.educationPiece.findUnique({ where: { id } });
  if (!piece || !piece.published) notFound();

  const prompt = encodeURIComponent(
    `Help me apply this Trichollective piece in practice: "${piece.title}". Summary: ${piece.summary}`
  );

  return (
    <MemberPage size="narrow">
      <Link href="/members/learn" className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Learn
      </Link>
      <article className="mt-4">
        <div className="flex flex-wrap gap-1.5">
          <Pill className="capitalize">{piece.audience}</Pill>
          <Pill className="capitalize">{piece.kind}</Pill>
        </div>
        <h1 className="display mt-4 text-[2.4rem] sm:text-5xl">{piece.title}</h1>
        <p className="lede mt-5 border-b border-rule pb-6">{piece.summary}</p>
        <PlainTextBody text={piece.body} className="mt-8" />
      </article>
      {ctx.professional && (
        <Button asChild size="lg" variant="outline" className="mt-10">
          <Link href={`/members/assistant?q=${prompt}`}>
            <Sparkles className="h-4 w-4" /> Ask the Assistant about this
          </Link>
        </Button>
      )}
    </MemberPage>
  );
}
