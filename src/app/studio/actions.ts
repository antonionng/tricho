"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EventKind, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FREE_LISTING_DAYS } from "@/config/subscriptions";
import { getAgent } from "@/agents";
import { publishDraft, payloadOf } from "@/agents/publish";
import { releaseDraftRef, runAgent } from "@/agents/runtime";
import { studioAction } from "./_lib/guard";
import { deliver } from "@/lib/mail/send";
import { listingApprovedEmail, listingNotApprovedEmail, studioAccessEmail } from "@/lib/mail/templates/directory";

function s(form: FormData, key: string, max = 20000) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function withParams(path: string, params: Record<string, string | undefined>) {
  const url = new URL(path, "http://studio.local");
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  return `${url.pathname}${url.search}`;
}

/** Keep the inbox filters when moving around. */
function inboxUrl(form: FormData, params: Record<string, string | undefined>) {
  return withParams("/studio", {
    status: s(form, "f_status", 20) || undefined,
    agent: s(form, "f_agent", 40) || undefined,
    ...params,
  });
}

/* ------------------------------------------------------------------ */
/* Inbox                                                                */
/* ------------------------------------------------------------------ */

export async function approveDraftAction(form: FormData) {
  await studioAction();
  const id = s(form, "id", 64);
  const nextId = s(form, "nextId", 64) || undefined;
  const draft = await prisma.draft.findUnique({ where: { id }, select: { kind: true } });
  if (!draft) redirect(inboxUrl(form, { notice: "That draft no longer exists." }));

  if ((draft.kind === "newsletter" || draft.kind === "announcement") && s(form, "confirm", 8) !== "yes") {
    redirect(inboxUrl(form, { id, confirm: "1" }));
  }

  let message: string;
  let failed = false;
  try {
    message = (await publishDraft(id)).message;
  } catch (error) {
    failed = true;
    message = `Couldn't publish: ${error instanceof Error ? error.message : String(error)}`;
  }
  revalidatePath("/studio", "layout");
  revalidatePath("/members", "layout");
  redirect(inboxUrl(form, { id: failed ? id : nextId ?? id, notice: message, tone: failed ? "danger" : undefined }));
}

export async function saveDraftAction(form: FormData) {
  await studioAction();
  const id = s(form, "id", 64);
  const title = s(form, "title", 200);
  const body = s(form, "body");
  if (!title || !body) redirect(inboxUrl(form, { id, notice: "Title and text can't be empty.", tone: "danger" }));

  const draft = await prisma.draft.findUnique({ where: { id } });
  if (!draft) redirect(inboxUrl(form, {}));
  const payload = payloadOf(draft);
  const next: Record<string, unknown> = { ...payload };
  if (draft.kind === "email" || draft.kind === "newsletter") {
    next.subject = s(form, "subject", 200) || title;
  }
  if (draft.kind === "email") {
    const to = s(form, "to", 200);
    if (to) next.to = to;
  }
  if (draft.kind === "community_post") next.title = title;

  await prisma.draft.update({
    where: { id },
    data: { title, body, payload: next as Prisma.InputJsonObject },
  });
  revalidatePath("/studio");
  redirect(inboxUrl(form, { id, notice: "Saved your changes." }));
}

export async function rejectDraftAction(form: FormData) {
  await studioAction();
  const id = s(form, "id", 64);
  const note = s(form, "note", 2000);
  const nextId = s(form, "nextId", 64) || undefined;
  await prisma.draft.update({
    where: { id },
    data: { status: "rejected", reviewerNote: note || null, reviewedAt: new Date() },
  });
  revalidatePath("/studio", "layout");
  redirect(inboxUrl(form, { id: nextId ?? id, notice: "Rejected. The agent won't draft that one again." }));
}

export async function regenerateDraftAction(form: FormData) {
  await studioAction();
  const id = s(form, "id", 64);
  const draft = await prisma.draft.findUnique({ where: { id } });
  if (!draft || !getAgent(draft.agent)) redirect(inboxUrl(form, { id, notice: "This one can't be regenerated.", tone: "danger" }));

  await prisma.draft.update({
    where: { id },
    data: { status: "rejected", reviewerNote: draft.reviewerNote || "Replaced with a fresh draft.", reviewedAt: new Date() },
  });
  const ref = await releaseDraftRef(id);
  const outcome = await runAgent(draft.agent, "regenerate");
  const fresh =
    ref
      ? await prisma.draft.findFirst({
          where: { payload: { path: ["ref"], equals: ref }, status: "draft" },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        })
      : null;
  revalidatePath("/studio", "layout");
  redirect(
    inboxUrl(form, {
      id: fresh?.id,
      notice:
        outcome.status === "failed"
          ? `The agent ran into a problem: ${outcome.error}`
          : fresh
            ? "Here's a fresh version."
            : outcome.status === "skipped"
              ? outcome.summary
              : "The agent ran again but didn't produce a replacement for this one. Its conditions may no longer apply.",
      tone: outcome.status === "failed" ? "danger" : undefined,
    })
  );
}

/* ------------------------------------------------------------------ */
/* Agents                                                               */
/* ------------------------------------------------------------------ */

export async function runAgentNowAction(form: FormData) {
  await studioAction();
  const id = s(form, "agent", 40);
  const outcome = await runAgent(id, "manual");
  revalidatePath("/studio", "layout");
  redirect(
    withParams("/studio/agents", {
      notice: outcome.status === "failed" ? `${id}: ${outcome.error}` : outcome.summary,
      tone: outcome.status === "failed" ? "danger" : undefined,
    })
  );
}

export async function setAgentEnabledAction(form: FormData) {
  await studioAction();
  const agent = s(form, "agent", 40);
  if (!getAgent(agent)) return;
  const enabled = s(form, "enabled", 8) === "true";
  await prisma.agentSetting.upsert({ where: { agent }, update: { enabled }, create: { agent, enabled } });
  revalidatePath("/studio/agents");
}

export async function setAgentAutonomyAction(form: FormData) {
  await studioAction();
  const agent = getAgent(s(form, "agent", 40));
  if (!agent) return;
  const wanted = s(form, "autonomy", 8) === "auto" ? "auto" : "ask";
  // Only low-risk agents may ever publish on their own.
  const autonomy = agent.risk === "low" ? wanted : "ask";
  await prisma.agentSetting.upsert({
    where: { agent: agent.id },
    update: { autonomy },
    create: { agent: agent.id, autonomy },
  });
  revalidatePath("/studio/agents");
}

/* ------------------------------------------------------------------ */
/* Members                                                              */
/* ------------------------------------------------------------------ */

export async function makeAdminAction(form: FormData) {
  await studioAction();
  const id = s(form, "id", 64);
  const q = s(form, "q", 100) || undefined;
  if (s(form, "confirm", 8) !== "yes") redirect(withParams("/studio/members", { q, confirm: id }));
  const before = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  const user = await prisma.user.update({ where: { id }, data: { role: "admin" }, select: { name: true, email: true } });
  if (before && before.role !== "admin" && user.email) {
    const { subject, content } = studioAccessEmail(user);
    await deliver(user.email, subject, content, { tag: "studio-access" });
  }
  revalidatePath("/studio/members");
  redirect(withParams("/studio/members", { q, notice: `${user.name ?? user.email} now has Studio access.` }));
}

/* ------------------------------------------------------------------ */
/* Listings                                                             */
/* ------------------------------------------------------------------ */

/** The old admin review queue, ported: approving starts the free listing period. */
export async function reviewListingAction(form: FormData) {
  await studioAction();
  const id = s(form, "id", 64);
  const decision = s(form, "decision", 16);
  if (!id || (decision !== "approve" && decision !== "reject")) return;
  const before = await prisma.directoryListing.findUnique({ where: { id }, select: { status: true } });
  const listing = await prisma.directoryListing.update({
    where: { id },
    data: {
      status: decision === "approve" ? "listed" : "rejected",
      reviewedAt: new Date(),
      ...(decision === "approve" ? { freeUntil: new Date(Date.now() + FREE_LISTING_DAYS * 24 * 60 * 60 * 1000) } : {}),
    },
    select: { name: true, email: true, slug: true, kind: true, freeUntil: true, isSample: true, status: true },
  });
  // Only on a real change of decision, never for sample listings or paid members (already live).
  if (before && before.status !== listing.status && !listing.isSample && listing.kind === "listed") {
    const email =
      decision === "approve" && listing.slug && listing.freeUntil
        ? listingApprovedEmail({ name: listing.name, slug: listing.slug, freeUntil: listing.freeUntil })
        : decision === "reject"
          ? listingNotApprovedEmail(listing)
          : null;
    if (email) await deliver(listing.email, email.subject, email.content, { tag: `listing-${decision}` });
  }
  revalidatePath("/studio/listings");
  revalidatePath("/directory", "layout");
}

export async function toggleVerifiedAction(form: FormData) {
  await studioAction();
  const id = s(form, "id", 64);
  const listing = await prisma.directoryListing.findUnique({ where: { id }, select: { isVerified: true } });
  if (!listing) return;
  await prisma.directoryListing.update({ where: { id }, data: { isVerified: !listing.isVerified } });
  revalidatePath("/studio/listings");
  revalidatePath("/directory", "layout");
}

/* ------------------------------------------------------------------ */
/* Community                                                            */
/* ------------------------------------------------------------------ */

export async function resolveReportAction(form: FormData) {
  await studioAction();
  const id = s(form, "id", 64);
  await prisma.report.update({ where: { id }, data: { resolvedAt: new Date() } });
  revalidatePath("/studio/community");
}

export async function deletePostAction(form: FormData) {
  await studioAction();
  const postId = s(form, "postId", 64);
  if (s(form, "confirm", 8) !== "yes") redirect(withParams("/studio/community", { confirmDelete: postId }));
  await prisma.communityPost.delete({ where: { id: postId } }).catch(() => null);
  revalidatePath("/studio/community");
  revalidatePath("/members", "layout");
  redirect(withParams("/studio/community", { notice: "Post removed." }));
}

export async function togglePinAction(form: FormData) {
  await studioAction();
  const postId = s(form, "postId", 64);
  const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { pinned: true } });
  if (!post) return;
  await prisma.communityPost.update({ where: { id: postId }, data: { pinned: !post.pinned } });
  revalidatePath("/studio/community");
  revalidatePath("/members", "layout");
}

/* ------------------------------------------------------------------ */
/* Events                                                               */
/* ------------------------------------------------------------------ */

const EVENT_KINDS: EventKind[] = ["gathering", "masterclass", "case_round", "chapter_meetup", "welcome"];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function uniqueEventSlug(title: string) {
  const base = slugify(title) || "event";
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const taken = await prisma.event.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** datetime-local values are London wall-clock time. */
function londonToDate(value: string): Date | null {
  if (!value) return null;
  const guess = new Date(`${value}:00Z`);
  if (Number.isNaN(guess.getTime())) return null;
  const inLondon = new Date(guess.toLocaleString("en-US", { timeZone: "Europe/London" }));
  const inUtc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(guess.getTime() - (inLondon.getTime() - inUtc.getTime()));
}

function cleanUrl(value: string) {
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    return null;
  }
}

function pounds(value: string) {
  const n = Math.round(Number(value || 0));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function saveEventAction(form: FormData) {
  await studioAction();
  const id = s(form, "id", 64) || undefined;
  const title = s(form, "title", 160);
  const kind = s(form, "kind", 32) as EventKind;
  const summary = s(form, "summary", 400);
  const startsAt = londonToDate(s(form, "startsAt", 32));
  const endsAt = londonToDate(s(form, "endsAt", 32));
  const back = id ? { edit: id } : { new: "1" };

  if (!title || !summary || !startsAt || !EVENT_KINDS.includes(kind)) {
    redirect(withParams("/studio/events", { ...back, notice: "Please add a title, a type, a short summary and a start time.", tone: "danger" }));
  }

  const online = form.get("online") === "on";
  const capacityRaw = s(form, "capacity", 8);
  const data = {
    title,
    kind,
    summary,
    body: s(form, "body") || null,
    startsAt,
    endsAt,
    online,
    city: online ? null : s(form, "city", 80) || null,
    venue: online ? null : s(form, "venue", 160) || null,
    priceGBP: pounds(s(form, "priceGBP", 8)),
    memberPriceGBP: pounds(s(form, "memberPriceGBP", 8)),
    capacity: capacityRaw ? Math.max(0, Math.round(Number(capacityRaw))) || null : null,
    ticketUrl: cleanUrl(s(form, "ticketUrl", 500)),
    published: form.get("published") === "on",
  };

  let eventId: string;
  let newlyPublished = data.published;
  if (id) {
    const before = await prisma.event.findUnique({ where: { id }, select: { published: true } });
    newlyPublished = data.published && !before?.published;
    // The slug stays as it was, so links already shared keep working.
    eventId = (await prisma.event.update({ where: { id }, data, select: { id: true } })).id;
  } else {
    eventId = (await prisma.event.create({ data: { ...data, slug: await uniqueEventSlug(title) }, select: { id: true } })).id;
  }

  // A newly published event gets its announcement drafted straight away, for Karley to approve in the inbox.
  let announced = false;
  if (newlyPublished) {
    const { announceEvent } = await import("@/agents/announce");
    announced = !!(await announceEvent(eventId));
    if (announced) revalidatePath("/studio", "layout");
  }

  revalidatePath("/studio/events");
  revalidatePath("/events", "layout");
  revalidatePath("/members", "layout");
  redirect(
    withParams("/studio/events", {
      notice: data.published
        ? announced
          ? "Event saved and published. An announcement email is waiting for your approval in the inbox."
          : "Event saved and published."
        : "Event saved as a draft.",
    })
  );
}
