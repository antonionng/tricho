"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/staff";
import { draftEvent, writeEventBody } from "@/agents/events";
import { EVENT_KINDS } from "@/lib/event-input";
import type { EventKind } from "@prisma/client";

function s(form: FormData, key: string, max = 20000) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function eventsUrl(params: Record<string, string | undefined>) {
  const url = new URL("/studio/events", "http://studio.local");
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  return `${url.pathname}${url.search}`;
}

/** Describe an event in a sentence; the AI fills in the form. The details travel in a draft, never in the URL. */
export async function draftEventAction(form: FormData) {
  const staff = await requirePermission("events.edit");
  const sentence = s(form, "sentence", 2000);
  if (!sentence) {
    redirect(eventsUrl({ new: "1", notice: "Please describe the event in a sentence first.", tone: "danger" }));
  }

  const fields = await draftEvent(sentence);
  if (!fields) {
    redirect(
      eventsUrl({
        new: "1",
        notice: "The writing assistant is not available at the moment, so please fill in the form by hand.",
        tone: "danger",
      })
    );
  }

  const draft = await prisma.draft.create({
    data: {
      agent: "studio",
      kind: "event_prefill",
      title: fields.title || "New event",
      body: sentence,
      status: "draft",
      payload: fields,
    },
    select: { id: true },
  });
  await audit(staff, {
    action: "event.ai_draft",
    targetType: "draft",
    targetId: draft.id,
    summary: `Drafted the event form for "${fields.title}" from a description.`,
    after: fields,
  });
  redirect(eventsUrl({ new: "1", prefill: draft.id }));
}

/**
 * Write (or improve) the full description from the title and summary. Everything
 * else in the form is kept by storing it in a prefill draft and reloading the form from it.
 */
export async function writeEventBodyAction(form: FormData) {
  const staff = await requirePermission("events.edit");
  const id = s(form, "id", 64) || undefined;
  const back = id ? { edit: id } : { new: "1" };
  const kindRaw = s(form, "kind", 32);
  const values = {
    title: s(form, "title", 160),
    kind: EVENT_KINDS.includes(kindRaw as EventKind) ? kindRaw : "gathering",
    summary: s(form, "summary", 400),
    body: s(form, "body"),
    startsAt: s(form, "startsAt", 32),
    endsAt: s(form, "endsAt", 32),
    online: form.get("online") === "on",
    city: s(form, "city", 80),
    venue: s(form, "venue", 160),
    priceGBP: s(form, "priceGBP", 8),
    memberPriceGBP: s(form, "memberPriceGBP", 8),
    capacity: s(form, "capacity", 8),
    ticketUrl: s(form, "ticketUrl", 500),
    published: form.get("published") === "on",
  };

  if (!values.title || !values.summary) {
    redirect(eventsUrl({ ...back, notice: "Please add a title and a short summary first, and the description will be written from them.", tone: "danger" }));
  }

  const body = await writeEventBody({ title: values.title, summary: values.summary, body: values.body, kind: values.kind, city: values.city });
  const unavailable = !body;
  const previousPrefill = s(form, "prefillId", 64);

  const draft = await prisma.draft.create({
    data: {
      agent: "studio",
      kind: "event_prefill",
      title: values.title,
      body: values.summary,
      status: "draft",
      payload: { ...values, body: body ?? values.body },
    },
    select: { id: true },
  });
  if (previousPrefill) {
    // The older prefill has been superseded by this one.
    await prisma.draft
      .updateMany({ where: { id: previousPrefill, kind: "event_prefill", status: "draft" }, data: { status: "rejected", reviewedAt: new Date() } })
      .catch(() => null);
  }
  if (!unavailable) {
    await audit(staff, {
      action: "event.ai_body",
      targetType: id ? "event" : "draft",
      targetId: id ?? draft.id,
      summary: `Drafted the description for "${values.title}".`,
    });
  }
  redirect(
    eventsUrl({
      ...back,
      prefill: draft.id,
      body: unavailable ? undefined : "1",
      notice: unavailable ? "The writing assistant is not available at the moment, so please write the description by hand." : undefined,
      tone: unavailable ? "danger" : undefined,
    })
  );
}

/**
 * Email every active member that an event is about to start, with the joining link. Each member
 * gets it once per event however many times this is pressed, and the send is paced for the
 * email provider. The member list includes anyone Stripe shows as paying.
 */
export async function emailMembersStartingAction(form: FormData) {
  const staff = await requirePermission("events.edit");
  const id = s(form, "eventId", 100);
  const back = (notice: string, tone?: string) =>
    redirect(`/studio/events/${id}/attendees?${new URLSearchParams({ notice, ...(tone ? { tone } : {}) })}`);
  if (form.get("confirm") !== "on") back("Tick the box to confirm before sending to every member.", "danger");

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || !event.published) back("Only a published event can be sent to members.", "danger");
  if (event!.online && !event!.joinUrl) back("Add the Google Meet link to the event first, so the email can carry it.", "danger");

  const { activeMemberRecipients } = await import("@/lib/member-recipients");
  const { deliverOnce } = await import("@/lib/mail/send");
  const { eventStartingEmail } = await import("@/lib/mail/templates/members");
  const recipients = await activeMemberRecipients();
  const paced = !!process.env.AUTH_RESEND_KEY;
  let sent = 0;
  for (const r of recipients) {
    const { subject, content } = eventStartingEmail({ name: r.name, event: event! });
    if (await deliverOnce(`event-starting:${event!.id}:${r.email}`, r.email, subject, content, { tag: "event-starting" })) sent++;
    if (paced) await new Promise((done) => setTimeout(done, 250));
  }
  await audit(staff, {
    action: "event.email_members_starting",
    targetType: "event",
    targetId: event!.id,
    summary: `Emailed ${sent} of ${recipients.length} members that "${event!.title}" is starting.`,
  });
  const skipped = recipients.length - sent;
  back(
    `Sent to ${sent} ${sent === 1 ? "member" : "members"}.${skipped > 0 ? ` ${skipped} had already received it or could not be sent.` : ""}`
  );
}
