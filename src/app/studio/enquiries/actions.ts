"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/staff";

function s(form: FormData, key: string, max = 200) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function back(form: FormData, notice: string, tone?: "danger"): never {
  const status = s(form, "filter", 20);
  const params = new URLSearchParams({ notice });
  if (["new", "forwarded", "closed"].includes(status)) params.set("status", status);
  if (tone) params.set("tone", tone);
  redirect(`/studio/enquiries?${params}`);
}

/** Close an enquiry, or reopen it, with an optional note for the team. */
export async function setEnquiryStatusAction(form: FormData) {
  const staff = await requirePermission("crm.edit");
  const id = s(form, "id", 64);
  const to = s(form, "to", 20) === "closed" ? "closed" : "new";
  const teamNote = s(form, "teamNote", 2000) || null;
  const enquiry = await prisma.enquiry.findUnique({
    where: { id },
    select: { id: true, name: true, status: true, teamNote: true, listing: { select: { name: true } } },
  });
  if (!enquiry) back(form, "That enquiry no longer exists.", "danger");

  await prisma.enquiry.update({ where: { id }, data: { status: to, teamNote: teamNote ?? enquiry.teamNote } });
  const summary =
    to === "closed"
      ? `Closed the enquiry from ${enquiry.name} to ${enquiry.listing.name}.`
      : `Reopened the enquiry from ${enquiry.name} to ${enquiry.listing.name}.`;
  await audit(staff, {
    action: to === "closed" ? "crm.enquiry.close" : "crm.enquiry.reopen",
    targetType: "enquiry",
    targetId: id,
    summary,
    before: { status: enquiry.status, teamNote: enquiry.teamNote },
    after: { status: to, teamNote: teamNote ?? enquiry.teamNote },
  });
  revalidatePath("/studio/enquiries");
  back(form, summary);
}
