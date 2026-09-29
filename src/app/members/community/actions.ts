"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberContext, memberCanPost } from "@/lib/member";
import { normalizeSpace, type RoomId } from "@/config/rooms";

const CATEGORIES = ["discussion", "referral", "resource"] as const;

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export async function createPost(formData: FormData) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id || !ctx.allowed) redirect("/join");

  const space = normalizeSpace(clean(formData.get("space"), 32));
  const category = clean(formData.get("category"), 32);
  const title = clean(formData.get("title"), 140);
  const content = clean(formData.get("content"), 5000);

  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) return;
  if (content.length < 2) return;
  if (!memberCanPost(space, ctx.profession, ctx.unlocked)) {
    redirect(`/members/community?space=${space}`);
  }

  const post = await prisma.communityPost.create({
    data: {
      title: title || null,
      content,
      category,
      space,
      authorId: ctx.session.user.id,
    },
  });

  revalidatePath("/members");
  revalidatePath("/members/community");
  redirect(`/members/community/${post.id}`);
}

export async function createComment(formData: FormData) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id || !ctx.allowed) redirect("/join");

  const postId = clean(formData.get("postId"), 64);
  const content = clean(formData.get("content"), 2000);
  if (!postId || content.length < 2) return;

  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { id: true, space: true },
  });
  if (!post) return;
  if (!memberCanPost(normalizeSpace(post.space), ctx.profession, ctx.unlocked)) return;

  await prisma.comment.create({
    data: { content, postId, authorId: ctx.session.user.id },
  });

  revalidatePath(`/members/community/${postId}`);
  revalidatePath("/members/community");
  revalidatePath("/members");
}

export async function toggleUseful(formData: FormData) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id || !ctx.allowed) redirect("/join");

  const postId = clean(formData.get("postId"), 64);
  if (!postId) return;

  const existing = await prisma.reaction.findUnique({
    where: {
      postId_userId: { postId, userId: ctx.session.user.id },
    },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({
      data: { postId, userId: ctx.session.user.id, type: "useful" },
    });
  }

  revalidatePath("/members");
  revalidatePath("/members/community");
  revalidatePath(`/members/community/${postId}`);
}

export type FeedPost = {
  id: string;
  title: string | null;
  content: string;
  category: string;
  space: string;
  pinned: boolean;
  createdAt: Date;
  author: { name: string | null; role: string };
  _count: { comments: number; reactions: number };
  reacted?: boolean;
};

export async function getFeedPosts(spaces: RoomId[], userId?: string) {
  const posts = await prisma.communityPost.findMany({
    where: { space: { in: spaces } },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 40,
    include: {
      author: { select: { name: true, role: true } },
      _count: { select: { comments: true, reactions: true } },
      reactions: userId
        ? { where: { userId }, select: { id: true } }
        : false,
    },
  });

  return posts.map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    category: p.category,
    space: p.space,
    pinned: p.pinned,
    createdAt: p.createdAt,
    author: p.author,
    _count: p._count,
    reacted: Array.isArray(p.reactions) ? p.reactions.length > 0 : false,
  })) satisfies FeedPost[];
}
