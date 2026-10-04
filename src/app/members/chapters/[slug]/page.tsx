import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Paywall } from "@/components/members/Paywall";
import { Avatar } from "@/components/members/Avatar";
import { Card, EmptyState, MemberPage, PageHeader, SectionLabel } from "@/components/members/MemberPage";
import { EventMini } from "@/components/members/EventMini";
import { Composer } from "@/components/community/Composer";
import { PostCard } from "@/components/community/PostCard";
import { getMemberContext } from "@/lib/member";
import { getPosts, memberDirectoryWhere, postableRooms } from "@/lib/community";
import { prisma } from "@/lib/prisma";
import { professionById } from "@/config/rooms";
import { chapterBySlug } from "@/content/chapters";

export const metadata = { title: "Chapter" };

export default async function ChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members");
  if (!ctx.allowed) return <Paywall title="Chapters" body="Local chapters, meetups and members near you are part of membership." />;

  const { slug } = await params;
  const chapter = await prisma.chapter.findUnique({ where: { slug } });
  if (!chapter) notFound();

  const userId = ctx.session.user.id;
  const isMine = ctx.chapterId === chapter.id;
  const [posts, members, memberCount, events] = await Promise.all([
    getPosts({ userId, professional: ctx.professional, chapterId: chapter.id }),
    prisma.user.findMany({
      where: { AND: [memberDirectoryWhere(), { chapterId: chapter.id }] },
      orderBy: { onboardedAt: "desc" },
      take: 12,
      select: { id: true, name: true, image: true, profile: { select: { profession: true } } },
    }),
    prisma.user.count({ where: { AND: [memberDirectoryWhere(), { chapterId: chapter.id }] } }),
    prisma.event.findMany({
      where: {
        published: true,
        startsAt: { gte: new Date() },
        OR: [{ chapterId: chapter.id }, { city: { equals: chapter.city, mode: "insensitive" } }],
      },
      orderBy: { startsAt: "asc" },
      take: 5,
      select: { id: true, slug: true, title: true, startsAt: true, city: true, online: true, rsvps: { where: { userId }, select: { userId: true } } },
    }),
  ]);

  const blurb = chapter.blurb || chapterBySlug(chapter.slug)?.blurb;

  return (
    <MemberPage>
      <PageHeader
        label={isMine ? "Your chapter" : `Chapter · ${chapter.country}`}
        title={chapter.city}
        lede={blurb}
        action={
          !isMine ? (
            <Link href="/members/profile#about" className="text-sm text-ink-2 underline underline-offset-4">
              Make this your chapter
            </Link>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-4">
          {isMine && <Composer key="chapter" rooms={await postableRooms(ctx)} chapter={{ city: chapter.city }} chapterDefault collapsed />}
          <SectionLabel className="mt-2">From {chapter.city}</SectionLabel>
          {posts.length === 0 ? (
            <EmptyState
              title={`No ${chapter.city} posts yet`}
              body={
                isMine
                  ? "Posts shared with the chapter appear here. A good first one: where do people refer locally, or who fancies a coffee?"
                  : "When members here share something with their chapter, it will appear on this page."
              }
            />
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5">
            <SectionLabel>Meetups and events</SectionLabel>
            {events.length === 0 ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Nothing is planned in {chapter.city} just now. If you&apos;d like to host a meetup, say so in the chapter feed and we&apos;ll help you set it up.
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
              action={<span className="text-xs text-muted-foreground">{memberCount} {memberCount === 1 ? "member" : "members"}</span>}
            >
              Members
            </SectionLabel>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members have joined this chapter yet.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {members.map((m) => (
                  <li key={m.id}>
                    <Link href={`/members/people/${m.id}`} className="-mx-2 flex items-center gap-3 rounded-xl p-2 hover:bg-paper-2">
                      <Avatar name={m.name} src={m.image} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{m.name || "Member"}</span>
                        <span className="block text-xs text-muted-foreground">
                          {m.profile?.profession ? professionById(m.profile.profession)?.label : "Member"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </MemberPage>
  );
}
