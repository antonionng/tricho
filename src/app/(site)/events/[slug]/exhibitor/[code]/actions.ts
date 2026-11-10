"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { attendeeName, canEditDetails, note } from "@/lib/attendees";
import { bookletBlurb, exhibitorPath, normaliseWebsite } from "@/lib/packages";
import { sendAttendeeTicket } from "@/lib/tickets";

/**
 * What an exhibitor does from their own page: name the places in their
 * package, and send their logo and booklet text. The code in the address is
 * the only key, as with e-tickets, so there is no sign-in.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function exhibitorFor(form: FormData) {
  const code = String(form.get("code") ?? "").toUpperCase().slice(0, 32);
  const ex = code
    ? await prisma.eventExhibitor.findUnique({
        where: { manageCode: code },
        select: {
          id: true,
          companyName: true,
          manageCode: true,
          logoFileId: true,
          ticket: { select: { id: true, status: true, eventId: true, name: true, email: true, quantity: true, ticketType: { select: { name: true } } } },
          event: true,
        },
      })
    : null;
  if (!ex) redirect("/events");
  const back = (params: Record<string, string>, anchor = ""): never =>
    redirect(`${exhibitorPath(ex.event.slug, ex.manageCode)}?${new URLSearchParams(params)}${anchor}`);
  return { ex, back };
}

/** Name a place in the package. Its e-ticket is sent straight away; renaming a named place is done from that person's own ticket page. */
export async function nameExhibitorPlaceAction(form: FormData) {
  const { ex, back } = await exhibitorFor(form);
  if (ex.ticket.status !== "paid") back({ notice: "Places can be named once your payment has been confirmed." }, "#places");
  if (!canEditDetails(ex.event)) back({ notice: "Places can no longer be named online. Please reply to your confirmation email and we will help." }, "#places");

  const attendeeId = String(form.get("attendeeId") ?? "").slice(0, 64);
  const name = attendeeName(form.get("name"));
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  if (!name) back({ notice: "Please give the person's full name." }, "#places");
  // Fixed wording: names and emails never go in the address.
  if (!EMAIL.test(email)) back({ notice: "Please check the email address, so their e-ticket reaches them." }, "#places");

  const claimed = await prisma.eventAttendee.updateMany({
    where: { id: attendeeId, ticketId: ex.ticket.id, awaitingName: true, cancelledAt: null },
    data: { name, email, dietary: note(form.get("dietary")), accessNeeds: note(form.get("accessNeeds")), awaitingName: false },
  });
  if (!claimed.count) back({ notice: "That place has already been named." }, "#places");

  const a = await prisma.eventAttendee.findUnique({ where: { id: attendeeId } });
  if (a) await sendAttendeeTicket(a, { ...ex.ticket, event: ex.event });
  back({ named: "1" }, "#places");
}

/** The logo and booklet text, and the website shown beside them. Open until the event starts. */
export async function saveExhibitorProfileAction(form: FormData) {
  const { ex, back } = await exhibitorFor(form);
  if (ex.ticket.status !== "paid") back({ notice: "You can send your logo and booklet text once your payment has been confirmed." }, "#booklet");
  if (ex.event.startsAt <= new Date()) back({ notice: "The event has started, so the booklet can no longer be changed." }, "#booklet");

  const website = normaliseWebsite(form.get("website"));
  if (website === false) back({ notice: "Please check the website address, for example www.yourbrand.co.uk." }, "#booklet");
  const data: { bookletBlurb: string | null; website: string | null; logoFileId?: string; logoUrl?: string } = {
    bookletBlurb: bookletBlurb(form.get("bookletBlurb")),
    website: website || null,
  };

  const file = form.get("logo");
  if (file && typeof file !== "string" && file.size > 0) {
    const { storeUpload, deleteStoredFile } = await import("@/lib/storage");
    const stored = await storeUpload({ kind: "logo", file, isPublic: true });
    if (stored && !stored.ok) back({ notice: stored.message }, "#booklet");
    if (stored?.ok) {
      data.logoFileId = stored.file.id;
      data.logoUrl = stored.file.url;
      if (ex.logoFileId) await deleteStoredFile(ex.logoFileId).catch(() => null);
    }
  }
  await prisma.eventExhibitor.update({ where: { id: ex.id }, data });
  back({ saved: "1" }, "#booklet");
}
