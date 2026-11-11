import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PlainTextBody } from "@/components/members/PlainTextBody";
import { prisma } from "@/lib/prisma";
import { requireConsumer } from "@/lib/consumer-session";

/** A library piece written for the public. Pieces for professionals are never shown here. */
export default async function HubReadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireConsumer();
  const { id } = await params;
  const piece = await prisma.educationPiece.findUnique({ where: { id } });
  if (!piece || !piece.published || piece.audience !== "public") notFound();

  return (
    <article className="mx-auto max-w-2xl">
      <Link href="/hub" className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to your reading
      </Link>
      <h1 className="display mt-4 text-[2.4rem] sm:text-5xl">{piece.title}</h1>
      <p className="lede mt-5 border-b border-rule pb-6">{piece.summary}</p>
      <PlainTextBody text={piece.body} className="mt-8" />
    </article>
  );
}
