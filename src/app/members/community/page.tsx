import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Paywall } from "@/components/members/Paywall";
import { EmptyState, MemberPage, PageHeader } from "@/components/members/MemberPage";
import { PostCard } from "@/components/community/PostCard";
import { Composer } from "@/components/community/Composer";
import { SpaceNav } from "@/components/community/SpaceNav";
import { getMemberContext } from "@/lib/member";
import { getPosts, postableRooms } from "@/lib/community";
import { prisma } from "@/lib/prisma";
import { canReadRoom, roomById } from "@/config/rooms";
import { getRooms } from "@/lib/rooms";

export const metadata = { title: "Community" };

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ space?: string; welcome?: string }> }) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/community");
  if (!ctx.allowed) return <Paywall title="The community" body="Every space, your chapter and direct messages are part of membership." />;

  const { space: requested, welcome } = await searchParams;
  const allRooms = await getRooms();
  const space = requested && allRooms.some((r) => r.id === requested) ? requested : undefined;
  const room = space ? roomById(space, allRooms) : undefined;
  const locked = space ? !canReadRoom(space, ctx.professional, allRooms) : false;

  const [posts, chapter, rooms] = await Promise.all([
    locked ? Promise.resolve([]) : getPosts({ userId: ctx.session.user.id, professional: ctx.professional, space }),
    ctx.chapterId ? prisma.chapter.findUnique({ where: { id: ctx.chapterId }, select: { city: true } }) : null,
    postableRooms(ctx),
  ]);

  return (
    <MemberPage>
      {welcome && (
        <div className="mb-6 rounded-2xl border border-positive/25 bg-positive/10 px-5 py-4 text-sm leading-relaxed text-positive" role="status">
          Your profile is set up. Colleagues can now find you, and Introductions is the best place to say hello.
        </div>
      )}
      <PageHeader
        label="Community"
        title={room?.label ?? "All spaces"}
        lede={room?.blurb ?? "Conversation from every space you can read, newest first. Pinned posts from the team sit at the top."}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <SpaceNav active={space} professional={ctx.professional} rooms={allRooms} />
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          {locked ? (
            <div className="rounded-3xl border border-rule bg-card p-6 sm:p-8">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-paper-2">
                <Lock className="h-5 w-5 stroke-[1.6]" />
              </span>
              <h2 className="display mt-5 text-3xl">
                {room?.id === "case-room" ? "The Case Room" : room?.label ?? "This space"} is for Professional members
              </h2>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-2">
                {room?.id === "case-room"
                  ? "Qualified practitioners bring anonymised cases here and hear how colleagues from other disciplines would approach them. It is kept small and careful on purpose."
                  : "Professional membership opens this space so you can learn alongside qualified colleagues from every discipline."}
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link href="/pricing#professional">See Professional</Link>
              </Button>
            </div>
          ) : (
            <>
              {!space ? (
                <Composer key="all" rooms={rooms} chapter={chapter} collapsed name={null} />
              ) : rooms.some((r) => r.id === space) ? (
                <Composer key={space} rooms={rooms.filter((r) => r.id === space)} lockedSpace={space} chapter={chapter} collapsed />
              ) : (
                <div className="rounded-2xl border border-rule bg-paper-2 p-5 text-sm leading-relaxed text-ink-2">
                  {room?.archived
                    ? "This space is archived. Its conversations stay here to read, and new posts belong in another space."
                    : ctx.profession === "brand"
                      ? "This space is kept for practitioner discussion, so business accounts can read along but not post here."
                      : "You can read this space, but posting here is for Professional members."}
                </div>
              )}
              {posts.length === 0 ? (
                <EmptyState
                  title={room ? `Nothing in ${room.label} yet` : "No posts yet"}
                  body="Be the first to start a conversation here. A question is often the best way in."
                />
              ) : (
                posts.map((post) => <PostCard key={post.id} post={post} showSpace={!space} />)
              )}
            </>
          )}
        </div>
      </div>
    </MemberPage>
  );
}
