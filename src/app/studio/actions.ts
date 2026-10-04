"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FREE_LISTING_DAYS } from "@/config/subscriptions";
import { getAgent } from "@/agents";
import { publishDraft, payloadOf } from "@/agents/publish";
import { releaseDraftRef, runAgent } from "@/agents/runtime";
import { announceEpisode, episodeIdFromRef, PODCAST_AGENT } from "@/agents/podcast";
import { audit, requirePermission } from "@/lib/staff";
import { canApproveDraft } from "@/config/staff";
import { deliver } from "@/lib/mail/send";
import { listingApprovedEmail, listingNotApprovedEmail } from "@/lib/mail/templates/directory";
import { validateEventInput } from "@/lib/event-input";

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
  return withParams("/studio/inbox", {
    status: s(form, "f_status", 20) || undefined,
    agent: s(form, "f_agent", 40) || undefined,
    kind: s(form, "f_kind", 40) || undefined,
    ...params,
  });
}

/* ------------------------------------------------------------------ */
/* Inbox                                                                */
/* ------------------------------------------------------------------ */

/** Anyone with the inbox can read drafts; deciding on one depends on its kind. */
async function requireDraftDecision(id: string) {
  const staff = await requirePermission("inbox.view");
  const draft = await prisma.draft.findUnique({ where: { id }, select: { kind: true, payload: true, title: true } });
  if (draft && !canApproveDraft(staff.role, draft.kind, draft.payload)) {
    throw new Error("Your role does not include approving this kind of draft.");
  }
  return { staff, draft };
}

export async function approveDraftAction(form: FormData) {
  const id = s(form, "id", 64);
  const nextId = s(form, "nextId", 64) || undefined;
  const { staff, draft } = await requireDraftDecision(id);
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
  await audit(staff, {
    action: failed ? "draft.publish_failed" : "draft.publish",
    targetType: "draft",
    targetId: id,
    summary: `${failed ? "Tried to publish" : "Approved"} "${draft.title}". ${message}`,
    after: { kind: draft.kind },
  });
  revalidatePath("/studio", "layout");
  revalidatePath("/members", "layout");
  redirect(inboxUrl(form, { id: failed ? id : nextId ?? id, notice: message, tone: failed ? "danger" : undefined }));
}

export async function saveDraftAction(form: FormData) {
  const id = s(form, "id", 64);
  const { staff } = await requireDraftDecision(id);
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
  await audit(staff, {
    action: "draft.edit",
    targetType: "draft",
    targetId: id,
    summary: `Edited the wording of "${title}".`,
    before: { title: draft.title, body: draft.body },
    after: { title, body },
  });
  revalidatePath("/studio/inbox");
  redirect(inboxUrl(form, { id, notice: "Saved your changes." }));
}

export async function rejectDraftAction(form: FormData) {
  const id = s(form, "id", 64);
  const { staff, draft: existing } = await requireDraftDecision(id);
  const note = s(form, "note", 2000);
  const nextId = s(form, "nextId", 64) || undefined;
  await prisma.draft.update({
    where: { id },
    data: { status: "rejected", reviewerNote: note || null, reviewedAt: new Date() },
  });
  await audit(staff, {
    action: "draft.reject",
    targetType: "draft",
    targetId: id,
    summary: `Rejected "${existing?.title ?? id}"${note ? ` with the note: ${note}` : "."}`,
  });
  revalidatePath("/studio", "layout");
  redirect(inboxUrl(form, { id: nextId ?? id, notice: "Rejected. The agent won't draft that one again." }));
}

export async function regenerateDraftAction(form: FormData) {
  const id = s(form, "id", 64);
  const { staff } = await requireDraftDecision(id);
  const draft = await prisma.draft.findUnique({ where: { id } });
  // Podcast drafts aren't from a scheduled agent: they are drafted again from their episode.
  const episodeId = draft?.agent === PODCAST_AGENT ? episodeIdFromRef(payloadOf(draft).ref) : null;
  if (!draft || (!getAgent(draft.agent) && !episodeId)) redirect(inboxUrl(form, { id, notice: "This one can't be regenerated.", tone: "danger" }));

  await prisma.draft.update({
    where: { id },
    data: { status: "rejected", reviewerNote: draft.reviewerNote || "Replaced with a fresh draft.", reviewedAt: new Date() },
  });
  const ref = await releaseDraftRef(id);
  const outcome = episodeId
    ? await announceEpisode(episodeId).then(() => ({ status: "succeeded" as const, summary: "", error: undefined }))
    : await runAgent(draft.agent, "regenerate");
  await audit(staff, { action: "draft.regenerate", targetType: "draft", targetId: id, summary: `Asked for a fresh version of "${draft.title}".` });
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
  const staff = await requirePermission("agents.manage");
  const id = s(form, "agent", 40);
  const outcome = await runAgent(id, "manual");
  await audit(staff, { action: "agent.run", targetType: "agent", targetId: id, summary: `Ran the ${id} agent by hand.` });
  revalidatePath("/studio", "layout");
  redirect(
    withParams("/studio/agents", {
      notice: outcome.status === "failed" ? `${id}: ${outcome.error}` : outcome.summary,
      tone: outcome.status === "failed" ? "danger" : undefined,
    })
  );
}

export async function setAgentEnabledAction(form: FormData) {
  const staff = await requirePermission("agents.manage");
  const agent = s(form, "agent", 40);
  if (!getAgent(agent)) return;
  const enabled = s(form, "enabled", 8) === "true";
  await prisma.agentSetting.upsert({ where: { agent }, update: { enabled }, create: { agent, enabled } });
  await audit(staff, {
    action: enabled ? "agent.enable" : "agent.disable",
    targetType: "agent",
    targetId: agent,
    summary: `${enabled ? "Switched on" : "Switched off"} the ${agent} agent.`,
  });
  revalidatePath("/studio/agents");
}

export async function setAgentAutonomyAction(form: FormData) {
  const staff = await requirePermission("agents.manage");
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
  await audit(staff, {
    action: "agent.autonomy",
    targetType: "agent",
    targetId: agent.id,
    summary: autonomy === "auto" ? `Let the ${agent.id} agent publish on its own.` : `The ${agent.id} agent now asks before publishing.`,
    after: { autonomy },
  });
  revalidatePath("/studio/agents");
}

/* ------------------------------------------------------------------ */
/* Listings                                                             */
/* ------------------------------------------------------------------ */

/** The old admin review queue, ported: approving starts the free listing period. */
export async function reviewListingAction(form: FormData) {
  const staff = await requirePermission("listings.review");
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
  await audit(staff, {
    action: `listing.${decision}`,
    targetType: "listing",
    targetId: id,
    summary: `${decision === "approve" ? "Approved" : "Turned down"} the listing for ${listing.name}.`,
    before: { status: before?.status },
    after: { status: listing.status },
  });
  revalidatePath("/studio/listings");
  revalidatePath("/directory", "layout");
}

export async function toggleVerifiedAction(form: FormData) {
  const staff = await requirePermission("listings.review");
  const id = s(form, "id", 64);
  const listing = await prisma.directoryListing.findUnique({ where: { id }, select: { isVerified: true, name: true } });
  if (!listing) return;
  await prisma.directoryListing.update({ where: { id }, data: { isVerified: !listing.isVerified } });
  await audit(staff, {
    action: listing.isVerified ? "listing.unverify" : "listing.verify",
    targetType: "listing",
    targetId: id,
    summary: `${listing.isVerified ? "Removed the verified mark from" : "Verified"} ${listing.name}.`,
  });
  revalidatePath("/studio/listings");
  revalidatePath("/directory", "layout");
}

/* ------------------------------------------------------------------ */
/* Community                                                            */
/* ------------------------------------------------------------------ */

export async function resolveReportAction(form: FormData) {
  const staff = await requirePermission("community.moderate");
  const id = s(form, "id", 64);
  await prisma.report.update({
    where: { id },
    data: { resolvedAt: new Date(), resolution: "dismissed", resolvedById: staff.userId },
  });
  await audit(staff, { action: "report.dismiss", targetType: "report", targetId: id, summary: "Dismissed a report." });
  revalidatePath("/studio/community");
}

export async function deletePostAction(form: FormData) {
  const staff = await requirePermission("community.moderate");
  const postId = s(form, "postId", 64);
  if (s(form, "confirm", 8) !== "yes") redirect(withParams("/studio/community", { confirmDelete: postId }));
  const removed = await prisma.communityPost
    .delete({ where: { id: postId }, select: { title: true, content: true, authorId: true } })
    .catch(() => null);
  if (removed) {
    await audit(staff, {
      action: "post.remove",
      targetType: "post",
      targetId: postId,
      summary: `Removed the post "${removed.title ?? removed.content.slice(0, 60)}".`,
      before: removed,
    });
  }
  revalidatePath("/studio/community");
  revalidatePath("/members", "layout");
  redirect(withParams("/studio/community", { notice: "Post removed." }));
}

export async function togglePinAction(form: FormData) {
  const staff = await requirePermission("community.moderate");
  const postId = s(form, "postId", 64);
  const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { pinned: true, title: true } });
  if (!post) return;
  await prisma.communityPost.update({ where: { id: postId }, data: { pinned: !post.pinned } });
  await audit(staff, {
    action: post.pinned ? "post.unpin" : "post.pin",
    targetType: "post",
    targetId: postId,
    summary: `${post.pinned ? "Unpinned" : "Pinned"} "${post.title ?? "a post"}".`,
  });
  revalidatePath("/studio/community");
  revalidatePath("/members", "layout");
}

/* ------------------------------------------------------------------ */
/* Events                                                               */
/* ------------------------------------------------------------------ */

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

const EVENT_FIELDS = ["title", "kind", "summary", "body", "startsAt", "endsAt", "online", "city", "venue", "priceGBP", "memberPriceGBP", "capacity", "ticketUrl", "published", "sellTickets"] as const;

export async function saveEventAction(form: FormData) {
  const staff = await requirePermission("events.edit");
  const id = s(form, "id", 64) || undefined;
  const prefillId = s(form, "prefillId", 64) || undefined;
  const back = id ? { edit: id, prefill: prefillId } : { new: "1", prefill: prefillId };

  const raw: Record<string, string | undefined> = {};
  for (const key of EVENT_FIELDS) {
    const v = form.get(key);
    raw[key] = typeof v === "string" ? v : undefined;
  }
  const checked = validateEventInput(raw);
  if (!checked.ok) {
    redirect(withParams("/studio/events", { ...back, notice: "Please add a title, a type, a short summary and a start time.", tone: "danger" }));
  }
  const data = checked.data;
  const title = data.title;

  let eventId: string;
  let newlyPublished = data.published;
  if (id) {
    const before = await prisma.event.findUnique({ where: { id } });
    newlyPublished = data.published && !before?.published;
    // The slug stays as it was, so links already shared keep working.
    eventId = (await prisma.event.update({ where: { id }, data, select: { id: true } })).id;
    await audit(staff, { action: "event.edit", targetType: "event", targetId: eventId, summary: `Updated the event "${title}".`, before, after: data });
  } else {
    eventId = (await prisma.event.create({ data: { ...data, slug: await uniqueEventSlug(title) }, select: { id: true } })).id;
    await audit(staff, { action: "event.create", targetType: "event", targetId: eventId, summary: `Created the event "${title}".`, after: data });
  }

  // The event was drafted from a description: that prefill has now done its job.
  if (prefillId) {
    await prisma.draft
      .updateMany({
        where: { id: prefillId, kind: "event_prefill", status: "draft" },
        data: { status: "approved", reviewedAt: new Date() },
      })
      .catch(() => null);
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
