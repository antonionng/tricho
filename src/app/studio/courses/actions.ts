"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/staff";
import { studioAction } from "../_lib/guard";

/**
 * Withdraws a certificate (it then shows as withdrawn on its public page and
 * leaves the holder's profile), or restores one.
 */
export async function setCertificateWithdrawnAction(form: FormData) {
  const staff = await studioAction("members.edit");
  const id = String(form.get("id") ?? "").slice(0, 32);
  const withdraw = form.get("withdraw") === "1";
  const note = String(form.get("note") ?? "").trim().slice(0, 300) || null;
  const certificate = await prisma.certificate.findUnique({ where: { id } });
  if (!certificate) redirect("/studio/courses");
  await prisma.certificate.update({
    where: { id },
    data: withdraw ? { withdrawnAt: new Date(), withdrawnNote: note } : { withdrawnAt: null, withdrawnNote: null },
  });
  await audit(staff, {
    action: withdraw ? "certificate.withdraw" : "certificate.restore",
    targetType: "certificate",
    targetId: id,
    summary: `${withdraw ? "Withdrew" : "Restored"} ${certificate.holderName}'s certificate for "${certificate.courseTitle}"${withdraw && note ? `: ${note}` : ""}.`,
  });
  revalidatePath("/studio/courses");
  revalidatePath(`/certificates/${id}`);
  revalidatePath(`/members/people/${certificate.userId}`);
  revalidatePath("/directory", "layout");
  redirect(`/studio/courses?notice=${encodeURIComponent(withdraw ? `Certificate ${id} is withdrawn.` : `Certificate ${id} is restored.`)}`);
}
