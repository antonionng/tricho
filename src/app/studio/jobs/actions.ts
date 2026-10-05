"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/staff";
import { studioAction } from "../_lib/guard";

/** Takes a role off the board, or puts it back. The business can't reopen a role the team has taken down. */
export async function setJobHiddenAction(form: FormData) {
  const staff = await studioAction("partners.manage");
  const id = String(form.get("id") ?? "").slice(0, 64);
  const hide = form.get("hide") === "1";
  const job = await prisma.job.findUnique({ where: { id }, include: { partner: { select: { name: true, slug: true } } } });
  if (!job) redirect("/studio/jobs");
  await prisma.job.update({ where: { id }, data: { hiddenAt: hide ? new Date() : null } });
  await audit(staff, {
    action: hide ? "job.hide" : "job.unhide",
    targetType: "job",
    targetId: id,
    summary: `${hide ? "Took down" : "Restored"} ${job.partner.name}'s role "${job.title}".`,
  });
  revalidatePath("/studio/jobs");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${job.slug}`);
  revalidatePath(`/partners/${job.partner.slug}`);
  redirect(`/studio/jobs?notice=${encodeURIComponent(hide ? `"${job.title}" is taken down.` : `"${job.title}" is back on the board.`)}`);
}
