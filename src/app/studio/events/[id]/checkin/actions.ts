"use server";

import { requirePermission } from "@/lib/staff";
import { checkIn, undoCheckIn, type CheckInResult } from "@/lib/checkin";
import { codeFromScan } from "@/lib/ticket-code";

/** Check in by a scanned or typed code, or by tapping a name in the list. Called from the check-in page. */
export async function checkInAction(input: { eventId: string; scan?: string; id?: string }): Promise<CheckInResult> {
  const staff = await requirePermission("events.checkin");
  const code = input.scan ? codeFromScan(input.scan) : null;
  if (input.scan && !code) return { status: "not_found" };
  return checkIn(String(input.eventId).slice(0, 64), code ? { code } : { id: String(input.id ?? "").slice(0, 64) }, staff.userId);
}

export async function undoCheckInAction(input: { eventId: string; id: string }): Promise<{ ok: boolean }> {
  await requirePermission("events.checkin");
  return { ok: await undoCheckIn(String(input.eventId).slice(0, 64), String(input.id).slice(0, 64)) };
}
