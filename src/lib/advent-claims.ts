import "server-only";
import { prisma } from "@/lib/prisma";
import { adventDoor, isDoorOpen } from "@/content/gazette/advent";
import { alertOwners, deliverOnce } from "@/lib/mail/send";
import { adventClaimConfirmEmail, adventClaimOwnerAlert } from "@/lib/mail/templates/advent";

export type AdventClaim = {
  userId?: string | null;
  name: string;
  email: string;
  day: number;
  note?: string | null;
};

export type AdventClaimResult = { ok: true } | { ok: false; error: string };

/**
 * A member claims the gift behind an advent door (or enters the door 12 draw).
 * The owners are alerted so the team can fulfil it, and the member gets a
 * confirmation. A double click never sends the confirmation twice.
 * Nothing is stored beyond the email log.
 */
export async function submitAdventClaim(c: AdventClaim): Promise<AdventClaimResult> {
  const name = c.name.trim();
  const email = c.email.trim().toLowerCase();
  const door = adventDoor(c.day);
  if (!door || door.kind !== "claim") return { ok: false, error: "That door has nothing to claim." };
  if (!isDoorOpen(c.day)) return { ok: false, error: "That door hasn't opened yet." };
  if (!name || !email.includes("@")) return { ok: false, error: "Please give your name and email." };

  const note = [c.note?.trim(), c.userId ? `Account ${c.userId}` : ""].filter(Boolean).join("\n") || null;
  const ref = `advent-claim:${c.day}:${email}`;
  const confirm = adventClaimConfirmEmail({ name, day: c.day });
  const sent = await deliverOnce(ref, email, confirm.subject, confirm.content, { tag: "advent-claim" });
  // Not sent because the ref was already claimed: a double click or a second visit, so it is one claim to the owners too.
  // Not sent because the email failed: the ref is released, and the owners still need to hear about it.
  const duplicate = !sent && (await prisma.emailLog.findUnique({ where: { ref }, select: { id: true } }));
  if (!duplicate) await alertOwners(adventClaimOwnerAlert({ name, email, day: c.day, note }));
  return { ok: true };
}
