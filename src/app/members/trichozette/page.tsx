import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Paywall } from "@/components/members/Paywall";
import { EmptyState, MemberPage, PageHeader } from "@/components/members/MemberPage";
import { longDate, monthYear } from "@/components/members/format";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { editions as library } from "@/content/gazette";
import { Cover } from "@/components/gazette/Cover";

export const metadata = { title: "Trichozette" };

export default async function GazettePage() {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/trichozette");
  if (!ctx.allowed) return <Paywall title="Trichozette" body="The monthly Trichozette is written for members." />;

  const articles = await prisma.draft.findMany({
    where: { kind: "gazette_article", status: "published" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 120,
    select: { id: true, title: true, summary: true, publishedAt: true, createdAt: true },
  });

  const editions: { month: string; items: typeof articles }[] = [];
  for (const a of articles) {
    const month = monthYear(a.publishedAt ?? a.createdAt);
    const last = editions[editions.length - 1];
    if (last?.month === month) last.items.push(a);
    else editions.push({ month, items: [a] });
  }

  return (
    <MemberPage>
      <PageHeader
        label="Monthly"
        title="Trichozette"
        lede="News, research and practice notes for hair and scalp professionals, gathered each month and written plainly."
      />

      <section aria-labelledby="library" className="mb-14">
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-rule pb-3">
          <h2 id="library" className="display text-2xl sm:text-3xl">The library</h2>
          <Link href="/news" className="text-sm underline underline-offset-4">Latest news</Link>
        </div>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {library.map((e) => (
            <li key={e.slug}>
              <Link href={`/trichozette/${e.slug}`} className="group block">
                <div className="transition-transform duration-500 group-hover:-translate-y-1">
                  <Cover edition={e} className="shadow-[0_24px_50px_-30px_rgba(0,0,0,0.5)]" />
                </div>
                <p className="mt-3 text-sm font-semibold leading-snug">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.theme}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {editions.length === 0 ? (
        <EmptyState title="This month's pieces are being prepared." body="New articles, including Karley's column, appear here as soon as they're published." />
      ) : (
        <div className="flex flex-col gap-12">
          {editions.map((ed, i) => (
            <section key={ed.month} aria-labelledby={`ed-${i}`}>
              <h2 id={`ed-${i}`} className="display mb-5 border-b border-rule pb-3 text-2xl sm:text-3xl">
                Trichozette, {ed.month}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {ed.items.map((a, j) => (
                  <li key={a.id} className={i === 0 && j === 0 ? "sm:col-span-2" : undefined}>
                    <Link
                      href={`/members/trichozette/${a.id}`}
                      className="group flex h-full flex-col rounded-2xl border border-rule bg-card p-5 transition-colors hover:border-ink/30 sm:p-6"
                    >
                      <p className="text-xs text-muted-foreground">{longDate(a.publishedAt ?? a.createdAt)}</p>
                      <h3
                        className={
                          i === 0 && j === 0
                            ? "display mt-2 text-3xl sm:text-4xl"
                            : "mt-2 text-lg font-semibold leading-snug tracking-[-0.01em]"
                        }
                      >
                        {a.title}
                      </h3>
                      {a.summary && <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-ink-2">{a.summary}</p>}
                      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium">
                        Read <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </MemberPage>
  );
}
