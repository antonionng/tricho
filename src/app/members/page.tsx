import Link from "next/link";
import { redirect } from "next/navigation";
import { Paywall } from "@/components/members/Paywall";
import { PostCard } from "@/components/community/PostCard";
import { Composer } from "@/components/community/Composer";
import { RoomList } from "@/components/community/RoomList";
import { getMemberContext, memberCanPost } from "@/lib/member";
import { getFeedPosts } from "@/app/members/community/actions";
import { prisma } from "@/lib/prisma";
import { professionById, ROOMS, type RoomId } from "@/config/rooms";
import { Button } from "@/components/ui/button";

export default async function MembersHomePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const ctx = await getMemberContext();
  if (!ctx.session) redirect("/login");
  if (!ctx.allowed) {
    return (
      <Paywall
        title="Welcome in"
        body="Your member home opens once membership is active."
      />
    );
  }

  const { welcome } = await searchParams;
  const homeRoom =
    (professionById(ctx.profession || "")?.homeRoom as RoomId) || "everyone";
  const readable = ROOMS.filter((r) =>
    memberCanPost(r.id, ctx.profession, ctx.unlocked) || r.id === "everyone"
  ).map((r) => r.id);
  const posts = await getFeedPosts(readable.length ? readable : ["everyone"], ctx.session.user.id);
  const learn = await prisma.educationPiece.findFirst({
    where: {
      published: true,
      OR: [
        { audience: "everyone" },
        ...(ctx.profession ? [{ audience: ctx.profession }] : []),
      ],
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {welcome && (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-accent px-5 py-4 text-sm text-accent-foreground">
          You&apos;re in. Finish your directory listing, open Learn, or say hello in your room.
        </div>
      )}

      <header className="mb-8 space-y-2">
        <p className="text-sm font-medium text-primary uppercase tracking-wide">Home</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Welcome{ctx.session.user.name ? `, ${ctx.session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground">
          {ctx.membership.isActive
            ? `Membership active${ctx.membership.tierName ? ` · ${ctx.membership.tierName}` : ""}`
            : "Local unlock on — Stripe membership not connected yet"}
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_280px] gap-8">
        <div className="space-y-4 max-w-2xl">
          <Composer
            space={homeRoom}
            canPost={memberCanPost(homeRoom, ctx.profession, ctx.unlocked)}
          />
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-card p-8 text-sm text-muted-foreground">
              Your feed is quiet. Open a room and start a thread, or reply to a Start here post.
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your listing
            </p>
            <p className="text-sm text-muted-foreground">
              Be found in the public directory. Members are marked separately from free listings.
            </p>
            <Button asChild className="rounded-full w-full">
              <Link href="/members/profile">Edit listing</Link>
            </Button>
          </div>

          <RoomList active={homeRoom} />

          {learn && (
            <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Next in Learn
              </p>
              <h2 className="font-semibold">{learn.title}</h2>
              <p className="text-sm text-muted-foreground line-clamp-3">{learn.summary}</p>
              <Link
                href={`/members/learn/${learn.id}`}
                className="text-sm text-primary hover:underline"
              >
                Read piece
              </Link>
            </div>
          )}

          <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-2 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tricho-AI
            </p>
            <Link href="/members/assistant" className="text-sm text-primary hover:underline">
              Open the assistant
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
