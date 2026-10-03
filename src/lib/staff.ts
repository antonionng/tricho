import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ownerEmails } from "@/lib/mail/send";
import { devMembershipUnlock } from "@/lib/subscription";
import { isPreviewDemo } from "@/lib/env";
import {
  canChangeOwner,
  permissionsFor,
  type Permission,
  type StaffRoleId,
} from "@/config/staff";

export type Staff = {
  userId: string;
  email: string;
  name: string | null;
  role: StaffRoleId;
  perms: Set<Permission>;
};

export function isEnvOwner(email: string | null | undefined) {
  return !!email && ownerEmails().includes(email.toLowerCase());
}

/**
 * The signed-in team member, read fresh from the database on every request.
 * Owners named in OWNER_EMAILS are always owners, so a mistake in Studio can
 * never lock the team out.
 */
export const getStaff = cache(async (): Promise<Staff | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, staffRole: true, accessStatus: true },
  });
  if (!user?.email) return null;
  if (user.accessStatus === "banned" || user.accessStatus === "suspended") return null;

  let role = (user.staffRole ?? null) as StaffRoleId | null;

  if (isEnvOwner(user.email) && role !== "owner") {
    const before = role;
    role = "owner";
    await prisma.user.update({ where: { id: user.id }, data: { staffRole: "owner" } }).catch(() => null);
    await writeAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "staff.bootstrap",
      targetType: "user",
      targetId: user.id,
      summary: `${user.email} became an owner because they are listed in the site settings.`,
      before: { staffRole: before },
      after: { staffRole: "owner" },
    });
  }

  // Local development: the dev login can reach everything. Preview demos can look but not change anything.
  if (!role && devMembershipUnlock()) {
    role = isPreviewDemo() ? "support" : "owner";
  }

  if (!role) return null;
  return { userId: user.id, email: user.email, name: user.name, role, perms: permissionsFor(role) };
});

/** For Studio pages. Signed out: off to log in. On the team but without this permission: null. */
export async function requirePermissionPage(perm: Permission, next = "/studio") {
  const staff = await getStaff();
  if (staff?.perms.has(perm)) return staff;
  if (!staff) {
    const session = await auth();
    if (!session?.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return null;
}

/** For Studio server actions and route handlers. Throws if the role doesn't include this. */
export async function requirePermission(perm: Permission) {
  const staff = await getStaff();
  if (!staff) throw new Error("Studio is for the Trichollective team.");
  if (!staff.perms.has(perm)) throw new Error("Your role does not include this action.");
  return staff;
}

export async function requireOwner() {
  const staff = await getStaff();
  if (staff?.role !== "owner") throw new Error("Only owners can do this.");
  return staff;
}

export type AuditEntry = {
  action: string;
  targetType: string;
  targetId?: string | null;
  summary?: string;
  before?: unknown;
  after?: unknown;
};

function json(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function writeAudit(entry: AuditEntry & { actorId: string | null; actorEmail: string }) {
  await prisma.auditLog
    .create({
      data: {
        actorId: entry.actorId,
        actorEmail: entry.actorEmail,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
        summary: entry.summary ?? null,
        before: json(entry.before),
        after: json(entry.after),
      },
    })
    .catch((error) => console.error("[audit] couldn't record", entry.action, error));
}

/**
 * Record a change made in Studio. Call it before redirect(), which throws.
 * Never fails the action it records.
 */
export async function audit(staff: Pick<Staff, "userId" | "email">, entry: AuditEntry) {
  await writeAudit({ ...entry, actorId: staff.userId, actorEmail: staff.email });
}

export function roleSentence(role: StaffRoleId) {
  switch (role) {
    case "owner":
      return "is now an owner";
    case "editor":
      return "is now an editor";
    case "events":
      return "now looks after events";
    case "moderator":
      return "is now a moderator";
    case "support":
      return "now has support access";
  }
}

function roleForPlan(plan: string | null) {
  return plan === "business" ? "business" : plan === "professional" ? "trichologist" : "individual";
}

/* ------------------------------------------------------------------ */
/* Team                                                                 */
/* ------------------------------------------------------------------ */

async function ownerCount(tx: Prisma.TransactionClient) {
  const envOwners = ownerEmails();
  return tx.user.count({
    where: { OR: [{ staffRole: "owner" }, { email: { in: envOwners, mode: "insensitive" } }] },
  });
}

/** Give someone a staff role, or change it. Owners only. */
export async function assignStaffRole(actor: Staff, userId: string, role: StaffRoleId) {
  return prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { id: userId }, select: { email: true, name: true, staffRole: true } });
    if (!target) throw new Error("That account no longer exists.");
    const wasOwner = target.staffRole === "owner" || isEnvOwner(target.email);
    if (wasOwner && role !== "owner") {
      const check = canChangeOwner({ ownersAfter: (await ownerCount(tx)) - 1, isEnvOwner: isEnvOwner(target.email) });
      if (!check.ok) throw new Error(check.reason);
    }
    await tx.user.update({ where: { id: userId }, data: { staffRole: role } });
    return { target, before: target.staffRole as StaffRoleId | null };
  }).then(async ({ target, before }) => {
    await audit(actor, {
      action: before ? "staff.change" : "staff.assign",
      targetType: "user",
      targetId: userId,
      summary: `${target.name ?? target.email} ${roleSentence(role)}.`,
      before: { staffRole: before },
      after: { staffRole: role },
    });
    return { target, before };
  });
}

/** Take someone off the team. Owners only. */
export async function revokeStaffRole(actor: Staff, userId: string) {
  const { target, before } = await prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { id: userId }, select: { email: true, name: true, staffRole: true } });
    if (!target) throw new Error("That account no longer exists.");
    if (target.staffRole === "owner" || isEnvOwner(target.email)) {
      const check = canChangeOwner({ ownersAfter: (await ownerCount(tx)) - 1, isEnvOwner: isEnvOwner(target.email) });
      if (!check.ok) throw new Error(check.reason);
    }
    await tx.user.update({ where: { id: userId }, data: { staffRole: null } });
    // The old admin flag goes too, so they lose access everywhere. Their role follows what they pay for.
    const legacy = await tx.user.findFirst({ where: { id: userId, role: "admin" }, select: { plan: true } });
    if (legacy) await tx.user.update({ where: { id: userId }, data: { role: roleForPlan(legacy.plan) } });
    return { target, before: target.staffRole };
  });
  await audit(actor, {
    action: "staff.revoke",
    targetType: "user",
    targetId: userId,
    summary: `${target.name ?? target.email} is no longer on the team.`,
    before: { staffRole: before },
    after: { staffRole: null },
  });
  return target;
}
