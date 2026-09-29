"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";

const CATEGORIES = ["discussion", "referral", "resource"] as const;
const SPACES = ["lounge", "consultation"] as const;

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export async function createPost(formData: FormData) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id || !ctx.allowed) {
    redirect("/join");
  }

  const space = clean(formData.get("space"), 32);
  const category = clean(formData.get("category"), 32);
  const title = clean(formData.get("title"), 140);
  const content = clean(formData.get("content"), 5000);

  if (!SPACES.includes(space as (typeof SPACES)[number])) return;
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) return;
  if (content.length < 2) return;
  if (space === "consultation" && !ctx.consultation) {
    redirect("/members/community?space=lounge");
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

  revalidatePath("/members/community");
  redirect(`/members/community/${post.id}`);
}

export async function createComment(formData: FormData) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id || !ctx.allowed) {
    redirect("/join");
  }

  const postId = clean(formData.get("postId"), 64);
  const content = clean(formData.get("content"), 2000);
  if (!postId || content.length < 2) return;

  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { id: true, space: true },
  });
  if (!post) return;
  if (post.space === "consultation" && !ctx.consultation) return;

  await prisma.comment.create({
    data: { content, postId, authorId: ctx.session.user.id },
  });

  revalidatePath(`/members/community/${postId}`);
  revalidatePath("/members/community");
}
