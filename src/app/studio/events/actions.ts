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
    venueAddress: s(form, "venueAddress", 300),
    timezone: s(form, "timezone", 64),
    detailsCloseAt: s(form, "detailsCloseAt", 32),
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

/**
 * Tell every user about a published masterclass, in the app, and draft the announcement email
 * if it hasn't been drafted yet. Safe to press again: nobody is notified twice about the same
 * masterclass, so a second press only reaches people who joined or were missed since.
 */
export async function notifyMasterclassAction(form: FormData) {
  const staff = await requirePermission("events.edit");
  const id = s(form, "eventId", 100);
  const back = (notice: string, tone?: string) => redirect(eventsUrl({ notice, tone }));

  const event = await prisma.event.findUnique({ where: { id }, select: { id: true, title: true, kind: true, published: true, startsAt: true } });
  if (!event || event.kind !== "masterclass") back("Only a masterclass can be announced to everyone this way.", "danger");
  if (!event!.published || event!.startsAt <= new Date()) back("Publish the masterclass, with a date still to come, before notifying everyone.", "danger");

  const { announceMasterclass } = await import("@/agents/announce");
  const result = await announceMasterclass(event!.id);
  if (!result) back("Everyone couldn't be notified just now. Please try again in a moment.", "danger");
  await audit(staff, {
    action: "event.announce",
    targetType: "event",
    targetId: event!.id,
    summary: `Told ${result!.notified} more ${result!.notified === 1 ? "person" : "people"} in the app about the masterclass "${event!.title}"${result!.drafted ? " and drafted the announcement email" : ""}.`,
  });
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/studio", "layout");
  back(
    [
      result!.notified > 0
        ? `${result!.notified} ${result!.notified === 1 ? "person has" : "people have"} been told in the app.`
        : "Everyone has already been told in the app.",
      result!.drafted ? "The announcement email is waiting for your approval in the inbox." : "",
    ]
      .filter(Boolean)
      .join(" ")
  );
}

const TICKET_TYPE_FIELDS = [
  "name",
  "description",
  "price",
  "memberPrice",
  "membersOnly",
  "capacity",
  "salesStart",
  "salesEnd",
  "maxPerOrder",
  "sortOrder",
  "active",
  "kind",
  "placesIncluded",
  "includesStand",
  "includesStageSlot",
] as const;

function ticketTypesBack(eventId: string, notice: string, tone?: string, section: "tickets" | "packages" = "tickets"): never {
  // tt=1 shows the notice beside the ticket types, tt=2 beside the packages, where the page lands.
  redirect(`${eventsUrl({ edit: eventId, notice, tone, tt: section === "packages" ? "2" : "1" })}#${section === "packages" ? "packages" : "ticket-types"}`);
}

const kindWord = (kind: string) => (kind === "package" ? "package" : kind === "addon" ? "extra places" : "tickets");

/** Add or change a ticket type. Prices and dates are checked by validateTicketType. */
export async function saveTicketTypeAction(form: FormData) {
  const staff = await requirePermission("events.edit");
  const eventId = s(form, "eventId", 64);
  const typeId = s(form, "typeId", 64) || null;
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, title: true, slug: true, timezone: true } });
  if (!event) redirect(eventsUrl({ notice: "That event could not be found.", tone: "danger" }));

  const raw: Record<string, string | undefined> = {};
  for (const key of TICKET_TYPE_FIELDS) {
    const v = form.get(key);
    raw[key] = typeof v === "string" ? v : undefined;
  }
  const before = typeId ? await prisma.eventTicketType.findFirst({ where: { id: typeId, eventId: event.id } }) : null;
  if (typeId && !before) ticketTypesBack(event.id, "That ticket type could not be found.", "danger");
  // A type keeps the kind it was created with, so sold packages never turn into tickets.
  if (before) raw.kind = before.kind;
  const section = raw.kind === "package" || raw.kind === "addon" ? "packages" : "tickets";
  const packageIds = (await prisma.eventTicketType.findMany({ where: { eventId: event.id, kind: "package" }, select: { id: true } })).map((t) => t.id);
  const { validateTicketType } = await import("@/lib/ticket-types");
  const checked = validateTicketType(raw, event.timezone, {
    addonFor: form.getAll("addonFor").filter((v): v is string => typeof v === "string"),
    packageIds,
  });
  if (!checked.ok) ticketTypesBack(event.id, checked.error, "danger", section);
  const data = checked.data;

  if (typeId) {
    await prisma.eventTicketType.update({ where: { id: typeId }, data });
    await audit(staff, {
      action: "event.ticket_type_edit",
      targetType: "event",
      targetId: event.id,
      summary: `Updated the ${data.name} ${kindWord(data.kind)} for "${event.title}".`,
      before,
      after: data,
    });
  } else {
    await prisma.eventTicketType.create({ data: { ...data, eventId: event.id } });
    await audit(staff, {
      action: "event.ticket_type_create",
      targetType: "event",
      targetId: event.id,
      summary: `Added ${data.name} ${kindWord(data.kind)} to "${event.title}".`,
      after: data,
    });
  }
  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/events/${event.slug}`);
  ticketTypesBack(event.id, `${data.name} ${kindWord(data.kind)} saved.`, undefined, section);
}

/**
 * Set an in-person event up with Karley's five packages and extra places, as
 * for TRICHOLLECTIVE UK, with 20 stand spaces and 8 stage slots unless already
 * set. Safe to press twice. Attendee tickets are left alone.
 */
export async function addDefaultPackagesAction(form: FormData) {
  const staff = await requirePermission("events.edit");
  const eventId = s(form, "eventId", 64);
  const { setupEventPackages } = await import("@/lib/package-setup");
  const result = await setupEventPackages(prisma, eventId, { apply: true });
  if ("error" in result) {
    if (!(await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } }))) redirect(eventsUrl({ notice: result.error, tone: "danger" }));
    ticketTypesBack(eventId, result.error, "danger", "packages");
  }
  const r = result as Exclude<typeof result, { error: string }>;
  if (r.changes.length) {
    await audit(staff, {
      action: "event.packages_default",
      targetType: "event",
      targetId: eventId,
      summary: `Set up the standard exhibitor packages on "${r.event.title}".`,
      after: { changes: r.changes },
    });
  }
  const { revalidatePath } = await import("next/cache");
  const slug = (await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } }))?.slug;
  if (slug) revalidatePath(`/events/${slug}`);
  ticketTypesBack(
    eventId,
    r.changes.length
      ? `${r.changes.join(" ")} Please check the stock and sales dates now, because packages are on sale as soon as the event sells tickets.`
      : "This event already has the standard packages.",
    undefined,
    "packages"
  );
}

/** Remove a ticket type nobody has bought. Types with tickets are switched off instead, so the records stay whole. */
export async function deleteTicketTypeAction(form: FormData) {
  const staff = await requirePermission("events.edit");
  const eventId = s(form, "eventId", 64);
  const typeId = s(form, "typeId", 64);
  const type = await prisma.eventTicketType.findFirst({
    where: { id: typeId, eventId },
    select: { id: true, name: true, kind: true, event: { select: { title: true, slug: true } } },
  });
  if (!type) ticketTypesBack(eventId, "That ticket type could not be found.", "danger");
  const section = type.kind === "attendee" ? "tickets" : "packages";
  const sold = await prisma.eventTicket.count({ where: { ticketTypeId: type.id, status: { in: ["paid", "refunded", "pending"] } } });
  if (sold > 0) {
    ticketTypesBack(eventId, `${type.name} has already been bought, so untick On sale to stop selling it instead of removing it.`, "danger", section);
  }
  await prisma.eventTicketType.delete({ where: { id: type.id } });
  await audit(staff, {
    action: "event.ticket_type_delete",
    targetType: "event",
    targetId: eventId,
    summary: `Removed the ${type.name} tickets from "${type.event.title}".`,
  });
  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/events/${type.event.slug}`);
  ticketTypesBack(eventId, `${type.name} removed.`, undefined, section);
}

/**
 * Refund one named attendee's place through Stripe and cancel it. Owners only,
 * since it moves money. The amount is that place's share of what the order cost.
 */
export async function refundAttendeeAction(form: FormData) {
  const staff = await requirePermission("events.refund");
  const eventId = s(form, "eventId", 64);
  const attendeeId = s(form, "attendeeId", 64);
  const back = (notice: string, tone?: string): never =>
    redirect(`/studio/events/${eventId}/attendees?${new URLSearchParams({ notice, ...(tone ? { tone } : {}) })}`);
  if (form.get("confirm") !== "on") back("Tick the box to confirm the refund first.", "danger");

  const attendee = await prisma.eventAttendee.findFirst({ where: { id: attendeeId, eventId }, select: { id: true, event: { select: { title: true } } } });
  if (!attendee) back("That attendee could not be found.", "danger");

  const { refundAttendee } = await import("@/lib/tickets");
  const result = await refundAttendee(attendee!.id);
  if (!result.ok) back(result.error, "danger");
  const r = result as Extract<typeof result, { ok: true }>;
  const pounds = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(r.amount / 100);
  await audit(staff, {
    action: "event.attendee_refund",
    targetType: "event",
    targetId: eventId,
    summary: `Refunded ${pounds} for ${r.name}'s place at "${attendee!.event.title}" and cancelled it.`,
    after: { attendeeId, amount: r.amount, orderClosed: r.orderClosed },
  });
  back(`${r.name}'s place is cancelled and ${pounds} is on its way back to the card.${r.orderClosed ? " That was the last place on the order." : ""}`);
}
