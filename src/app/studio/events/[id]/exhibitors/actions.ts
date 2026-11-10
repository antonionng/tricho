"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/staff";
import { zonedToDate } from "@/lib/event-input";

function s(form: FormData, key: string, max: number) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

/** Set an exhibitor's stand number, stage slot time and the team's notes. */
export async function saveExhibitorAction(form: FormData) {
  const staff = await requirePermission("events.edit");
  const eventId = s(form, "eventId", 64);
  const exhibitorId = s(form, "exhibitorId", 64);
  const back = (notice: string, tone?: string): never =>
    redirect(`/studio/events/${eventId}/exhibitors?${new URLSearchParams({ notice, ...(tone ? { tone } : {}) })}#ex-${exhibitorId}`);

  const before = await prisma.eventExhibitor.findFirst({
    where: { id: exhibitorId, eventId },
    select: { id: true, companyName: true, standNumber: true, stageSlotAt: true, notes: true, event: { select: { title: true, timezone: true } } },
  });
  if (!before) back("That exhibitor could not be found.", "danger");
  const ex = before!;

  const slotRaw = s(form, "stageSlotAt", 32);
  const stageSlotAt = slotRaw ? zonedToDate(slotRaw, ex.event.timezone) : null;
  if (slotRaw && !stageSlotAt) back("Please give a complete date and time for the stage slot.", "danger");
  const data = {
    standNumber: s(form, "standNumber", 40) || null,
    stageSlotAt,
    notes: s(form, "notes", 4000) || null,
  };
  await prisma.eventExhibitor.update({ where: { id: ex.id }, data });
  await audit(staff, {
    action: "event.exhibitor_edit",
    targetType: "event",
    targetId: eventId,
    summary: `Updated the stand and stage details for ${ex.companyName} at "${ex.event.title}".`,
    before: { standNumber: ex.standNumber, stageSlotAt: ex.stageSlotAt, notes: ex.notes },
    after: data,
  });
  back(`${ex.companyName} saved.`);
}
