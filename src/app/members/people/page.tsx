import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import type { Prisma, Profession } from "@prisma/client";
import { Paywall } from "@/components/members/Paywall";
import { Avatar } from "@/components/members/Avatar";
import { EmptyState, MemberPage, PageHeader } from "@/components/members/MemberPage";
import { FollowButton } from "@/components/members/FollowButton";
import { getMemberContext } from "@/lib/member";
import { memberDirectoryWhere } from "@/lib/community";
import { prisma } from "@/lib/prisma";
import { PROFESSIONS, professionById } from "@/config/rooms";

export const metadata = { title: "People" };

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/people");
  if (!ctx.allowed) return <Paywall title="People" body="The member directory, following and messages are part of membership." />;
  const me = ctx.session.user.id;

  const { q: rawQ } = await searchParams;
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
          ...(professionMatches.length ? [{ profile: { profession: { in: professionMatches } } }] : []),
        ],
      }
    : undefined;

  const [people, following] = await Promise.all([
    prisma.user.findMany({
      where: { AND: [memberDirectoryWhere(), ...(search ? [search] : [])] },
      orderBy: [{ name: "asc" }],
      take: 60,
      select: {
        id: true,
        name: true,
        isFounding: true,
        chapter: { select: { city: true } },
        profile: { select: { profession: true, specialization: true, location: true } },
      },
    }),
    prisma.follow.findMany({ where: { followerId: me }, select: { followeeId: true } }),
  ]);
  const followingSet = new Set(following.map((f) => f.followeeId));

  return (
    <MemberPage>
      <PageHeader
        label="People"
        title="Members"
        lede="Find colleagues by name, city or discipline. Follow people to see them more often, or send a message to say hello."
      />

      <form action="/members/people" role="search" className="mb-6">
        <label className="flex h-12 items-center gap-3 rounded-full border border-rule bg-card px-5 focus-within:border-ink">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <span className="sr-only">Search members</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Try Dublin, trichologist or a name"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
        </label>
      </form>

      {q && (
        <p className="mb-4 text-sm text-muted-foreground">
          {people.length === 0 ? "No members match" : `${people.length} ${people.length === 1 ? "member matches" : "members match"}`} “{q}”.{" "}
          <Link href="/members/people" className="underline underline-offset-4">
            Clear
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
            const place = p.chapter?.city || p.profile?.location;
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-rule bg-card p-4">
                <Link href={`/members/people/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={p.name} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.name || "Member"}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">
                      {[discipline, p.profile?.specialization, place].filter(Boolean).join(" · ") || "Member"}
                    </span>
                  </span>
                </Link>
                {p.id !== me ? (
                  <FollowButton userId={p.id} following={followingSet.has(p.id)} />
                ) : (
                  <span className="text-xs text-muted-foreground">You</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </MemberPage>
  );
}
