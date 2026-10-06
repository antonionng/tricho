import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, MapPin } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { FreeHome } from "@/components/members/FreeHome";
import { Avatar } from "@/components/members/Avatar";
import { Card, EmptyState, MemberPage, SectionLabel } from "@/components/members/MemberPage";
import { EventMini } from "@/components/members/EventMini";
import { FollowButton } from "@/components/members/FollowButton";
import { Cover } from "@/components/gazette/Cover";
import { getEditions } from "@/content/gazette/loader";
import { greeting, monthYear } from "@/components/members/format";
import { Composer } from "@/components/community/Composer";
import { PostCard } from "@/components/community/PostCard";
import { getMemberContext } from "@/lib/member";
import { firstName, getTodayFeed, memberDirectoryWhere, postableRooms, rawSpacesFor } from "@/lib/community";
import { profileCompleteness } from "@/lib/profile";
import { isBusinessAccount } from "@/lib/subscription";
import { loadApplicant } from "./profile/verification/applicant";
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

  const [user, feed, events, gazette, following, editions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        isFounding: true,
        chapter: { select: { id: true, slug: true, city: true } },
        image: true,
        chapterId: true,
        profile: true,
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
    getEditions(),
  ]);
  const edition = editions[0];
  if (!user) redirect("/login");

  const email = ctx.session.user.email?.toLowerCase() ?? null;
  const [introduced, invited, applicant, businessPage, businessAccount] = await Promise.all([
    prisma.communityPost.count({ where: { authorId: userId, space: { in: rawSpacesFor(["introductions"]) } } }),
    prisma.user.count({ where: { referredById: userId } }),
    loadApplicant(ctx),
    email ? prisma.partner.findUnique({ where: { ownerEmail: email }, select: { id: true } }).catch(() => null) : null,
    email ? isBusinessAccount(email) : false,
  ]);

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
        select: { id: true, name: true, image: true, profile: { select: { profession: true } } },
      })
    : [];

  const completeness = profileCompleteness(user.profile, user);
  const checklist = [
    {
      done: completeness.percent === 100,
      label: completeness.percent === 100 ? "Finish your profile" : `Finish your profile (${completeness.percent}% complete)`,
      href: "/members/profile",
    },
    { done: introduced > 0, label: "Introduce yourself in Introductions", href: "/members/community?space=introductions#compose" },
    { done: !!user.chapter, label: "Choose your chapter", href: "/members/profile#about" },
    ...(applicant && (applicant.eligible || applicant.isVerified)
      ? [{ done: applicant.isVerified, label: "Get verified", href: "/members/profile/verification" }]
      : []),
    { done: invited > 0, label: "Invite a colleague", href: "/members/refer" },
    ...(businessPage || businessAccount
      ? [{ done: !!businessPage, label: "Set up your business page", href: "/members/business/setup" }]
      : []),
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-4">
          {remaining > 0 && (
            <Card className="p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="label text-muted-foreground">Getting started</h2>
                <span className="text-xs text-muted-foreground">
                  {checklist.length - remaining} of {checklist.length} done
                </span>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                These few steps help colleagues find you, trust your work and refer clients to you.
              </p>
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

          <SectionLabel className="mt-4" action={<Link href="/members/community" className="inline-flex min-h-10 items-center text-sm text-ink-2 hover:underline">All spaces</Link>}>
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
            <SectionLabel action={<Link href="/members/events" className="inline-flex min-h-10 items-center text-sm text-ink-2 hover:underline">All</Link>}>
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
            <SectionLabel
              action={
                <Link href="/members/trichozette" className="inline-flex min-h-10 items-center text-sm text-ink-2 hover:underline">
                  All editions
                </Link>
              }
            >
              Trichozette
            </SectionLabel>
            {edition && (
              <Link href={`/trichozette/${edition.slug}`} prefetch={false} className="group flex items-center gap-4">
                <Cover edition={edition} sizes="96px" className="w-24 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[17px] font-semibold leading-snug group-hover:underline">{edition.title}</span>
                  {edition.theme && <span className="mt-1 block text-sm text-ink-2">{edition.theme}</span>}
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium">
                    Read <ArrowRight className="h-4 w-4" />
                  </span>
                </span>
              </Link>
            )}
            {gazette ? (
              <Link href={`/members/trichozette/${gazette.id}`} className={cn("group block", edition && "mt-4 border-t border-rule pt-4")}>
                {gazette.publishedAt && <p className="text-xs text-muted-foreground">{monthYear(gazette.publishedAt)}</p>}
                <p className="text-[15px] font-semibold leading-snug group-hover:underline">{gazette.title}</p>
                {gazette.summary && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-2">{gazette.summary}</p>}
              </Link>
            ) : (
              !edition && <p className="text-sm leading-relaxed text-muted-foreground">The first edition is being prepared.</p>
            )}
          </Card>

          {user.chapter && (
            <Card className="p-5">
              <SectionLabel action={<Link href="/members/people" className="inline-flex min-h-10 items-center text-sm text-ink-2 hover:underline">Everyone</Link>}>
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
                        <Avatar name={p.name} src={p.image} size="sm" />
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
