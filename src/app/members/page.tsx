import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, MapPin } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { FreeHome } from "@/components/members/FreeHome";
import { Avatar } from "@/components/members/Avatar";
import { Card, EmptyState, MemberPage, SectionLabel } from "@/components/members/MemberPage";
import { EventMini } from "@/components/members/EventMini";
import { FollowButton } from "@/components/members/FollowButton";
import { greeting, monthYear } from "@/components/members/format";
import { Composer } from "@/components/community/Composer";
import { PostCard } from "@/components/community/PostCard";
import { getMemberContext } from "@/lib/member";
import { firstName, getTodayFeed, memberDirectoryWhere, postableRooms } from "@/lib/community";
import { prisma } from "@/lib/prisma";
import { professionById } from "@/config/rooms";
import { cn } from "@/lib/utils";

export const metadata = { title: "Today" };

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members");
  if (!ctx.onboarded) redirect("/members/onboarding");
  if (!ctx.allowed) return <FreeHome userId={ctx.session.user.id} email={ctx.session.user.email ?? ""} />;

  const userId = ctx.session.user.id;
  const { welcome } = await searchParams;
  const now = new Date();

  const [user, feed, events, gazette, following] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        isFounding: true,
        chapter: { select: { id: true, slug: true, city: true } },
        profile: { select: { profession: true } },
        _count: { select: { posts: true, rsvps: true, listings: true } },
      },
    }),
    getTodayFeed({ userId, professional: ctx.professional, chapterId: ctx.chapterId, profession: ctx.profession }),
    prisma.event.findMany({
      where: { published: true, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 3,
      select: { id: true, slug: true, title: true, startsAt: true, city: true, online: true, rsvps: { where: { userId }, select: { userId: true } } },
    }),
    prisma.draft.findFirst({
      where: { kind: "gazette_article", status: "published" },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, summary: true, publishedAt: true },
    }),
    prisma.follow.findMany({ where: { followerId: userId }, select: { followeeId: true } }),
  ]);
  if (!user) redirect("/login");

  const people = user.chapter
    ? await prisma.user.findMany({
        where: {
          AND: [
            memberDirectoryWhere(),
            { chapterId: user.chapter.id, id: { notIn: [userId, ...following.map((f) => f.followeeId)] } },
          ],
        },
        take: 4,
        orderBy: { onboardedAt: "desc" },
        select: { id: true, name: true, profile: { select: { profession: true } } },
      })
    : [];

  const profileDone = ctx.professional
    ? !!user.profile?.profession && user._count.listings > 0
    : !!user.name && !!user.profile?.profession;
  const checklist = [
    { done: profileDone, label: ctx.professional ? "Complete your directory profile" : "Complete your profile", href: "/members/profile" },
    { done: !!user.chapter, label: "Choose your chapter", href: "/members/profile#about" },
    { done: user._count.posts > 0, label: "Write your first post", href: "/members/community?space=introductions#compose" },
    { done: user._count.rsvps > 0, label: "Say you're going to an event", href: "/members/events" },
  ];
  const remaining = checklist.filter((c) => !c.done).length;
  const name = firstName(user.name);

  return (
    <MemberPage size="wide">
      {welcome && (
        <div className="mb-6 rounded-2xl border border-positive/25 bg-positive/10 px-5 py-4 text-sm text-positive" role="status">
          You&apos;re all set. Have a look around and make yourself at home.
        </div>
      )}

      <header className="mb-8 flex flex-col gap-3">
        <p className="label text-muted-foreground">Today</p>
        <h1 className="display text-[2.6rem] sm:text-6xl">
          {greeting(now)}
          {name ? `, ${name}` : ""}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {user.isFounding && <Pill tone="ink">Founding member</Pill>}
          {user.profile?.profession && <Pill>{professionById(user.profile.profession)?.label}</Pill>}
          {user.chapter && (
            <Link href={`/members/chapters/${user.chapter.slug}`}>
              <Pill className="hover:border-ink/40">
                <MapPin className="h-3 w-3" /> {user.chapter.city} chapter
              </Pill>
            </Link>
          )}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-4">
          {remaining > 0 && (
            <Card className="p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-medium">Settle in</h2>
                <span className="text-xs text-muted-foreground">
                  {checklist.length - remaining} of {checklist.length} done
                </span>
              </div>
              <ul className="mt-3 flex flex-col">
                {checklist.map((c) => (
                  <li key={c.label}>
                    <Link
                      href={c.href}
                      className={cn(
                        "-mx-2 flex min-h-11 items-center gap-3 rounded-xl px-2 text-[15px] transition-colors hover:bg-paper-2",
                        c.done && "text-muted-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-6 w-6 shrink-0 place-items-center rounded-full border",
                          c.done ? "border-ink bg-ink text-paper" : "border-rule bg-paper"
                        )}
                      >
                        {c.done && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className={cn("flex-1", c.done && "line-through decoration-rule")}>{c.label}</span>
                      {!c.done && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Composer rooms={await postableRooms(ctx)} defaultSpace="lounge" chapter={user.chapter} collapsed name={name || null} />

          <SectionLabel className="mt-4" action={<Link href="/members/community" className="text-sm text-ink-2 hover:underline">All spaces</Link>}>
            Latest from the collective
          </SectionLabel>
          {feed.length === 0 ? (
            <EmptyState
              title="It's quiet here for now"
              body="The community is just getting started. Introduce yourself, or ask the question you've been meaning to ask."
              action={
                <Link href="/members/community?space=introductions" className="text-sm font-medium underline underline-offset-4">
                  Go to Introductions
                </Link>
              }
            />
          ) : (
            feed.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          {user.chapter && (
            <Link
              href={`/members/chapters/${user.chapter.slug}`}
              className="group flex items-center justify-between rounded-2xl bg-ink p-5 text-paper"
            >
              <span>
                <span className="label block opacity-60">Your chapter</span>
                <span className="display mt-2 block text-3xl">{user.chapter.city}</span>
              </span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}

          <Card className="p-5">
            <SectionLabel action={<Link href="/members/events" className="text-sm text-ink-2 hover:underline">All</Link>}>
              Coming up
            </SectionLabel>
            {events.length === 0 ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                No events are scheduled just now. The next gathering will appear here as soon as it&apos;s announced.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {events.map((e) => (
                  <EventMini key={e.id} event={e} going={e.rsvps.length > 0} />
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <SectionLabel>{gazette?.publishedAt ? `Trichozette, ${monthYear(gazette.publishedAt)}` : "Trichozette"}</SectionLabel>
            {gazette ? (
              <Link href={`/members/trichozette/${gazette.id}`} className="group block">
                <p className="text-[17px] font-semibold leading-snug group-hover:underline">{gazette.title}</p>
                {gazette.summary && <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink-2">{gazette.summary}</p>}
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium">
                  Read <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">The first edition is being prepared.</p>
            )}
          </Card>

          {user.chapter && (
            <Card className="p-5">
              <SectionLabel action={<Link href="/members/people" className="text-sm text-ink-2 hover:underline">Everyone</Link>}>
                People to meet
              </SectionLabel>
              {people.length === 0 ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  You&apos;re following everyone in {user.chapter.city} so far. New members will appear here.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {people.map((p) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <Link href={`/members/people/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                        <Avatar name={p.name} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{p.name || "Member"}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {p.profile?.profession ? professionById(p.profile.profession)?.label : "Member"}
                          </span>
                        </span>
                      </Link>
                      <FollowButton userId={p.id} following={false} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </aside>
      </div>
    </MemberPage>
  );
}
