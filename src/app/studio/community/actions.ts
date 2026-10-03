"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { draftRefExists } from "@/agents/runtime";
import { DEFAULT_ROOMS, LEGACY_SPACES, roomById } from "@/config/rooms";
import { getAllRooms } from "@/lib/rooms";
import { audit, requirePermission } from "@/lib/staff";
import { alertOwners } from "@/lib/mail/send";
import { reportEscalatedAlert } from "@/lib/mail/templates/owners";
import { LAUNCH_POSTS } from "@/content/launch-posts";
import { studioAction } from "../_lib/guard";

/**
 * Drafts the launch-week discussion starters for the team to approve. Posts that
 * were drafted before (in any state) are skipped, so this is safe to press twice.
 */
export async function draftLaunchPostsAction() {
  await studioAction("community.moderate");

  let created = 0;
  let skipped = 0;
  const rooms = await getAllRooms();
  for (const [index, post] of LAUNCH_POSTS.entries()) {
    const ref = `launch:${index}`;
    if (await draftRefExists(ref)) {
      skipped++;
      continue;
    }
    // Saved straight to the inbox rather than through createDraft, so nothing
    // is published without a person reading it first.
    await prisma.draft.create({
      data: {
        agent: "community",
        kind: "community_post",
        title: post.title,
        summary: `Launch-week post for ${roomById(post.space, rooms)?.label ?? post.space}${post.pin ? ", pinned to the top" : ""}.`,
        body: post.body,
        payload: { space: post.space, title: post.title, pin: !!post.pin, ref },
      },
    });
    created++;
  }

  revalidatePath("/studio", "layout");
  const notice =
    created === 0
      ? "The launch-week posts have already been drafted. You'll find them in the inbox."
      : `Drafted ${created} launch-week post${created === 1 ? "" : "s"}${skipped ? ` (${skipped} already existed)` : ""}. Approve each one in the inbox to post it as the Trichollective team.`;
  redirect(`/studio/community?notice=${encodeURIComponent(notice)}`);
}

/* ------------------------------------------------------------------ */
/* Moderation                                                           */
/* ------------------------------------------------------------------ */

function field(form: FormData, key: string, max = 2000) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function back(params: Record<string, string>, path = "/studio/community"): never {
  const query = new URLSearchParams(params).toString();
  redirect(query ? `${path}?${query}` : path);
}

/** The post or reply a moderation form is about. */
async function loadItem(form: FormData) {
  const postId = field(form, "postId", 64);
  const commentId = field(form, "commentId", 64) || null;
  if (commentId) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, postId: true, content: true, authorId: true, hiddenAt: true, hiddenReason: true, author: { select: { name: true } } },
    });
    if (!comment) return null;
    return {
      kind: "comment" as const,
      id: comment.id,
      postId: comment.postId,
      commentId: comment.id,
      text: comment.content,
      authorId: comment.authorId,
      authorName: comment.author.name,
      hiddenAt: comment.hiddenAt,
      hiddenReason: comment.hiddenReason,
    };
  }
  if (!postId) return null;
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { id: true, title: true, content: true, authorId: true, hiddenAt: true, hiddenReason: true, author: { select: { name: true } } },
  });
  if (!post) return null;
  return {
    kind: "post" as const,
    id: post.id,
    postId: post.id,
    commentId: null,
    text: post.title ? `${post.title}\n\n${post.content}` : post.content,
    authorId: post.authorId,
    authorName: post.author.name,
    hiddenAt: post.hiddenAt,
    hiddenReason: post.hiddenReason,
  };
}

type Item = NonNullable<Awaited<ReturnType<typeof loadItem>>>;

function label(item: Item) {
  const text = item.text.replace(/\s+/g, " ");
  return `${item.kind === "comment" ? "the reply" : "the post"} "${text.length > 60 ? `${text.slice(0, 60)}…` : text}"`;
}

/** Closes every open report about this post or reply. */
async function resolveReports(item: Item, staffId: string, resolution: string) {
  const { count } = await prisma.report.updateMany({
    where: { postId: item.postId, commentId: item.commentId, resolvedAt: null },
    data: { resolvedAt: new Date(), resolvedById: staffId, resolution },
  });
  return count;
}

function refresh(postId?: string) {
  revalidatePath("/studio/community");
  revalidatePath("/members", "layout");
  if (postId) revalidatePath(`/members/community/${postId}`);
}

export async function dismissReportsAction(form: FormData) {
  const staff = await requirePermission("community.moderate");
  const item = await loadItem(form);
  if (!item) back({ notice: "That post or reply no longer exists." });
  const count = await resolveReports(item, staff.userId, "dismissed");
  await audit(staff, {
    action: "report.dismiss",
    targetType: item.kind,
    targetId: item.id,
    summary: `Dismissed ${count} report${count === 1 ? "" : "s"} about ${label(item)}.`,
  });
  refresh();
  back({ notice: "The reports were dismissed and the content stays as it is." });
}

export async function hideContentAction(form: FormData) {
  const staff = await requirePermission("community.moderate");
  const item = await loadItem(form);
  if (!item) back({ notice: "That post or reply no longer exists." });
  const hiddenReason = field(form, "reason", 300) || "Hidden by the Trichollective team while it is reviewed.";
  const data = { hiddenAt: new Date(), hiddenReason };
  if (item.kind === "comment") await prisma.comment.update({ where: { id: item.id }, data });
  else await prisma.communityPost.update({ where: { id: item.id }, data });
  await resolveReports(item, staff.userId, "hidden");
  await audit(staff, {
    action: item.kind === "comment" ? "comment.hide" : "post.hide",
    targetType: item.kind,
    targetId: item.id,
    summary: `Hid ${label(item)}.`,
    before: { hiddenAt: item.hiddenAt, hiddenReason: item.hiddenReason },
    after: data,
  });
  refresh(item.postId);
  back({ notice: `The ${item.kind === "comment" ? "reply" : "post"} is now hidden from members. You can restore it from Recently hidden.` });
}

export async function unhideContentAction(form: FormData) {
  const staff = await requirePermission("community.moderate");
  const item = await loadItem(form);
  if (!item) back({ notice: "That post or reply no longer exists." });
  const data = { hiddenAt: null, hiddenReason: null };
  if (item.kind === "comment") await prisma.comment.update({ where: { id: item.id }, data });
  else await prisma.communityPost.update({ where: { id: item.id }, data });
  await audit(staff, {
    action: item.kind === "comment" ? "comment.unhide" : "post.unhide",
    targetType: item.kind,
    targetId: item.id,
    summary: `Restored ${label(item)}.`,
    before: { hiddenAt: item.hiddenAt, hiddenReason: item.hiddenReason },
    after: data,
  });
  refresh(item.postId);
  back({ notice: `The ${item.kind === "comment" ? "reply" : "post"} is visible to members again.` });
}

export async function removeCommentAction(form: FormData) {
  const staff = await requirePermission("community.moderate");
  const commentId = field(form, "commentId", 64);
  if (field(form, "confirm", 8) !== "yes") back({ confirmDelete: commentId });
  const removed = await prisma.comment
    .delete({ where: { id: commentId }, select: { postId: true, content: true, authorId: true } })
    .catch(() => null);
  if (removed) {
    await audit(staff, {
      action: "comment.remove",
      targetType: "comment",
      targetId: commentId,
      summary: `Removed a reply: "${removed.content.slice(0, 60)}".`,
      before: removed,
    });
  }
  refresh(removed?.postId);
  back({ notice: "The reply has been removed for good." });
}

const MUTE_DAYS = new Set([1, 7, 30]);

export async function muteAuthorAction(form: FormData) {
  const staff = await requirePermission("community.moderate");
  const item = await loadItem(form);
  if (!item) back({ notice: "That post or reply no longer exists." });
  const days = Number(field(form, "days", 4));
  if (!MUTE_DAYS.has(days)) back({ notice: "Choose how long to mute the member for." });
  const author = await prisma.user.findUnique({ where: { id: item.authorId }, select: { mutedUntil: true, staffRole: true } });
  if (author?.staffRole) back({ notice: "Members of the team cannot be muted from here." });
  const mutedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await prisma.user.update({ where: { id: item.authorId }, data: { mutedUntil } });
  await resolveReports(item, staff.userId, "muted");
  const period = days === 1 ? "24 hours" : `${days} days`;
  await audit(staff, {
    action: "member.mute",
    targetType: "user",
    targetId: item.authorId,
    summary: `Muted ${item.authorName ?? "a member"} for ${period} after reviewing ${label(item)}.`,
    before: { mutedUntil: author?.mutedUntil ?? null },
    after: { mutedUntil },
  });
  refresh();
  back({ notice: `${item.authorName ?? "The member"} cannot post or reply for the next ${period}. They can still read the community.` });
}

/**
 * Hands a report to the owners. Escalated reports stay in the queue, marked as
 * escalated, until someone dismisses, hides or removes the content.
 */
export async function escalateReportsAction(form: FormData) {
  const staff = await requirePermission("community.moderate");
  const item = await loadItem(form);
  if (!item) back({ notice: "That post or reply no longer exists." });
  const note = field(form, "note", 500) || null;
  const open = await prisma.report.findMany({
    where: { postId: item.postId, commentId: item.commentId, resolvedAt: null },
    select: { reason: true },
    orderBy: { createdAt: "asc" },
  });
  await prisma.report.updateMany({
    where: { postId: item.postId, commentId: item.commentId, resolvedAt: null },
    data: { resolution: "escalated", resolvedById: staff.userId },
  });
  await audit(staff, {
    action: "report.escalate",
    targetType: item.kind,
    targetId: item.id,
    summary: `Escalated ${label(item)} to the owners.`,
    after: { note },
  });
  after(() =>
    alertOwners(
      reportEscalatedAlert({
        reason: open.map((r) => r.reason).join(" / ") || "No reason given",
        content: item.text,
        escalatedBy: staff.name ?? staff.email,
        note,
      })
    )
  );
  refresh();
  back({ notice: "The owners have been told. The report stays in the queue, marked as escalated, until it is resolved." });
}

/* ------------------------------------------------------------------ */
/* Rooms                                                                */
/* ------------------------------------------------------------------ */

const ROOMS_PATH = "/studio/community/rooms";

function refreshRooms() {
  revalidatePath("/members", "layout");
  revalidatePath("/studio/community");
  revalidatePath(ROOMS_PATH);
}

function roomSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32)
    .replace(/-$/, "");
}

function roomFields(form: FormData) {
  return {
    label: field(form, "label", 60),
    blurb: field(form, "blurb", 240),
    prompt: field(form, "prompt", 240),
    professionalOnly: form.get("professionalOnly") === "on",
    noBrands: form.get("noBrands") === "on",
    aiModeration: form.get("aiModeration") === "on",
  };
}

/** If the table is empty the site is running on the built-in rooms, so save those first. */
async function ensureRoomsSaved() {
  if ((await prisma.communityRoom.count()) > 0) return;
  await prisma.communityRoom.createMany({
    data: DEFAULT_ROOMS.map((r, position) => ({
      id: r.id,
      label: r.label,
      blurb: r.blurb,
      prompt: r.prompt,
      professionalOnly: !!r.professionalOnly,
      noBrands: !!r.noBrands,
      aiModeration: !!r.aiModeration,
      position,
    })),
    skipDuplicates: true,
  });
}

export async function createRoomAction(form: FormData) {
  const staff = await requirePermission("community.rooms");
  const data = roomFields(form);
  if (!data.label) back({ error: "Give the room a name so members know what it is for." }, ROOMS_PATH);
  if (!data.blurb) back({ error: "Add a sentence describing the room, so members know what belongs there." }, ROOMS_PATH);
  await ensureRoomsSaved();

  const base = roomSlug(data.label) || "room";
  let id = base;
  for (let i = 2; LEGACY_SPACES[id] || (await prisma.communityRoom.findUnique({ where: { id }, select: { id: true } })); i++) {
    id = `${base}-${i}`;
  }
  const last = await prisma.communityRoom.aggregate({ _max: { position: true } });
  const room = await prisma.communityRoom.create({
    data: { id, ...data, prompt: data.prompt || "What would you like to talk about?", position: (last._max.position ?? -1) + 1 },
  });
  await audit(staff, { action: "room.create", targetType: "room", targetId: id, summary: `Created the room ${room.label}.`, after: room });
  refreshRooms();
  back({ notice: `${room.label} is now open to members.` }, ROOMS_PATH);
}

export async function saveRoomAction(form: FormData) {
  const staff = await requirePermission("community.rooms");
  await ensureRoomsSaved();
  const id = field(form, "id", 64);
  const data = roomFields(form);
  const before = await prisma.communityRoom.findUnique({ where: { id } });
  if (!before) back({ error: "That room could not be found." }, ROOMS_PATH);
  if (!data.label || !data.blurb) back({ error: "Every room needs a name and a description." }, ROOMS_PATH);
  const room = await prisma.communityRoom.update({ where: { id }, data: { ...data, prompt: data.prompt || before.prompt } });
  await audit(staff, { action: "room.update", targetType: "room", targetId: id, summary: `Updated the room ${room.label}.`, before, after: room });
  refreshRooms();
  back({ notice: `Your changes to ${room.label} are saved.` }, ROOMS_PATH);
}

export async function moveRoomAction(form: FormData) {
  const staff = await requirePermission("community.rooms");
  await ensureRoomsSaved();
  const id = field(form, "id", 64);
  const direction = field(form, "direction", 8) === "up" ? -1 : 1;
  const rooms = await prisma.communityRoom.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }], select: { id: true, label: true } });
  const index = rooms.findIndex((r) => r.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= rooms.length) back({}, ROOMS_PATH);
  [rooms[index], rooms[target]] = [rooms[target], rooms[index]];
  await prisma.$transaction(rooms.map((r, position) => prisma.communityRoom.update({ where: { id: r.id }, data: { position } })));
  await audit(staff, {
    action: "room.move",
    targetType: "room",
    targetId: id,
    summary: `Moved ${rooms[target].label} ${direction < 0 ? "up" : "down"} the list.`,
  });
  refreshRooms();
  back({}, ROOMS_PATH);
}

export async function archiveRoomAction(form: FormData) {
  const staff = await requirePermission("community.rooms");
  await ensureRoomsSaved();
  const id = field(form, "id", 64);
  const archive = field(form, "archive", 8) === "yes";
  if (archive && id === "lounge") {
    back({ error: "The Lounge cannot be archived, because posts from retired rooms are shown there." }, ROOMS_PATH);
  }
  const before = await prisma.communityRoom.findUnique({ where: { id } });
  if (!before) back({ error: "That room could not be found." }, ROOMS_PATH);
  const room = await prisma.communityRoom.update({ where: { id }, data: { archivedAt: archive ? new Date() : null } });
  await audit(staff, {
    action: archive ? "room.archive" : "room.restore",
    targetType: "room",
    targetId: id,
    summary: `${archive ? "Archived" : "Restored"} the room ${room.label}.`,
    before: { archivedAt: before.archivedAt },
    after: { archivedAt: room.archivedAt },
  });
  refreshRooms();
  back(
    {
      notice: archive
        ? `${room.label} is archived. Its posts stay readable, but members can no longer post there.`
        : `${room.label} is open to members again.`,
    },
    ROOMS_PATH
  );
}
