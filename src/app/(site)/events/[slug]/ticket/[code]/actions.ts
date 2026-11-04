"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { attendeeName, canEditDetails, note, ticketPath } from "@/lib/attendees";

/**
 * An attendee changes their own name, dietary or access details from their
 * ticket page. The ticket code is the key, so there is no sign-in; changes
 * close at the event's cut-off.
 */
export async function updateAttendeeDetailsAction(form: FormData) {
  const code = String(form.get("code") ?? "").toUpperCase().slice(0, 32);
  const a = await prisma.eventAttendee.findUnique({
    where: { code },
    select: { id: true, cancelledAt: true, event: { select: { slug: true, startsAt: true, detailsCloseAt: true } } },
  });
  if (!a) redirect("/events");
  const back = (params: Record<string, string>) => redirect(`${ticketPath(a.event.slug, code)}?${new URLSearchParams(params)}`);
  if (a.cancelledAt) back({ notice: "This ticket has been cancelled, so it can no longer be changed." });
  if (!canEditDetails(a.event)) back({ notice: "Details can no longer be changed online. Please reply to your ticket email and we will help." });

  const name = attendeeName(form.get("name"));
  if (!name) back({ notice: "Please give the name for the ticket." });
  await prisma.eventAttendee.updateMany({
    where: { id: a.id, cancelledAt: null },
    data: { name, dietary: note(form.get("dietary")), accessNeeds: note(form.get("accessNeeds")) },
  });
  back({ saved: "1" });
}
