import Link from "next/link";
import { redirect } from "next/navigation";
import { Paywall } from "@/components/members/Paywall";
import { PostCard } from "@/components/community/PostCard";
import { Composer } from "@/components/community/Composer";
import { RoomList } from "@/components/community/RoomList";
import { getMemberContext, memberCanPost } from "@/lib/member";
import { getFeedPosts } from "./actions";
import { ROOMS, normalizeSpace, professionById, type RoomId } from "@/config/rooms";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ space?: string }>;
}) {
  const ctx = await getMemberContext();
  if (!ctx.session) redirect("/login");
  if (!ctx.allowed) {
    return <Paywall title="Rooms" body="Private professional rooms are part of membership." />;
  }

  const { space: requested } = await searchParams;
  const preferred =
    (requested && normalizeSpace(requested)) ||
    professionById(ctx.profession || "")?.homeRoom ||
    "everyone";
  const space = preferred as RoomId;
  const room = ROOMS.find((r) => r.id === space)!;
  const canPost = memberCanPost(space, ctx.profession, ctx.unlocked);
  const posts = await getFeedPosts([space], ctx.session.user.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8 space-y-2">
        <p className="tricho-caps text-foreground/40">Rooms</p>
        <h1 className="tricho-title text-4xl">{room.label}</h1>
        <p className="text-muted-foreground max-w-2xl">{room.blurb}</p>
      </header>

      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        <aside className="space-y-4">
          <RoomList active={space} />
          <Link
            href="/members"
            className="block text-sm text-muted-foreground hover:text-foreground px-2"
          >
            ← Home feed
          </Link>
        </aside>

        <div className="space-y-4 max-w-2xl">
          <Composer space={space} canPost={canPost} />
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-card p-8 text-sm text-muted-foreground">
              Nothing in this room yet. Start the first thread.
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
    </div>
  );
}
