import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Newspaper, Sparkles } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Paywall } from "@/components/members/Paywall";
import { EmptyState, MemberPage, PageHeader, SectionLabel } from "@/components/members/MemberPage";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { courses } from "@/content/courses";
import { images, img } from "@/content/images";

export const metadata = { title: "Learn" };

const AUDIENCE: Record<string, string> = {
  everyone: "Everyone",
  cosmetic: "Cosmetic",
  clinical: "Clinical",
  medical: "Medical",
  brand: "Business",
};

export default async function LearnPage() {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/learn");
  if (!ctx.allowed) return <Paywall title="Learn" body="The library and member prices on courses are part of membership." />;

  const pieces = await prisma.educationPiece.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  const preferred = ctx.profession || "everyone";
  const rank = (a: string) => (a === preferred ? 0 : a === "everyone" ? 1 : 2);
  const sorted = [...pieces].sort((a, b) => rank(a.audience) - rank(b.audience) || a.sortOrder - b.sortOrder);
  const sortedCourses = [...courses].sort(
    (a, b) => Number(b.discipline === ctx.profession) - Number(a.discipline === ctx.profession)
  );

  return (
    <MemberPage>
      <PageHeader
        label="Learn"
        title="Learn"
        lede="Short, careful pieces you can use this week, and courses written with practitioners from each discipline."
      />

      <div className="mb-10 grid gap-3 sm:grid-cols-2">
        <Link
          href="/members/trichozette"
          className="group flex items-start gap-4 rounded-2xl border border-rule bg-card p-5 transition-colors hover:border-ink/30"
        >
          <Newspaper className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.6]" />
          <span className="min-w-0">
            <span className="block font-semibold">Trichozette</span>
            <span className="mt-1 block text-sm leading-relaxed text-ink-2">
              Read the monthly edition on research, practice and news from across the collective.
            </span>
          </span>
        </Link>
        <Link
          href="/members/assistant"
          className="group flex items-start gap-4 rounded-2xl border border-rule bg-card p-5 transition-colors hover:border-ink/30"
        >
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.6]" />
          <span className="min-w-0">
            <span className="block font-semibold">Assistant</span>
            <span className="mt-1 block text-sm leading-relaxed text-ink-2">
              Ask a question about hair and scalp practice and get a careful, considered answer straight away.
            </span>
          </span>
        </Link>
      </div>

      <section className="mb-12">
        <SectionLabel>Courses</SectionLabel>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCourses.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/courses/${c.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-rule bg-card transition-colors hover:border-ink/30"
              >
                <div className="relative aspect-[16/9] bg-paper-2">
                  <Image
                    src={img(images[c.imageKey], 640)}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 100vw"
                    className="object-cover grayscale-[20%]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {c.status === "coming-soon" ? <Pill>Opening soon</Pill> : <Pill tone="positive">Open</Pill>}
                    <Pill>{c.hours} hours</Pill>
                  </div>
                  <h3 className="mt-3 font-semibold leading-snug">{c.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-ink-2">{c.summary}</p>
                  <p className="mt-auto flex items-center justify-between pt-4 text-sm">
                    <span className="text-muted-foreground">
                      {c.memberPriceGBP === 0 ? "Free for members" : `£${c.memberPriceGBP} for members`}
                    </span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionLabel>The library</SectionLabel>
        {sorted.length === 0 ? (
          <EmptyState
            title="The library is being written"
            body="Pieces are reviewed by a practitioner before they appear here. The first few are on their way."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {sorted.map((piece) => (
              <li key={piece.id}>
                <Link
                  href={`/members/learn/${piece.id}`}
                  className="flex h-full flex-col rounded-2xl border border-rule bg-card p-5 transition-colors hover:border-ink/30"
                >
                  <div className="flex flex-wrap gap-1.5">
                    <Pill>{AUDIENCE[piece.audience] ?? piece.audience}</Pill>
                    <Pill className="capitalize">{piece.kind}</Pill>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold leading-snug tracking-[-0.01em]">{piece.title}</h3>
                  <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink-2">{piece.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </MemberPage>
  );
}
