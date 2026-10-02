"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assignStaffRole, requirePermission, revokeStaffRole, roleSentence } from "@/lib/staff";
import { isStaffRole, STAFF_ROLE_DESCRIPTION, STAFF_ROLE_LABEL } from "@/config/staff";
import { deliver } from "@/lib/mail/send";
import { studioAccessEmail } from "@/lib/mail/templates/directory";

function s(form: FormData, key: string, max = 200) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function back(params: Record<string, string>) {
  return `/studio/team?${new URLSearchParams(params)}`;
}

export async function assignStaffRoleAction(form: FormData) {
  const staff = await requirePermission("staff.manage");
  const id = s(form, "id", 64);
  const role = s(form, "role", 20);
  if (!isStaffRole(role)) redirect(back({ notice: "Please choose a role.", tone: "danger" }));

  let result: Awaited<ReturnType<typeof assignStaffRole>>;
  try {
    result = await assignStaffRole(staff, id, role);
  } catch (error) {
    redirect(back({ notice: error instanceof Error ? error.message : "That change couldn't be made.", tone: "danger" }));
  }

  // Newcomers get a short welcome that explains their role.
  if (!result.before && result.target.email) {
    const { subject, content } = studioAccessEmail({
      name: result.target.name,
      roleLabel: STAFF_ROLE_LABEL[role],
      roleDescription: STAFF_ROLE_DESCRIPTION[role],
    });
    await deliver(result.target.email, subject, content, { tag: "studio-access" });
  }
  revalidatePath("/studio", "layout");
  redirect(back({ notice: `${result.target.name ?? result.target.email} ${roleSentence(role)}.` }));
}

export async function revokeStaffRoleAction(form: FormData) {
  const staff = await requirePermission("staff.manage");
  const id = s(form, "id", 64);
  if (s(form, "confirm", 8) !== "yes") redirect(back({ confirmRevoke: id }));

  let name: string;
  try {
    const target = await revokeStaffRole(staff, id);
    name = target.name ?? target.email ?? "They";
  } catch (error) {
    redirect(back({ notice: error instanceof Error ? error.message : "That change couldn't be made.", tone: "danger" }));
  }
  revalidatePath("/studio", "layout");
  redirect(back({ notice: `${name} no longer has access to Studio.` }));
}

/** Find a member by email to add to the team. */
export async function findMemberAction(form: FormData) {
  await requirePermission("staff.manage");
  const email = s(form, "email", 200).toLowerCase();
  if (!email) redirect(back({}));
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (!user) {
    redirect(
      back({
        notice: `There's no account for ${email} yet. Ask them to sign in to Trichollective once, then add them here.`,
        tone: "danger",
      })
    );
  }
  redirect(back({ add: user.id }));
}
