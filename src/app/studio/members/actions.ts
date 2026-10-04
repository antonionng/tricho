"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { audit, getStaff, isEnvOwner, requirePermission } from "@/lib/staff";
import { deliver } from "@/lib/mail/send";
import { accountClosedEmail, accountRestoredEmail, accountSuspendedEmail } from "@/lib/mail/templates/members";
import { untilFromDays } from "@/lib/members-filter";
import { parseTags } from "@/lib/crm";
import { dateOnly } from "@/components/studio/ui";

function s(form: FormData, key: string, max = 200) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function back(id: string, params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString();
  return `/studio/members/${id}${q ? `?${q}` : ""}`;
}

function fail(id: string, notice: string): never {
  redirect(back(id, { notice, tone: "danger" }));
}

const accessSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  staffRole: true,
  accessStatus: true,
  accessReason: true,
  accessUntil: true,
  mutedUntil: true,
  compPlan: true,
  compUntil: true,
} as const;

async function target(id: string) {
  const user = id ? await prisma.user.findUnique({ where: { id }, select: accessSelect }) : null;
  if (!user) redirect(`/studio/members?${new URLSearchParams({ notice: "That account no longer exists.", tone: "danger" })}`);
  return user;
}

const who = (u: { name: string | null; email: string | null }) => u.name ?? u.email ?? "This member";

function refresh(id: string) {
  revalidatePath("/studio/members");
  revalidatePath(`/studio/members/${id}`);
}

const PLANS = ["community", "professional", "business"] as const;
type PlanId = (typeof PLANS)[number];
const PLAN_NAME: Record<PlanId, string> = { community: "Community", professional: "Professional", business: "Business" };

/** Give a plan without Stripe, change it, or take it away. */
export async function setCompPlanAction(form: FormData) {
  const staff = await requirePermission("members.edit");
  const id = s(form, "id", 64);
  const user = await target(id);
  const planRaw = s(form, "plan", 20);
  const untilRaw = s(form, "until", 10);

  const plan = (PLANS as readonly string[]).includes(planRaw) ? (planRaw as PlanId) : null;
  if (!plan && planRaw !== "none") fail(id, "Please choose a plan, or choose no complimentary plan.");

  let until: Date | null = null;
  if (plan && untilRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(untilRaw)) fail(id, "Please give the end date as a full date.");
    until = new Date(`${untilRaw}T23:59:59Z`);
    if (Number.isNaN(until.getTime()) || until <= new Date()) fail(id, "The end date needs to be in the future.");
  }

  await prisma.user.update({ where: { id }, data: { compPlan: plan, compUntil: plan ? until : null } });
  const summary = plan
    ? `${who(user)} was given complimentary ${PLAN_NAME[plan]}${until ? ` until ${dateOnly(until)}` : " with no end date"}.`
    : `${who(user)} no longer has a complimentary plan.`;
  await audit(staff, {
    action: "member.comp",
    targetType: "user",
    targetId: id,
    summary,
    before: { compPlan: user.compPlan, compUntil: user.compUntil },
    after: { compPlan: plan, compUntil: plan ? until : null },
  });
  refresh(id);
  redirect(back(id, { notice: summary }));
}

const ROLES = ["individual", "trichologist", "business"] as const;
const ROLE_NAME: Record<(typeof ROLES)[number], string> = {
  individual: "an individual member",
  trichologist: "a practitioner",
  business: "a business",
};

/** Change what kind of member someone is. The old admin role is managed on the Team page instead. */
export async function setMemberRoleAction(form: FormData) {
  const staff = await requirePermission("members.edit");
  const id = s(form, "id", 64);
  const user = await target(id);
  const role = s(form, "role", 20) as (typeof ROLES)[number];
  if (!ROLES.includes(role)) fail(id, "Please choose individual, practitioner or business.");
  if (user.role === "admin") fail(id, "This account has the old admin role. Change their access on the Team page instead.");
  if (user.role === role) redirect(back(id));

  await prisma.user.update({ where: { id }, data: { role } });
  const summary = `${who(user)} is now ${ROLE_NAME[role]}.`;
  await audit(staff, {
    action: "member.role",
    targetType: "user",
    targetId: id,
    summary,
    before: { role: user.role },
    after: { role },
  });
  refresh(id);
  redirect(back(id, { notice: summary }));
}

/** People on the team, and owners named in the site settings, are never suspended or banned from here. */
function protectedMessage(user: { staffRole: string | null; email: string | null }, verb: string) {
  if (user.staffRole || isEnvOwner(user.email)) {
    return `${verb} someone on the team isn't possible here. Remove them from the team on the Team page first.`;
  }
  return null;
}

export async function suspendMemberAction(form: FormData) {
  const staff = await requirePermission("members.suspend");
  const id = s(form, "id", 64);
  const user = await target(id);
  if (id === staff.userId) fail(id, "You can't suspend your own account.");
  const blocked = protectedMessage(user, "Suspending");
  if (blocked) fail(id, blocked);
  if (user.accessStatus === "banned") fail(id, "This account is already closed. Restore it first if you would like to suspend it instead.");

  const reason = s(form, "reason", 500) || null;
  const days = Number(s(form, "days", 4));
  if (![0, 7, 30, 90].includes(days)) fail(id, "Please choose how long the suspension lasts.");
  const until = untilFromDays(days);

  await prisma.user.update({ where: { id }, data: { accessStatus: "suspended", accessReason: reason, accessUntil: until } });
  const summary = `${who(user)} was suspended ${until ? `until ${dateOnly(until)}` : "until the team lifts it"}.`;
  await audit(staff, {
    action: "member.suspend",
    targetType: "user",
    targetId: id,
    summary,
    before: { accessStatus: user.accessStatus, accessReason: user.accessReason, accessUntil: user.accessUntil },
    after: { accessStatus: "suspended", accessReason: reason, accessUntil: until },
  });
  if (user.email) {
    const { subject, content } = accountSuspendedEmail({ name: user.name, until, reason });
    await deliver(user.email, subject, content, { tag: "account" });
  }
  refresh(id);
  redirect(back(id, { notice: `${summary} They have been sent an email explaining this.` }));
}

export async function banMemberAction(form: FormData) {
  const staff = await requirePermission("members.ban");
  const id = s(form, "id", 64);
  const user = await target(id);
  if (id === staff.userId) fail(id, "You can't ban your own account.");
  const blocked = protectedMessage(user, "Banning");
  if (blocked) fail(id, blocked);
  if (s(form, "confirm", 8) !== "yes") redirect(back(id, { confirm: "ban" }));

  const reason = s(form, "reason", 500) || null;
  await prisma.user.update({
    where: { id },
    data: { accessStatus: "banned", accessReason: reason, accessUntil: null },
  });
  const summary = `${who(user)} was banned and can no longer sign in.`;
  await audit(staff, {
    action: "member.ban",
    targetType: "user",
    targetId: id,
    summary,
    before: { accessStatus: user.accessStatus, accessReason: user.accessReason, accessUntil: user.accessUntil },
    after: { accessStatus: "banned", accessReason: reason, accessUntil: null },
  });
  if (user.email) {
    const { subject, content } = accountClosedEmail({ name: user.name, reason });
    await deliver(user.email, subject, content, { tag: "account" });
  }
  refresh(id);
  redirect(
    back(id, {
      notice: `${summary} Their subscription has not been cancelled, so check Stripe if they were paying.`,
    })
  );
}

/** Lift a suspension, ban or mute. Reopening a banned account needs the same permission as banning. */
export async function restoreMemberAction(form: FormData) {
  const id = s(form, "id", 64);
  const pre = await prisma.user.findUnique({ where: { id }, select: { accessStatus: true } });
  const staff = await requirePermission(pre?.accessStatus === "banned" ? "members.ban" : "members.suspend");
  const user = await target(id);

  await prisma.user.update({
    where: { id },
    data: { accessStatus: "active", accessReason: null, accessUntil: null, mutedUntil: null },
  });
  const wasBlocked = user.accessStatus !== "active";
  const summary = wasBlocked ? `${who(user)} has full access again.` : `${who(user)} can post and reply again.`;
  await audit(staff, {
    action: "member.restore",
    targetType: "user",
    targetId: id,
    summary,
    before: {
      accessStatus: user.accessStatus,
      accessReason: user.accessReason,
      accessUntil: user.accessUntil,
      mutedUntil: user.mutedUntil,
    },
    after: { accessStatus: "active", accessReason: null, accessUntil: null, mutedUntil: null },
  });
  if (wasBlocked && user.email) {
    const { subject, content } = accountRestoredEmail({ name: user.name });
    await deliver(user.email, subject, content, { tag: "account" });
  }
  refresh(id);
  redirect(back(id, { notice: wasBlocked ? `${summary} They have been sent an email to let them know.` : summary }));
}

/** Let someone read the community but not post or reply for a while. */
export async function muteMemberAction(form: FormData) {
  const staff = await requirePermission("members.suspend");
  const id = s(form, "id", 64);
  const user = await target(id);
  if (id === staff.userId) fail(id, "You can't mute your own account.");
  const blocked = protectedMessage(user, "Muting");
  if (blocked) fail(id, blocked);

  const days = Number(s(form, "days", 4));
  if (![1, 7, 30].includes(days)) fail(id, "Please choose how long the mute lasts.");
  const until = untilFromDays(days)!;

  await prisma.user.update({ where: { id }, data: { mutedUntil: until } });
  const summary = `${who(user)} can read the community but cannot post or reply until ${dateOnly(until)}.`;
  await audit(staff, {
    action: "member.mute",
    targetType: "user",
    targetId: id,
    summary,
    before: { mutedUntil: user.mutedUntil },
    after: { mutedUntil: until },
  });
  refresh(id);
  redirect(back(id, { notice: summary }));
}

/** A private note for the team. Members never see these. */
export async function addNoteAction(form: FormData) {
  const staff = await requirePermission("members.notes");
  const id = s(form, "id", 64);
  const user = await target(id);
  const body = s(form, "body", 4000);
  if (body.length < 2) fail(id, "Please write the note before saving it.");

  const note = await prisma.memberNote.create({ data: { userId: id, authorId: staff.userId, body }, select: { id: true } });
  await audit(staff, {
    action: "member.note",
    targetType: "user",
    targetId: id,
    summary: `Added a private note about ${who(user)}.`,
    after: { noteId: note.id },
  });
  refresh(id);
  redirect(back(id, { notice: "Your note has been saved. Only the team can see it." }));
}

/** CRM changes on a member record need crm.edit or members.edit. */
async function requireCrmEdit() {
  const staff = await getStaff();
  if (!staff) throw new Error("Studio is for the Trichollective team.");
  if (!staff.perms.has("crm.edit") && !staff.perms.has("members.edit")) throw new Error("Your role does not include this action.");
  return staff;
}

/** Tags for finding and grouping members, e.g. "speaker" or "ireland 2026". Members never see them. */
export async function setMemberTagsAction(form: FormData) {
  const staff = await requireCrmEdit();
  const id = s(form, "id", 64);
  await target(id);
  const before = await prisma.user.findUnique({ where: { id }, select: { name: true, email: true, tags: true } });
  if (!before) fail(id, "That account no longer exists.");
  const tags = parseTags(s(form, "tags", 2000));
  if (JSON.stringify(tags) === JSON.stringify(before.tags)) redirect(back(id, { notice: "The tags had not changed." }));

  await prisma.user.update({ where: { id }, data: { tags } });
  const summary = tags.length ? `${who(before)} is now tagged ${tags.join(", ")}.` : `${who(before)} no longer has any tags.`;
  await audit(staff, { action: "member.tags", targetType: "user", targetId: id, summary, before: { tags: before.tags }, after: { tags } });
  refresh(id);
  redirect(back(id, { notice: summary }));
}

/** Choose who on the team looks after this member. */
export async function setMemberOwnerAction(form: FormData) {
  const staff = await requireCrmEdit();
  const id = s(form, "id", 64);
  await target(id);
  const before = await prisma.user.findUnique({ where: { id }, select: { name: true, email: true, crmOwnerId: true } });
  if (!before) fail(id, "That account no longer exists.");
  const ownerId = s(form, "owner", 64) || null;
  let ownerName: string | null = null;
  if (ownerId) {
    const owner = await prisma.user.findFirst({ where: { id: ownerId, staffRole: { not: null } }, select: { name: true, email: true } });
    if (!owner) fail(id, "Please choose someone who is on the team.");
    ownerName = owner.name ?? owner.email ?? "A team member";
  }
  if (ownerId === before.crmOwnerId) redirect(back(id, { notice: "Nothing had changed, so there was nothing to save." }));

  await prisma.user.update({ where: { id }, data: { crmOwnerId: ownerId } });
  const summary = ownerName ? `${ownerName} now looks after ${who(before)}.` : `Nobody on the team is looking after ${who(before)} now.`;
  await audit(staff, {
    action: "member.owner",
    targetType: "user",
    targetId: id,
    summary,
    before: { crmOwnerId: before.crmOwnerId },
    after: { crmOwnerId: ownerId },
  });
  refresh(id);
  redirect(back(id, { notice: summary }));
}
