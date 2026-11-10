"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/staff";

/**
 * Deletes a consumer account for someone who asked us to, as the hub's own delete does:
 * the profile and saved professionals go with it, and enquiries stay with the professionals,
 * unlinked. Owners only, with the word "delete" typed to confirm.
 */
export async function deleteConsumerAction(form: FormData) {
  const staff = await requirePermission("consumers.delete");
  const id = String(form.get("id") ?? "").slice(0, 64);
  const back = (notice: string, tone?: "danger"): never =>
    redirect(`/studio/consumers/${id}?${new URLSearchParams({ notice, ...(tone ? { tone } : {}) })}`);

  if (String(form.get("confirm") ?? "").trim().toLowerCase() !== "delete") back("Type the word delete to confirm.", "danger");
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, accountType: true, _count: { select: { enquiries: true, savedListings: true } } },
  });
  if (!user || user.accountType !== "consumer") back("That isn't a consumer account, so it can't be deleted here.", "danger");

  await prisma.$transaction([
    prisma.pendingSignup.deleteMany({ where: { email: user!.email ?? "" } }),
    prisma.user.delete({ where: { id } }),
  ]);
  await audit(staff, {
    action: "consumer.delete",
    targetType: "consumer",
    targetId: id,
    summary: `Deleted the consumer account ${user!.email}. ${user!._count.enquiries} enquiries were kept for the professionals, unlinked.`,
    before: { email: user!.email, enquiries: user!._count.enquiries, saved: user!._count.savedListings },
  });
  revalidatePath("/studio/consumers");
  redirect(`/studio/consumers?${new URLSearchParams({ notice: `Deleted the consumer account ${user!.email}.` })}`);
}
