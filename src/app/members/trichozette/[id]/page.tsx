import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Paywall } from "@/components/members/Paywall";
import { MemberPage } from "@/components/members/MemberPage";
import { PlainTextBody } from "@/components/members/PlainTextBody";
import { longDate, monthYear } from "@/components/members/format";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Trichozette" };

export default async function GazetteArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/trichozette");
  if (!ctx.allowed) return <Paywall title="Trichozette" body="The monthly Trichozette is written for members." />;

  const { id } = await params;
  const article = await prisma.draft.findFirst({
    where: { id, kind: "gazette_article", status: "published" },
    select: { title: true, summary: true, body: true, publishedAt: true, createdAt: true },
  });
  if (!article) notFound();
  const date = article.publishedAt ?? article.createdAt;

  return (
    <MemberPage size="narrow">
      <Link href="/members/trichozette" className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Trichozette
      </Link>
      <article className="mt-4">
        <p className="label text-muted-foreground">Trichozette, {monthYear(date)}</p>
        <h1 className="display mt-4 text-[2.4rem] sm:text-5xl">{article.title}</h1>
        {article.summary && <p className="lede mt-5">{article.summary}</p>}
        <p className="mt-5 border-b border-rule pb-6 text-sm text-muted-foreground">{longDate(date)}</p>
        <PlainTextBody text={article.body} className="mt-8" />
      </article>
    </MemberPage>
  );
}
