"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberContext, memberCanPost } from "@/lib/member";
import { canReadRoom, normalizeSpace, roomById } from "@/config/rooms";
import { firstName, notify } from "@/lib/community";
import { alertOwners, deliver } from "@/lib/mail/send";
import { commentReplyEmail } from "@/lib/mail/templates/members";
import { postReportedAlert } from "@/lib/mail/templates/owners";
import { getAllRooms } from "@/lib/rooms";
import { assessReport, moderateNewContent } from "@/agents/moderation";

export type FormState = { ok?: boolean; error?: string; message?: string; id?: string } | null;

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

/** Suspended, closed and muted accounts can read but not take part, and they are told why. */
function refusalFor(restricted: NonNullable<Awaited<ReturnType<typeof getMemberContext>>["restricted"]>) {
  const date = (d: Date) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "Europe/Dublin" }).format(d);
  if (restricted.status === "banned") return "This account has been closed, so you can no longer post, reply or react.";
  if (restricted.status === "suspended") {
    return restricted.until
      ? `Your account is paused until ${date(restricted.until)}, so you can't post, reply or react until then.`
      : "Your account is paused, so you can't post, reply or react until the team lifts the pause.";
  }
  return restricted.until
    ? `You can read the community, but posting, replying and reacting are paused for your account until ${date(restricted.until)}.`
    : "You can read the community, but posting, replying and reacting are paused for your account.";
}

async function requireMember() {
  const ctx = await getMemberContext();
  if (ctx.session?.user?.id && ctx.restricted) return { refused: refusalFor(ctx.restricted) };
  if (!ctx.session?.user?.id || !ctx.allowed) return null;
  return { ctx, userId: ctx.session.user.id };
}

function revalidateFeeds(postId?: string, chapterSlug?: string | null) {
  revalidatePath("/members");
  revalidatePath("/members/community");
  if (postId) revalidatePath(`/members/community/${postId}`);
  if (chapterSlug) revalidatePath(`/members/chapters/${chapterSlug}`);
}

export async function createPost(_prev: FormState, formData: FormData): Promise<FormState> {
  const member = await requireMember();
  if (!member) return { error: "Posting is part of membership. Choose a plan to join in." };
  if ("refused" in member) return { error: member.refused };
  const { ctx, userId } = member;

  const rooms = await getAllRooms();
  const space = normalizeSpace(clean(formData.get("space"), 32), rooms);
  const title = clean(formData.get("title"), 140);
  const content = clean(formData.get("content"), 5000);
  const wantsChapter = formData.get("chapter") === "on";

  if (content.length < 2) return { error: "Write a little more before posting." };
  if (!memberCanPost(space, ctx, rooms)) {
    const room = roomById(space, rooms);
    if (room?.archived) return { error: `${room.label} has been archived, so it no longer takes new posts.` };
    return { error: `Posting in ${room?.label ?? "this space"} is for Professional members.` };
  }

  const chapterId = wantsChapter && ctx.chapterId ? ctx.chapterId : null;
  const post = await prisma.communityPost.create({
    data: {
      title: title || null,
      content,
      category: "discussion",
      space,
      chapterId,
      authorId: userId,
    },
    select: { id: true, chapter: { select: { slug: true } } },
  });

  after(() => moderateNewContent({ postId: post.id, text: [title, content].filter(Boolean).join("\n\n"), roomId: space }));

  revalidateFeeds(undefined, post.chapter?.slug);
  return { ok: true, id: post.id, message: "Posted." };
}

export async function createComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const member = await requireMember();
  if (!member) return { error: "Replying is part of membership." };
  if ("refused" in member) return { error: member.refused };
  const { ctx, userId } = member;

  const postId = clean(formData.get("postId"), 64);
  const content = clean(formData.get("content"), 3000);
  if (!postId) return { error: "That thread could not be found." };
  if (content.length < 2) return { error: "Write a little more before replying." };

  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { id: true, space: true, title: true, content: true, authorId: true, hiddenAt: true, chapter: { select: { slug: true } } },
  });
  if (!post || post.hiddenAt) return { error: "That thread could not be found." };
  const rooms = await getAllRooms();
  const space = normalizeSpace(post.space, rooms);
  if (!canReadRoom(space, ctx.professional, rooms) || !memberCanPost(space, ctx, rooms)) {
    if (roomById(space, rooms)?.archived) return { error: "This space has been archived, so it no longer takes new replies." };
    return { error: "Replies in this space are for Professional members." };
  }

  const comment = await prisma.comment.create({ data: { content, postId, authorId: userId }, select: { id: true } });
  after(() => moderateNewContent({ postId, commentId: comment.id, text: content, roomId: space }));

  if (post.authorId !== userId) {
    const who = firstName(ctx.session?.user?.name) || "A member";
    const about = post.title || post.content.slice(0, 60) + (post.content.length > 60 ? "…" : "");
    await notify({
      userId: post.authorId,
      kind: "comment",
      title: `${who} replied to “${about}”`,
      href: `/members/community/${postId}`,
    });
    const commenter = ctx.session?.user?.name?.trim() || "A member";
    after(async () => {
      const author = await prisma.user.findUnique({ where: { id: post.authorId }, select: { name: true, email: true } });
      if (!author?.email) return;
      const email = commentReplyEmail({
        recipientName: author.name,
        commenterName: commenter,
        postTitle: post.title || post.content,
        comment: content,
        postId,
      });
      await deliver(author.email, email.subject, email.content, { list: "activity", tag: "activity" });
    });
  }

  revalidateFeeds(postId, post.chapter?.slug);
  return { ok: true };
}

export async function toggleUseful(postId: string) {
  const member = await requireMember();
  if (!member) return;
  if ("refused" in member) return;
  const { ctx, userId } = member;

  const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { space: true, hiddenAt: true } });
  const rooms = await getAllRooms();
  if (!post || post.hiddenAt || !canReadRoom(normalizeSpace(post.space, rooms), ctx.professional, rooms)) return;

  const existing = await prisma.reaction.findUnique({
    where: { postId_userId: { postId, userId } },
    select: { id: true },
  });
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { postId, userId, type: "useful" } });
  }
  revalidateFeeds(postId);
}

const REASONS: Record<string, string> = {
  identifying: "Shares information that could identify a client",
  unsafe: "Unsafe or misleading clinical advice",
  promotion: "Advertising or self-promotion",
  unkind: "Unkind or disrespectful",
  other: "Something else",
};

export async function reportPost(_prev: FormState, formData: FormData): Promise<FormState> {
  const member = await requireMember();
  if (!member) return { error: "Please sign in as a member to report a post." };
  if ("refused" in member) return { error: member.refused };
  const { userId } = member;

  const postId = clean(formData.get("postId"), 64);
  const kind = clean(formData.get("reason"), 32);
  const detail = clean(formData.get("detail"), 600);
  if (!postId || !REASONS[kind]) return { error: "Choose a reason so we know what to look for." };

  const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true, title: true, content: true } });
  if (!post) return { error: "That post could not be found." };

  // One open report per member per post; the database no longer enforces it.
  const already = await prisma.report.findFirst({
    where: { postId, commentId: null, reporterId: userId, resolvedAt: null },
    select: { id: true },
  });
  if (!already) {
    const reason = detail ? `${REASONS[kind]}: ${detail}` : REASONS[kind];
    const report = await prisma.report.create({
      data: { postId, reporterId: userId, source: "member", reason },
      select: { id: true },
    });
    const reporterName = member.ctx.session?.user?.name ?? null;
    after(async () => {
      await assessReport(report.id);
      await alertOwners(postReportedAlert({ reason, postTitle: post.title || post.content, reporterName }));
    });
  }
  return { ok: true, message: "Thank you. The team will look at this quietly and in confidence." };
}

export async function reportComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const member = await requireMember();
  if (!member) return { error: "Please sign in as a member to report a reply." };
  if ("refused" in member) return { error: member.refused };
  const { userId } = member;

  const commentId = clean(formData.get("commentId"), 64);
  const kind = clean(formData.get("reason"), 32);
  const detail = clean(formData.get("detail"), 600);
  if (!commentId || !REASONS[kind]) return { error: "Choose a reason so we know what to look for." };

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, postId: true, content: true },
  });
  if (!comment) return { error: "That reply could not be found." };

  // One open report per member per reply.
  const already = await prisma.report.findFirst({
    where: { commentId, reporterId: userId, resolvedAt: null },
    select: { id: true },
  });
  if (!already) {
    const reason = detail ? `${REASONS[kind]}: ${detail}` : REASONS[kind];
    const report = await prisma.report.create({
      data: { postId: comment.postId, commentId, reporterId: userId, source: "member", reason },
      select: { id: true },
    });
    const reporterName = member.ctx.session?.user?.name ?? null;
    after(async () => {
      await assessReport(report.id);
      await alertOwners(postReportedAlert({ reason, postTitle: `A reply: ${comment.content}`, reporterName }));
    });
  }
  return { ok: true, message: "Thank you. The team will look at this quietly and in confidence." };
}
