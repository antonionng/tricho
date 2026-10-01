import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowUpRight, MapPin, MessageCircle } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Paywall } from "@/components/members/Paywall";
import { Avatar } from "@/components/members/Avatar";
import { EmptyState, MemberPage, SectionLabel } from "@/components/members/MemberPage";
import { FollowButton } from "@/components/members/FollowButton";
import { SubmitButton } from "@/components/members/SubmitButton";
import { PostCard } from "@/components/community/PostCard";
import { getMemberContext } from "@/lib/member";
import { getPosts } from "@/lib/community";
import { prisma } from "@/lib/prisma";
import { professionById } from "@/config/rooms";
import { startConversation } from "../actions";

export const metadata = { title: "People" };

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/people");
  if (!ctx.allowed) return <Paywall title="People" body="Member profiles and messages are part of membership." />;
  const me = ctx.session.user.id;

  const { id } = await params;
  const person = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      isFounding: true,
      chapter: { select: { slug: true, city: true } },
      profile: { select: { profession: true, specialization: true, bio: true, location: true } },
      listings: {
        where: { status: "listed", slug: { not: null } },
        select: { slug: true, headline: true, photoUrl: true },
        take: 1,
      },
      _count: { select: { followers: true, following: true } },
    },
  });
  if (!person) notFound();

  const [isFollowing, posts] = await Promise.all([
    prisma.follow.findUnique({ where: { followerId_followeeId: { followerId: me, followeeId: id } } }),
    getPosts({ userId: me, professional: ctx.professional, authorId: id, take: 10 }),
  ]);
  const listing = person.listings[0];
  const discipline = person.profile?.profession ? professionById(person.profile.profession) : null;
  const isMe = me === id;

  return (
    <MemberPage size="narrow">
      <section className="rounded-3xl border border-rule bg-card p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <Avatar name={person.name} src={listing?.photoUrl ?? person.image} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 className="display text-3xl sm:text-4xl">{person.name || "Member"}</h1>
            {listing?.headline && <p className="mt-2 text-[15px] text-ink-2">{listing.headline}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {discipline && <Pill>{discipline.label}</Pill>}
              {person.isFounding && <Pill tone="ink">Founding member</Pill>}
              {person.chapter && (
                <Link href={`/members/chapters/${person.chapter.slug}`}>
                  <Pill className="hover:border-ink/40">
                    <MapPin className="h-3 w-3" /> {person.chapter.city}
                  </Pill>
                </Link>
              )}
            </div>
          </div>
        </div>

        {person.profile?.specialization && (
          <p className="mt-5 text-sm text-muted-foreground">Specialism: {person.profile.specialization}</p>
        )}
        {person.profile?.bio && <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{person.profile.bio}</p>}

        <p className="mt-5 text-sm text-muted-foreground">
          {person._count.followers} {person._count.followers === 1 ? "follower" : "followers"} · following {person._count.following}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {isMe ? (
            <Link href="/members/profile" className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-[15px] font-medium text-paper">
              Edit your profile
            </Link>
          ) : (
            <>
              <FollowButton userId={person.id} following={!!isFollowing} size="lg" />
              <form action={startConversation}>
                <input type="hidden" name="userId" value={person.id} />
                <SubmitButton variant="outline" pending="Opening…">
                  <MessageCircle className="h-4 w-4" /> Message
                </SubmitButton>
              </form>
            </>
          )}
          {listing?.slug && (
            <Link
              href={`/directory/p/${listing.slug}`}
              className="inline-flex h-12 items-center gap-1.5 rounded-full px-4 text-[15px] text-ink-2 hover:bg-paper-2"
            >
              Public profile <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      <section className="mt-8">
        <SectionLabel>Recent posts</SectionLabel>
        {posts.length === 0 ? (
          <EmptyState
            title={isMe ? "You haven't posted yet" : `${(person.name || "This member").split(" ")[0]} hasn't posted yet`}
            body={isMe ? "Introductions is a good place to start." : "Their posts will appear here when they do."}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>
    </MemberPage>
  );
}
