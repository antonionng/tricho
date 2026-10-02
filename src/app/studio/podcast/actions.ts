"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/staff";
import { images } from "@/content/images";
import { announceEpisode, planEpisode, writeShowNotes } from "@/agents/podcast";
import {
  fetchFeed,
  parseDuration,
  parseKeyMomentLines,
  parseTranscriptFile,
  transcriptParagraphs,
} from "@/lib/podcast-feed";

function s(form: FormData, key: string, max = 20000) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function n(form: FormData, key: string) {
  const v = s(form, key, 10);
  if (!v) return null;
  const num = Number(v);
  return Number.isInteger(num) && num >= 0 ? num : null;
}

function to(path: string, params: Record<string, string | undefined> = {}) {
  const url = new URL(path, "http://studio.local");
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  return `${url.pathname}${url.search}`;
}

function back(id: string, tab: string, notice?: string, tone?: "danger"): never {
  redirect(to(`/studio/podcast/${id}`, { tab, notice, tone }));
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
  const base = slugify(value) || "episode";
  let slug = base;
  for (let i = 2; i < 200; i++) {
    const taken = await prisma.podcastEpisode.findUnique({ where: { slug }, select: { id: true } });
    if (!taken || taken.id === excludeId) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

function refreshPublic() {
  revalidatePath("/podcast", "layout");
  revalidatePath("/sitemap.xml");
}

async function load(id: string) {
  const episode = await prisma.podcastEpisode.findUnique({ where: { id } });
  if (!episode) redirect(to("/studio/podcast", { notice: "That episode no longer exists.", tone: "danger" }));
  return episode;
}

function isUrl(value: string) {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Episodes list                                                        */
/* ------------------------------------------------------------------ */

/**
 * Bring in episodes from the host's RSS feed. New episodes become drafts.
 * Existing ones only get their audio file and length refreshed, so nothing
 * the team has written is ever overwritten.
 */
export async function syncFeedAction() {
  const staff = await requirePermission("podcast.edit");
  const url = process.env.PODCAST_FEED_URL?.trim();
  if (!url) redirect(to("/studio/podcast", { notice: "Set PODCAST_FEED_URL in the site settings first.", tone: "danger" }));

  let created = 0;
  let updated = 0;
  let message: string;
  let failed = false;
  try {
    const feed = await fetchFeed(url);
    for (const item of feed) {
      const existing =
        (await prisma.podcastEpisode.findUnique({ where: { externalId: item.guid } })) ??
        (await prisma.podcastEpisode.findFirst({
          where: { externalId: null, title: { equals: item.title, mode: "insensitive" } },
        }));
      if (existing) {
        const data: Prisma.PodcastEpisodeUpdateInput = {};
        if (!existing.externalId) data.externalId = item.guid;
        if (item.audioUrl && item.audioUrl !== existing.audioUrl) data.audioUrl = item.audioUrl;
        if (item.durationSec && item.durationSec !== existing.durationSec) data.durationSec = item.durationSec;
        if (item.embedUrl && !existing.embedUrl) data.embedUrl = item.embedUrl;
        if (Object.keys(data).length) {
          await prisma.podcastEpisode.update({ where: { id: existing.id }, data: { ...data, updatedById: staff.userId } });
          updated++;
        }
        continue;
      }
      const paragraphs = transcriptParagraphs(item.description);
      await prisma.podcastEpisode.create({
        data: {
          slug: await uniqueSlug(item.title),
          title: item.title,
          status: "draft",
          externalId: item.guid,
          audioUrl: item.audioUrl,
          embedUrl: item.embedUrl ?? null,
          durationSec: item.durationSec,
          summary: paragraphs[0]?.slice(0, 600) ?? "",
          showNotes: item.description,
          createdById: staff.userId,
          updatedById: staff.userId,
        },
      });
      created++;
    }
    message =
      feed.length === 0
        ? "The feed has no episodes yet."
        : `Checked ${feed.length} episode${feed.length === 1 ? "" : "s"} in the feed: ${created} new, ${updated} updated. New episodes stay as drafts until you publish them here.`;
  } catch (error) {
    failed = true;
    message = `Couldn't read the podcast feed: ${error instanceof Error ? error.message : String(error)}`;
  }
  await audit(staff, {
    action: failed ? "podcast.sync_failed" : "podcast.sync",
    targetType: "podcast",
    summary: message,
    after: { created, updated },
  });
  revalidatePath("/studio/podcast");
  redirect(to("/studio/podcast", { notice: message, tone: failed ? "danger" : undefined }));
}

/** Start a new episode from a guest and topic, with an interview plan to work from. */
export async function createEpisodeAction(form: FormData) {
  const staff = await requirePermission("podcast.edit");
  const guestName = s(form, "guestName", 120);
  const guestRole = s(form, "guestRole", 200) || null;
  const topic = s(form, "topic", 200) || null;
  const notes = s(form, "notes", 4000) || null;
  if (!guestName) redirect(to("/studio/podcast", { notice: "Add the guest's name to plan an episode.", tone: "danger" }));

  const plan = await planEpisode({ guestName, guestRole, topic, notes });
  const episode = await prisma.podcastEpisode.create({
    data: {
      slug: await uniqueSlug(`${guestName} ${topic ?? ""}`),
      title: plan.title,
      fade: plan.fade,
      guestName,
      guestRole,
      topic,
      plan: { ...plan, ...(notes ? { notes } : {}) } as unknown as Prisma.InputJsonObject,
      status: "planning",
      createdById: staff.userId,
      updatedById: staff.userId,
    },
  });
  await audit(staff, {
    action: "podcast.create",
    targetType: "podcast",
    targetId: episode.id,
    summary: `Planned a new episode with ${guestName}.`,
    after: { title: episode.title, guestName, topic },
  });
  revalidatePath("/studio/podcast");
  back(episode.id, "plan", "The plan is ready. Change anything you like before the recording.");
}

/* ------------------------------------------------------------------ */
/* One episode                                                          */
/* ------------------------------------------------------------------ */

export async function regeneratePlanAction(form: FormData) {
  const staff = await requirePermission("podcast.edit");
  const id = s(form, "id", 64);
  const episode = await load(id);
  const note = s(form, "note", 2000);
  const current = (episode.plan && typeof episode.plan === "object" && !Array.isArray(episode.plan) ? episode.plan : {}) as Record<string, unknown>;
  const earlier = typeof current.notes === "string" ? current.notes : "";
  const plan = await planEpisode({
    guestName: episode.guestName ?? "our guest",
    guestRole: episode.guestRole,
    topic: episode.topic,
    notes: [earlier, note].filter(Boolean).join("\n"),
  });
  // Keep anything else stored with the plan, such as a transcription in progress.
  await prisma.podcastEpisode.update({
    where: { id },
    data: { plan: { ...current, ...plan } as unknown as Prisma.InputJsonObject, updatedById: staff.userId },
  });
  await audit(staff, {
    action: "podcast.plan",
    targetType: "podcast",
    targetId: id,
    summary: `Asked for a fresh interview plan for "${episode.title}"${note ? ` with the note: ${note}` : "."}`,
  });
  back(id, "plan", "Here is a fresh plan. The episode title was left as it was.");
}

export async function saveAudioAction(form: FormData) {
  const staff = await requirePermission("podcast.edit");
  const id = s(form, "id", 64);
  const episode = await load(id);
  const audioUrl = s(form, "audioUrl", 1000);
  const embedUrl = s(form, "embedUrl", 1000);
  if (!isUrl(audioUrl) || !isUrl(embedUrl)) back(id, "audio", "The audio and player links must be full web addresses starting with https://.", "danger");
  const durationRaw = s(form, "duration", 12);
  const durationSec = durationRaw ? parseDuration(durationRaw) : null;
  if (durationRaw && durationSec === null) back(id, "audio", "Write the length as hh:mm:ss, mm:ss or a number of seconds.", "danger");
  const cover = s(form, "coverImageKey", 40);
  const coverImageKey = cover && cover in images ? cover : null;

  const guestEmail = s(form, "guestEmail", 200).toLowerCase();
  let guestUserId: string | null = null;
  if (guestEmail) {
    const user = await prisma.user.findFirst({ where: { email: { equals: guestEmail, mode: "insensitive" } }, select: { id: true } });
    if (!user) back(id, "audio", `There is no member with the email ${guestEmail}.`, "danger");
    guestUserId = user.id;
  }

  const data = {
    audioUrl: audioUrl || null,
    embedUrl: embedUrl || null,
    durationSec,
    coverImageKey,
    guestUserId,
    guestName: s(form, "guestName", 120) || null,
    guestRole: s(form, "guestRole", 200) || null,
    topic: s(form, "topic", 200) || null,
  };
  await prisma.podcastEpisode.update({ where: { id }, data: { ...data, updatedById: staff.userId } });
  await audit(staff, {
    action: "podcast.audio",
    targetType: "podcast",
    targetId: id,
    summary: `Updated the audio and guest details for "${episode.title}".`,
    before: {
      audioUrl: episode.audioUrl,
      embedUrl: episode.embedUrl,
      durationSec: episode.durationSec,
      coverImageKey: episode.coverImageKey,
      guestUserId: episode.guestUserId,
      guestName: episode.guestName,
    },
    after: data,
  });
  refreshPublic();
  back(id, "audio", "Saved.");
}

const MAX_TRANSCRIPT_FILE = 1.5 * 1024 * 1024;

export async function saveTranscriptAction(form: FormData) {
  const staff = await requirePermission("podcast.edit");
  const id = s(form, "id", 64);
  const episode = await load(id);
  const file = form.get("file");
  let transcript = s(form, "transcript", 2_000_000).replace(/\r\n?/g, "\n");
  let source = "pasted";
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_TRANSCRIPT_FILE) back(id, "transcript", "That file is larger than 1.5 MB. Paste the transcript into the text box instead.", "danger");
    if (!/\.(txt|vtt|srt)$/i.test(file.name)) back(id, "transcript", "Upload a .txt, .vtt or .srt file.", "danger");
    transcript = parseTranscriptFile(file.name, await file.text());
    source = file.name;
    if (!transcript) back(id, "transcript", "That file didn't contain any transcript text.", "danger");
  }
  const membersOnly = form.get("membersOnly") === "on";
  await prisma.podcastEpisode.update({
    where: { id },
    data: {
      transcript: transcript || null,
      transcriptStatus: transcript ? "ready" : "none",
      membersOnly,
      updatedById: staff.userId,
    },
  });
  await audit(staff, {
    action: "podcast.transcript",
    targetType: "podcast",
    targetId: id,
    summary: transcript
      ? `Saved the transcript for "${episode.title}" from ${source === "pasted" ? "the text box" : source}.`
      : `Cleared the transcript for "${episode.title}".`,
    before: { length: episode.transcript?.length ?? 0, membersOnly: episode.membersOnly },
    after: { length: transcript.length, membersOnly },
  });
  refreshPublic();
  back(id, "transcript", transcript ? "The transcript is saved." : "The transcript is cleared.");
}

export async function writeNotesAction(form: FormData) {
  const staff = await requirePermission("podcast.edit");
  const id = s(form, "id", 64);
  const episode = await load(id);
  const note = s(form, "note", 2000);
  const result = await writeShowNotes(id, note);
  await audit(staff, {
    action: result.ok ? "podcast.notes_generate" : "podcast.notes_generate_failed",
    targetType: "podcast",
    targetId: id,
    summary: `Asked for show notes for "${episode.title}". ${result.message}`,
    before: result.ok ? { summary: episode.summary, showNotes: episode.showNotes, quotes: episode.quotes } : undefined,
  });
  refreshPublic();
  back(id, "notes", result.message, result.ok ? undefined : "danger");
}

export async function saveNotesAction(form: FormData) {
  const staff = await requirePermission("podcast.edit");
  const id = s(form, "id", 64);
  const episode = await load(id);
  const title = s(form, "title", 200);
  if (!title) back(id, "notes", "The episode needs a title.", "danger");
  const quotes = s(form, "quotes", 4000)
    .split(/\r?\n/)
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, 3);
  const data = {
    title,
    fade: s(form, "fade", 200),
    summary: s(form, "summary", 2000),
    showNotes: s(form, "showNotes", 40000).replace(/\r\n?/g, "\n"),
    keyMoments: parseKeyMomentLines(s(form, "keyMoments", 8000)),
    quotes,
    guestBio: s(form, "guestBio", 2000) || null,
  };
  await prisma.podcastEpisode.update({
    where: { id },
    data: {
      ...data,
      keyMoments: data.keyMoments as unknown as Prisma.InputJsonArray,
      status: episode.status === "planning" ? "draft" : episode.status,
      updatedById: staff.userId,
    },
  });
  await audit(staff, {
    action: "podcast.notes",
    targetType: "podcast",
    targetId: id,
    summary: `Edited the show notes for "${title}".`,
    before: { title: episode.title, fade: episode.fade, summary: episode.summary, quotes: episode.quotes, guestBio: episode.guestBio },
    after: { title: data.title, fade: data.fade, summary: data.summary, quotes: data.quotes, guestBio: data.guestBio },
  });
  refreshPublic();
  back(id, "notes", "Saved.");
}

/** Number, season and web address, and publishing or withdrawing the episode. */
export async function publishAction(form: FormData) {
  const intent = s(form, "intent", 20);
  const id = s(form, "id", 64);
  const staff = await requirePermission(intent === "save" ? "podcast.edit" : "podcast.publish");
  const episode = await load(id);

  const slugInput = slugify(s(form, "slug", 100)) || episode.slug;
  const slug = slugInput === episode.slug ? episode.slug : await uniqueSlug(slugInput, id);
  const details = { number: n(form, "number"), season: n(form, "season"), slug };

  if (intent === "withdraw") {
    await prisma.podcastEpisode.update({ where: { id }, data: { ...details, status: "withdrawn", updatedById: staff.userId } });
    await audit(staff, {
      action: "podcast.withdraw",
      targetType: "podcast",
      targetId: id,
      summary: `Withdrew "${episode.title}" from the website.`,
      before: { status: episode.status },
      after: { status: "withdrawn" },
    });
    refreshPublic();
    back(id, "publish", "The episode is no longer on the website. Its page now shows as not found.");
  }

  if (intent === "publish") {
    const missing = [
      !episode.audioUrl && !episode.embedUrl ? "an audio file or player link" : "",
      !episode.summary.trim() ? "a summary" : "",
    ].filter(Boolean);
    if (missing.length) back(id, "publish", `Before publishing, add ${missing.join(" and ")}.`, "danger");
    const publishedAt = episode.publishedAt ?? new Date();
    await prisma.podcastEpisode.update({
      where: { id },
      data: { ...details, status: "published", publishedAt, updatedById: staff.userId },
    });
    const drafts = await announceEpisode(id);
    const drafted = [drafts.announcement && "an announcement email", drafts.post && "a community post"].filter(Boolean);
    await audit(staff, {
      action: "podcast.publish",
      targetType: "podcast",
      targetId: id,
      summary: `Published "${episode.title}" at /podcast/${slug}.`,
      before: { status: episode.status, slug: episode.slug },
      after: { status: "published", slug, publishedAt },
    });
    refreshPublic();
    back(
      id,
      "publish",
      drafted.length
        ? `The episode is live. ${drafted.join(" and ").replace(/^./, (c) => c.toUpperCase())} ${drafted.length === 1 ? "is" : "are"} waiting in the inbox for approval.`
        : "The episode is live."
    );
  }

  await prisma.podcastEpisode.update({ where: { id }, data: { ...details, updatedById: staff.userId } });
  await audit(staff, {
    action: "podcast.details",
    targetType: "podcast",
    targetId: id,
    summary: `Updated the number and web address of "${episode.title}".`,
    before: { number: episode.number, season: episode.season, slug: episode.slug },
    after: details,
  });
  refreshPublic();
  back(id, "publish", slug !== slugInput ? `Saved. That web address was taken, so it is /podcast/${slug}.` : "Saved.");
}
