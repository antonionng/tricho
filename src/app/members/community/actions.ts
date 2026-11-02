"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberContext, memberCanPost } from "@/lib/member";
import { canReadRoom, normalizeSpace, roomById } from "@/config/rooms";
import { excerpt, firstName, notify, notifyUseful } from "@/lib/community";
import { alertOwners, deliver } from "@/lib/mail/send";
import { commentReplyEmail } from "@/lib/mail/templates/members";
import { postReportedAlert } from "@/lib/mail/templates/owners";
import { getAllRooms } from "@/lib/rooms";
import { assessReport, moderateNewContent } from "@/agents/moderation";
import { createVideoUpload, deleteStoredFile, fileUrl, registerVideoUpload, storeUpload } from "@/lib/storage";
import { MAX_POST_MEDIA } from "@/lib/files";

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

export type MediaUpload = { ok: true; id: string; url: string } | { ok: false; error: string };

/** One photo for a post that's being written. It is resized and stripped of location details like every other photo. */
export async function uploadPostImage(formData: FormData): Promise<MediaUpload> {
  const member = await requireMember();
  if (!member) return { ok: false, error: "Posting is part of membership. Choose a plan to join in." };
  if ("refused" in member) return { ok: false, error: member.refused ?? "Your account can't post just now." };
  const upload = await storeUpload({ kind: "photo", file: formData.get("file") as File | null, ownerId: member.userId });
  if (!upload) return { ok: false, error: "Please choose a photo to add." };
  if (!upload.ok) return { ok: false, error: upload.message };
  return { ok: true, id: upload.file.id, url: upload.file.url };
}

/** A link the browser uploads a video to directly. */
export async function startVideoUpload(contentType: string, size: number) {
  const member = await requireMember();
  if (!member) return { ok: false as const, message: "Posting is part of membership. Choose a plan to join in." };
  if ("refused" in member) return { ok: false as const, message: member.refused };
  return createVideoUpload({ contentType, size });
}

/** Checks and records a video once the browser has finished uploading it. */
export async function finishVideoUpload(path: string, name: string): Promise<MediaUpload> {
  const member = await requireMember();
  if (!member) return { ok: false, error: "Posting is part of membership. Choose a plan to join in." };
  if ("refused" in member) return { ok: false, error: member.refused ?? "Your account can't post just now." };
  const result = await registerVideoUpload({ path, ownerId: member.userId, name });
  return result.ok ? { ok: true, id: result.file.id, url: result.file.url } : { ok: false, error: result.message };
}

/** A file the member uploaded and then took out of the post before sending it. */
export async function discardPostMedia(fileId: string) {
  const member = await requireMember();
  if (!member || "refused" in member) return;
  const file = await prisma.storedFile.findFirst({ where: { id: fileId, ownerId: member.userId }, select: { id: true } });
  if (!file) return;
  const attached = await prisma.postMedia.findUnique({ where: { fileId }, select: { id: true } }).catch(() => null);
  if (!attached) await deleteStoredFile(fileId);
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
  const mediaIds = [...new Set(formData.getAll("media").map(String))].slice(0, MAX_POST_MEDIA);

  // Only files this member uploaded themselves, for photos and videos, and not already on another post.
  const files = mediaIds.length
    ? await prisma.storedFile.findMany({
        where: { id: { in: mediaIds }, ownerId: userId, kind: { in: ["photo", "video"] } },
        select: { id: true, kind: true, contentType: true, width: true, height: true, driver: true, bucket: true, path: true, isPublic: true },
      })
    : [];
  const taken = files.length
    ? await prisma.postMedia.findMany({ where: { fileId: { in: files.map((f) => f.id) } }, select: { fileId: true } }).catch(() => null)
    : [];
  if (taken === null) return { error: "Photos and videos can't be added to posts just yet. Remove them to post your words now." };
  const takenIds = new Set(taken.map((t) => t.fileId));
  const media = mediaIds.map((id) => files.find((f) => f.id === id && !takenIds.has(id))).filter((f) => !!f);

  if (content.length < 2 && media.length === 0) return { error: "Write a little more, or add a photo or video, before posting." };
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
  if (media.length) {
    await prisma.postMedia.createMany({
      data: media.map((f, i) => ({
        postId: post.id,
        fileId: f.id,
        url: fileUrl(f),
        type: f.kind === "video" ? "video" : "image",
        contentType: f.contentType,
        width: f.width,
        height: f.height,
        sortOrder: i,
      })),
    });
  }

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

  // Replies are one level deep, so answering a reply attaches to the comment it belongs under.
  const parentRaw = clean(formData.get("parentId"), 64);
  const parent = parentRaw
    ? await prisma.comment.findFirst({
        where: { id: parentRaw, postId, hiddenAt: null },
        select: { id: true, parentId: true, authorId: true },
      })
    : null;
  if (parentRaw && !parent) return { error: "That reply could not be found. It may have been removed." };
  const parentId = parent ? (parent.parentId ?? parent.id) : null;

  const comment = await prisma.comment.create({ data: { content, postId, authorId: userId, parentId }, select: { id: true } });
  after(() => moderateNewContent({ postId, commentId: comment.id, text: content, roomId: space }));

  // Everyone with a stake in the thread hears about the reply once, by the closest reason:
  // the person answered first, then the post's author, then anyone else who has replied.
  const participants = await prisma.comment.findMany({
    where: { postId, hiddenAt: null, authorId: { not: userId } },
    select: { authorId: true },
    distinct: ["authorId"],
  });
  const recipients = new Map<string, "comment" | "post" | "thread">();
  if (parent && parent.authorId !== userId) recipients.set(parent.authorId, "comment");
  if (post.authorId !== userId && !recipients.has(post.authorId)) recipients.set(post.authorId, "post");
  for (const p of participants) if (!recipients.has(p.authorId)) recipients.set(p.authorId, "thread");

  if (recipients.size > 0) {
    const who = firstName(ctx.session?.user?.name) || "A member";
    const about = excerpt(post.title || post.content);
    const href = `/members/community/${postId}#comment-${comment.id}`;
    const titles = {
      comment: `${who} replied to your comment on “${about}”`,
      post: `${who} replied to “${about}”`,
      thread: `${who} also replied to “${about}”`,
    };
    for (const [recipientId, relation] of recipients) {
      await notify({ userId: recipientId, kind: "comment", title: titles[relation], href });
    }
    const commenter = ctx.session?.user?.name?.trim() || "A member";
    after(async () => {
      const people = await prisma.user.findMany({
        where: { id: { in: [...recipients.keys()] } },
        select: { id: true, name: true, email: true },
      });
      for (const person of people) {
        if (!person.email) continue;
        const email = commentReplyEmail({
          recipientName: person.name,
          commenterName: commenter,
          postTitle: post.title || post.content,
          comment: content,
          postId,
          relation: recipients.get(person.id),
        });
        await deliver(person.email, email.subject, email.content, { list: "activity", tag: "activity" });
      }
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

  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { space: true, hiddenAt: true, authorId: true, title: true, content: true },
  });
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
    if (post.authorId !== userId) {
      await notifyUseful({
        userId: post.authorId,
        reactorName: firstName(ctx.session?.user?.name) || "A member",
        count: await prisma.reaction.count({ where: { postId, userId: { not: post.authorId } } }),
        what: "post",
        about: excerpt(post.title || post.content),
        href: `/members/community/${postId}`,
      });
    }
  }
  revalidateFeeds(postId);
}

export async function toggleCommentUseful(commentId: string) {
  const member = await requireMember();
  if (!member) return;
  if ("refused" in member) return;
  const { ctx, userId } = member;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { postId: true, authorId: true, content: true, hiddenAt: true, post: { select: { space: true, hiddenAt: true } } },
  });
  const rooms = await getAllRooms();
  if (!comment || comment.hiddenAt || comment.post.hiddenAt) return;
  if (!canReadRoom(normalizeSpace(comment.post.space, rooms), ctx.professional, rooms)) return;

  const existing = await prisma.commentReaction.findUnique({
    where: { commentId_userId: { commentId, userId } },
    select: { id: true },
  });
  if (existing) {
    await prisma.commentReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.commentReaction.create({ data: { commentId, userId } });
    if (comment.authorId !== userId) {
      await notifyUseful({
        userId: comment.authorId,
        reactorName: firstName(ctx.session?.user?.name) || "A member",
        count: await prisma.commentReaction.count({ where: { commentId, userId: { not: comment.authorId } } }),
        what: "comment",
        about: excerpt(comment.content),
        href: `/members/community/${comment.postId}#comment-${commentId}`,
      });
    }
  }
  revalidatePath(`/members/community/${comment.postId}`);
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
