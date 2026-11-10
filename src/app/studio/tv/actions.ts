"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TvKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/staff";
import { getSystemUser } from "@/agents/publish";
import { parseVideoUrl } from "@/lib/video-embed";
import { isTvKind, tvHref, tvPost } from "@/lib/tv";

const HIDDEN_REASON = "The video was taken off Trichollective TV.";

function s(form: FormData, key: string, max = 5000) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function to(path: string, params: Record<string, string | undefined> = {}) {
  const url = new URL(path, "http://studio.local");
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  return `${url.pathname}${url.search}`;
}

function back(path: string, notice: string, tone?: "danger"): never {
  redirect(to(path, { notice, tone }));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/, "");
}

async function uniqueSlug(value: string, excludeId?: string) {
  const base = slugify(value) || "video";
  let slug = base;
  for (let i = 2; i < 200; i++) {
    const taken = await prisma.tvVideo.findUnique({ where: { slug }, select: { id: true } });
    if (!taken || taken.id === excludeId) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

/** A date from the form's date input, read as midday in London so it never slips a day either side. */
function dateFrom(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function refresh(slug?: string) {
  revalidatePath("/members/tv");
  if (slug) revalidatePath(tvHref(slug));
  revalidatePath("/members");
  revalidatePath("/members/community");
  revalidatePath("/members/events", "layout");
  revalidatePath("/events", "layout");
  revalidatePath("/studio/tv");
}

type Details = {
  kind: TvKind;
  title: string;
  summary: string;
  presenters: string | null;
  provider: "youtube" | "vimeo";
  videoId: string;
  durationMin: number | null;
  recordedAt: Date;
  professionalOnly: boolean;
  eventId: string | null;
  podcastEpisodeId: string | null;
};

/**
 * Reads the form. A linked event or podcast episode fills in whatever was left
 * blank, so a recording only needs its link and the event it came from.
 */
async function readDetails(form: FormData, returnTo: string, excludeId?: string): Promise<Details> {
  const link = s(form, "link", 500);
  const video = parseVideoUrl(link);
  if (!video) back(returnTo, "Please paste a Vimeo or YouTube link to the video.", "danger");

  const eventId = s(form, "eventId", 64) || null;
  const podcastEpisodeId = s(form, "podcastEpisodeId", 64) || null;
  const [event, episode] = await Promise.all([
    eventId
      ? prisma.event.findUnique({
          where: { id: eventId },
          select: { id: true, title: true, summary: true, presenters: true, startsAt: true, kind: true, recording: { select: { id: true } } },
        })
      : null,
    podcastEpisodeId
      ? prisma.podcastEpisode.findUnique({
          where: { id: podcastEpisodeId },
          select: { id: true, title: true, summary: true, guestName: true, guestRole: true, publishedAt: true, tvVideo: { select: { id: true } } },
        })
      : null,
  ]);
  if (eventId && !event) back(returnTo, "That event no longer exists. Choose another, or leave it blank.", "danger");
  if (podcastEpisodeId && !episode) back(returnTo, "That podcast episode no longer exists. Choose another, or leave it blank.", "danger");
  if (event?.recording && event.recording.id !== excludeId) {
    back(returnTo, `"${event.title}" already has a recording on Trichollective TV. Open that one to change it.`, "danger");
  }
  if (episode?.tvVideo && episode.tvVideo.id !== excludeId) {
    back(returnTo, `"${episode.title}" already has a video on Trichollective TV. Open that one to change it.`, "danger");
  }

  const kindInput = s(form, "kind", 20);
  const kind: TvKind = isTvKind(kindInput)
    ? kindInput
    : event?.kind === "masterclass" || event?.kind === "case_round"
      ? event.kind
      : episode
        ? "podcast"
        : "video";
  const guest = episode?.guestName ? [episode.guestName, episode.guestRole].filter(Boolean).join(", ") : null;
  const title = s(form, "title", 200) || event?.title || episode?.title || "";
  const recordedAt = dateFrom(s(form, "recordedAt", 10)) ?? event?.startsAt ?? episode?.publishedAt ?? null;
  if (!title) back(returnTo, "Give the video a title, or choose the event or episode it comes from.", "danger");
  if (!recordedAt) back(returnTo, "Add the date it was recorded, or choose the event or episode it comes from.", "danger");

  const duration = Number(s(form, "durationMin", 4));
  return {
    kind,
    title,
    summary: s(form, "summary") || event?.summary || episode?.summary || "",
    presenters: s(form, "presenters", 300) || event?.presenters || guest || null,
    provider: video!.provider,
    videoId: video!.id,
    durationMin: Number.isInteger(duration) && duration > 0 && duration < 1000 ? duration : null,
    recordedAt: recordedAt!,
    professionalOnly: form.get("professionalOnly") === "on",
    eventId: event?.id ?? null,
    podcastEpisodeId: episode?.id ?? null,
  };
}

/**
 * Puts the video live and, the first time, shares it in the community as the
 * team account. A post that was hidden when the video came down is shown again.
 */
async function goLive(id: string, share: boolean) {
  const video = await prisma.tvVideo.findUniqueOrThrow({ where: { id } });
  await prisma.tvVideo.update({ where: { id }, data: { published: true, publishedAt: video.publishedAt ?? new Date() } });

  if (video.postId) {
    await prisma.communityPost.updateMany({
      where: { id: video.postId, hiddenReason: HIDDEN_REASON },
      data: { hiddenAt: null, hiddenReason: null },
    });
    return "shown";
  }
  if (!share) return "none";
  const system = await getSystemUser();
  const post = tvPost(video);
  const created = await prisma.communityPost.create({
    data: { title: post.title, content: post.content, category: "discussion", space: post.space, authorId: system.id },
    select: { id: true },
  });
  await prisma.tvVideo.update({ where: { id }, data: { postId: created.id } });
  return "posted";
}

async function hidePost(postId: string | null) {
  if (!postId) return;
  await prisma.communityPost.updateMany({
    where: { id: postId, hiddenAt: null },
    data: { hiddenAt: new Date(), hiddenReason: HIDDEN_REASON },
  });
}

function liveNotice(result: string, professionalOnly: boolean) {
  if (result === "posted") return `It's live on Trichollective TV and shared in ${professionalOnly ? "the Case Room" : "The Lounge"}.`;
  if (result === "shown") return "It's live on Trichollective TV again, and its community post is back.";
  return "It's live on Trichollective TV.";
}

export async function createTvVideoAction(form: FormData) {
  const publish = s(form, "intent", 20) === "publish";
  const staff = await requirePermission("tv.edit");
  const details = await readDetails(form, "/studio/tv?new=1");
  const video = await prisma.tvVideo.create({
    data: { ...details, slug: await uniqueSlug(details.title), createdById: staff.userId },
    select: { id: true, slug: true },
  });
  const result = publish ? await goLive(video.id, form.get("share") === "on") : null;
  await audit(staff, {
    action: publish ? "tv.publish" : "tv.create",
    targetType: "tv",
    targetId: video.id,
    summary: `${publish ? "Published" : "Added a draft of"} "${details.title}" on Trichollective TV.`,
    after: { kind: details.kind, slug: video.slug, published: publish, eventId: details.eventId },
  });
  refresh(video.slug);
  back(`/studio/tv/${video.id}`, result ? liveNotice(result, details.professionalOnly) : "Saved as a draft. Members can't see it until you publish it.");
}

export async function updateTvVideoAction(form: FormData) {
  const id = s(form, "tvId", 64);
  const intent = s(form, "intent", 20);
  const staff = await requirePermission("tv.edit");
  const existing = await prisma.tvVideo.findUnique({ where: { id } });
  if (!existing) back("/studio/tv", "That video no longer exists.", "danger");
  const returnTo = `/studio/tv/${id}`;

  if (intent === "unpublish") {
    await prisma.tvVideo.update({ where: { id }, data: { published: false } });
    await hidePost(existing!.postId);
    await audit(staff, {
      action: "tv.unpublish",
      targetType: "tv",
      targetId: id,
      summary: `Took "${existing!.title}" off Trichollective TV.`,
    });
    refresh(existing!.slug);
    back(returnTo, existing!.postId ? "It's off Trichollective TV, and its community post is hidden." : "It's off Trichollective TV.");
  }

  const details = await readDetails(form, returnTo, id);
  const slugInput = slugify(s(form, "slug", 80));
  const slug = slugInput && slugInput !== existing!.slug ? await uniqueSlug(slugInput, id) : existing!.slug;
  await prisma.tvVideo.update({ where: { id }, data: { ...details, slug } });
  const result = intent === "publish" ? await goLive(id, form.get("share") === "on") : null;
  await audit(staff, {
    action: result ? "tv.publish" : "tv.update",
    targetType: "tv",
    targetId: id,
    summary: `${result ? "Published" : "Updated"} "${details.title}" on Trichollective TV.`,
    before: { title: existing!.title, slug: existing!.slug, published: existing!.published },
    after: { title: details.title, slug, published: result ? true : existing!.published },
  });
  if (slug !== existing!.slug) revalidatePath(tvHref(existing!.slug));
  refresh(slug);
  back(returnTo, result ? liveNotice(result, details.professionalOnly) : "Saved.");
}

export async function deleteTvVideoAction(form: FormData) {
  const id = s(form, "tvId", 64);
  const staff = await requirePermission("tv.edit");
  const existing = await prisma.tvVideo.findUnique({ where: { id } });
  if (!existing) back("/studio/tv", "That video was already deleted.");
  await hidePost(existing!.postId);
  await prisma.tvVideo.delete({ where: { id } });
  await audit(staff, {
    action: "tv.delete",
    targetType: "tv",
    targetId: id,
    summary: `Deleted "${existing!.title}" from Trichollective TV.`,
    before: { title: existing!.title, slug: existing!.slug, published: existing!.published },
  });
  refresh(existing!.slug);
  back("/studio/tv", `Deleted "${existing!.title}".${existing!.postId ? " Its community post is hidden." : ""}`);
}
