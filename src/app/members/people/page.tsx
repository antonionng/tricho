import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, Search } from "lucide-react";
import type { Prisma, Profession } from "@prisma/client";
import { Paywall } from "@/components/members/Paywall";
import { Avatar } from "@/components/members/Avatar";
import { EmptyState, MemberPage, PageHeader } from "@/components/members/MemberPage";
import { FollowButton } from "@/components/members/FollowButton";
import { SubmitButton } from "@/components/members/SubmitButton";
import { startConversation } from "./actions";
import { getMemberContext } from "@/lib/member";
import { memberDirectoryWhere } from "@/lib/community";
import { prisma } from "@/lib/prisma";
import { PROFESSIONS, professionById } from "@/config/rooms";

export const metadata = { title: "People" };

const PAGE_SIZE = 24;

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/people");
  if (!ctx.allowed) return <Paywall title="People" body="The member directory, following and messages are part of membership." />;
  const me = ctx.session.user.id;

  const { q: rawQ, page: rawPage } = await searchParams;
  const page = Math.max(1, Math.min(500, Number.parseInt(rawPage ?? "1", 10) || 1));
  const q = (rawQ ?? "").trim().slice(0, 80);
  const professionMatches = q
    ? PROFESSIONS.filter(
        (p) => p.label.toLowerCase().includes(q.toLowerCase()) || p.blurb.toLowerCase().includes(q.toLowerCase())
      ).map((p) => p.id as Profession)
    : [];

  const search: Prisma.UserWhereInput | undefined = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { chapter: { city: { contains: q, mode: "insensitive" } } },
          { profile: { location: { contains: q, mode: "insensitive" } } },
          { profile: { specialization: { contains: q, mode: "insensitive" } } },
          { profile: { practiceName: { contains: q, mode: "insensitive" } } },
          { profile: { city: { contains: q, mode: "insensitive" } } },
          { profile: { headline: { contains: q, mode: "insensitive" } } },
          { profile: { specialisms: { has: q } } },
          ...(professionMatches.length ? [{ profile: { profession: { in: professionMatches } } }] : []),
        ],
      }
    : undefined;

  const where: Prisma.UserWhereInput = { AND: [memberDirectoryWhere(), ...(search ? [search] : [])] };
  const [people, total, following] = await Promise.all([
    prisma.user.findMany({
      where,
      // Newest members first, so people met at a gathering are easy to find.
      orderBy: [{ onboardedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        image: true,
        isFounding: true,
        chapter: { select: { city: true } },
        profile: { select: { profession: true, specialization: true, location: true, city: true, practiceName: true, isVerified: true } },
      },
    }),
    prisma.user.count({ where }),
    prisma.follow.findMany({ where: { followerId: me }, select: { followeeId: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (n > 1) params.set("page", String(n));
    const qs = params.toString();
    return qs ? `/members/people?${qs}` : "/members/people";
  };
  const followingSet = new Set(following.map((f) => f.followeeId));

  return (
    <MemberPage>
      <PageHeader
        label="People"
        title="Members"
        lede="Find colleagues by name, city, practice, specialism or discipline. Follow people to see them more often, or send a message to say hello."
      />

      <form action="/members/people" role="search" className="mb-6">
        <label className="flex h-12 items-center gap-3 rounded-full border border-rule bg-card px-5 focus-within:border-ink">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <span className="sr-only">Search members</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Try a town, trichologist, a clinic or a name"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
        </label>
      </form>

      {q && (
        <p className="mb-4 text-sm text-muted-foreground">
          {total === 0 ? "No members match" : `${total} ${total === 1 ? "member matches" : "members match"}`} “{q}”.{" "}
          <Link href="/members/people" className="underline underline-offset-4">
            Clear the search
          </Link>
        </p>
      )}

      {people.length === 0 ? (
        <EmptyState
          title={q ? "Nobody by that description yet" : "The directory is filling up"}
          body={
            q
              ? "Try a city, a discipline such as clinical or cosmetic, or part of a name."
              : "Members appear here once they've finished settling in."
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {people.map((p) => {
            const discipline = p.profile?.profession ? professionById(p.profile.profession)?.label : null;
            const place = p.profile?.city || p.chapter?.city || p.profile?.location;
            return (
              <li key={p.id} className="flex flex-col gap-3 rounded-2xl border border-rule bg-card p-4">
                <Link href={`/members/people/${p.id}`} className="flex min-w-0 items-center gap-3 rounded-xl">
                  <Avatar name={p.name} src={p.image} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.name || "Member"}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">
                      {[discipline, p.profile?.practiceName || p.profile?.specialization, place].filter(Boolean).join(" · ") || "Member"}
                    </span>
                  </span>
                </Link>
                {p.id !== me ? (
                  <div className="flex flex-wrap gap-2">
                    <FollowButton userId={p.id} following={followingSet.has(p.id)} />
                    <form action={startConversation}>
                      <input type="hidden" name="userId" value={p.id} />
                      <SubmitButton variant="outline" size="default" pending="Opening…" className="h-10 rounded-full text-[13px]">
                        <MessageCircle className="h-4 w-4" /> Message
                      </SubmitButton>
                    </form>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">This is you.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-8 flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="inline-flex h-11 items-center rounded-full border border-rule px-5 text-sm font-medium hover:border-ink/40">
              Newer members
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className="inline-flex h-11 items-center rounded-full border border-rule px-5 text-sm font-medium hover:border-ink/40">
              Earlier members
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </MemberPage>
  );
}
