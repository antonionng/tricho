import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Paywall } from "@/components/members/Paywall";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";
import { createPost } from "./actions";

const SPACES = [
  {
    id: "lounge",
    label: "The Lounge",
    blurb: "Open to every member. Cases, referrals, and how you actually run a practice.",
  },
  {
    id: "consultation",
    label: "Consultation Room",
    blurb: "Clinical discussion for trichologists, doctors, and verified professionals.",
  },
] as const;

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function CommunityHubPage({
  searchParams,
}: {
  searchParams: Promise<{ space?: string }>;
}) {
  const ctx = await getMemberContext();
  if (!ctx.session) redirect("/login");
  if (!ctx.allowed) {
    return (
      <Paywall
        title="The Hub"
        body="The private professional community is part of membership."
      />
    );
  }

  const { space: requested } = await searchParams;
  const space = requested === "consultation" ? "consultation" : "lounge";
  const locked = space === "consultation" && !ctx.consultation;

  const posts = locked
    ? []
    : await prisma.communityPost.findMany({
        where: { space },
        orderBy: { createdAt: "desc" },
        take: 40,
        include: {
          author: { select: { name: true, role: true } },
          _count: { select: { comments: true } },
        },
      });

  return (
    <div className="min-h-screen bg-[#D1D0CB] pt-16 pb-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <header className="mb-12 space-y-4">
          <span className="tricho-caps text-black/40">The Collective Network</span>
          <h1 className="text-6xl md:text-8xl tricho-title uppercase tracking-tighter">
            The Hub
          </h1>
          <p className="font-sans font-medium text-black/60 max-w-xl">
            A working room for the people who already meet at the Trichollective conference.
          </p>
        </header>

        <div className="flex gap-6 border-b border-black/10 mb-10">
          {SPACES.map((item) => (
            <Link
              key={item.id}
              href={`/members/community?space=${item.id}`}
              className={`tricho-caps pb-4 text-xs ${
                space === item.id
                  ? "border-b-2 border-black text-black"
                  : "text-black/40 hover:text-black"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {locked ? (
          <div className="border border-black/10 bg-black text-[#D1D0CB] p-12 space-y-4 max-w-2xl">
            <Lock className="h-5 w-5" />
            <h2 className="text-3xl tricho-title uppercase">Professionals only</h2>
            <p className="font-sans text-sm opacity-70">
              The Consultation Room opens once your membership is the professional tier
              (trichologist, doctor, or business). The Lounge stays open.
            </p>
            <Button asChild className="tricho-caps rounded-none bg-[#D1D0CB] text-black h-12">
              <Link href="/members/community?space=lounge">Back to the Lounge</Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_320px] gap-12">
            <div className="space-y-4">
              {posts.length === 0 && (
                <div className="border border-black/10 bg-white/40 p-10">
                  <MessageSquare className="h-5 w-5 mb-4" />
                  <p className="font-sans font-medium text-black/70">
                    Nothing in this room yet. Start the first thread.
                  </p>
                </div>
              )}
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/members/community/${post.id}`}
                  className="block border border-black/10 bg-white/40 hover:bg-white/70 transition-colors p-6 space-y-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="tricho-caps text-[10px] text-black/40">
                      {post.category}
                    </span>
                    <span className="tricho-caps text-[10px] text-black/40">
                      {formatWhen(post.createdAt)}
                    </span>
                  </div>
                  <h2 className="font-sans font-black uppercase tracking-tight text-xl">
                    {post.title || post.content.slice(0, 80)}
                  </h2>
                  {post.title && (
                    <p className="font-sans text-sm text-black/60 line-clamp-2">
                      {post.content}
                    </p>
                  )}
                  <p className="tricho-caps text-[10px] text-black/40">
                    {post.author.name || "Member"} · {post._count.comments} replies
                  </p>
                </Link>
              ))}
            </div>

            <aside className="space-y-4">
              <p className="font-sans text-sm text-black/60">
                {SPACES.find((s) => s.id === space)?.blurb}
              </p>
              <form action={createPost} className="border border-black/10 bg-white/50 p-5 space-y-4">
                <p className="tricho-caps text-[10px]">New thread</p>
                <input type="hidden" name="space" value={space} />
                <input
                  name="title"
                  placeholder="Title"
                  className="w-full h-11 px-3 bg-white/70 border border-black/15 text-sm outline-none"
                />
                <select
                  name="category"
                  className="w-full h-11 px-3 bg-white/70 border border-black/15 text-sm outline-none"
                  defaultValue="discussion"
                >
                  <option value="discussion">Discussion</option>
                  <option value="referral">Referral</option>
                  <option value="resource">Resource</option>
                </select>
                <textarea
                  name="content"
                  required
                  minLength={2}
                  rows={5}
                  placeholder="What do you want the room to weigh in on?"
                  className="w-full p-3 bg-white/70 border border-black/15 text-sm outline-none resize-y"
                />
                <Button
                  type="submit"
                  className="tricho-caps w-full rounded-none bg-black text-[#D1D0CB] h-12"
                >
                  Post
                </Button>
              </form>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
