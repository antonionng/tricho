"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission, type Staff } from "@/lib/staff";
import { deleteStoredFile, storeUpload } from "@/lib/storage";
import { slugify } from "@/lib/directory";
import { PARTNER_CATEGORIES, partnerCapError } from "@/lib/partners";
import {
  NOTE_KINDS,
  NOTE_KIND_LABEL,
  ORG_KINDS,
  ORG_SIZES,
  SOCIAL_KEYS,
  STAGE_LABEL,
  changedFields,
  cleanUrl,
  formatGBP,
  isEmail,
  isStage,
  parseDay,
  parseGBP,
  parseTags,
  type NoteKind,
  type OrgStageId,
} from "@/lib/crm";
import { dateOnly } from "@/components/studio/ui";

function s(form: FormData, key: string, max = 200) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}
const opt = (v: string) => v || null;

function detail(id: string, params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString();
  return `/studio/crm/${id}${q ? `?${q}` : ""}`;
}

function fail(id: string, notice: string): never {
  redirect(detail(id, { notice, tone: "danger" }));
}

/** Where to go after a change made from the list or board. Only Studio CRM pages are allowed. */
function returnTo(form: FormData, fallback: string) {
  const r = s(form, "return", 500);
  return r.startsWith("/studio/crm") && !r.startsWith("//") ? r : fallback;
}

function withNotice(path: string, notice: string, tone?: "danger") {
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("notice", notice);
  if (tone) params.set("tone", tone);
  else params.delete("tone");
  return `${base}?${params}`;
}

async function target(id: string) {
  const org = id ? await prisma.organisation.findUnique({ where: { id } }) : null;
  if (!org) redirect(`/studio/crm?${new URLSearchParams({ notice: "That business is no longer in the CRM.", tone: "danger" })}`);
  return org;
}

function refresh(id?: string) {
  revalidatePath("/studio/crm");
  if (id) revalidatePath(`/studio/crm/${id}`);
}

async function teamMemberName(id: string | null) {
  if (!id) return null;
  const u = await prisma.user.findFirst({ where: { id, staffRole: { not: null } }, select: { name: true, email: true } });
  return u ? (u.name ?? u.email ?? "a team member") : undefined;
}

async function userIdForEmail(email: string | null) {
  if (!email) return null;
  const u = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } });
  return u?.id ?? null;
}

// ---------- Create ----------

export async function createOrganisationAction(form: FormData) {
  const staff = await requirePermission("crm.edit");
  const name = s(form, "name", 160);
  const kind = s(form, "kind", 20);
  const stageRaw = s(form, "stage", 20);
  const email = s(form, "email", 160).toLowerCase();
  const websiteRaw = s(form, "website", 500);
  const interest = s(form, "interest", 120);
  const value = parseGBP(s(form, "valueGBP", 20));
  const contactName = s(form, "contactName", 160);
  const contactEmail = s(form, "contactEmail", 160).toLowerCase();

  const bad = (notice: string): never => redirect(`/studio/crm/new?${new URLSearchParams({ notice, tone: "danger" })}`);
  if (name.length < 2) bad("Please give the business a name.");
  if (!(ORG_KINDS as readonly string[]).includes(kind)) bad("Please choose what kind of business this is.");
  const stage: OrgStageId = isStage(stageRaw) ? stageRaw : "lead";
  if (email && !isEmail(email)) bad("The business email doesn't look right. Please check it.");
  const website = cleanUrl(websiteRaw);
  if (websiteRaw && !website) bad("The website needs to be a normal web address.");
  if (value === undefined) bad("Please give the value as a whole number of pounds.");
  if (contactEmail && !isEmail(contactEmail)) bad("The contact's email doesn't look right. Please check it.");

  const contactUserId = await userIdForEmail(contactEmail || null);
  const org = await prisma.organisation.create({
    data: {
      name,
      kind,
      stage,
      email: opt(email),
      website,
      interest: opt(interest),
      valueGBP: value ?? null,
      source: "studio",
      ownerStaffId: staff.userId,
      contacts:
        contactName || contactEmail
          ? { create: { name: contactName || contactEmail, email: opt(contactEmail), userId: contactUserId, isPrimary: true } }
          : undefined,
    },
    select: { id: true },
  });
  await audit(staff, {
    action: "organisation.create",
    targetType: "organisation",
    targetId: org.id,
    summary: `Added ${name} to the CRM as a ${STAGE_LABEL[stage].label.toLowerCase()}.`,
    after: { name, kind, stage, email, website, interest, valueGBP: value },
  });
  refresh(org.id);
  redirect(detail(org.id, { notice: `${name} is now in the CRM, and you look after it.` }));
}

// ---------- Overview: stage, owner, tags, value, follow-up ----------

async function applyStage(staff: Staff, org: { id: string; name: string; stage: string }, stage: OrgStageId) {
  if (org.stage === stage) return null;
  await prisma.organisation.update({ where: { id: org.id }, data: { stage } });
  const summary = `${org.name} moved from ${STAGE_LABEL[org.stage as OrgStageId]?.label ?? org.stage} to ${STAGE_LABEL[stage].label}.`;
  await audit(staff, {
    action: "organisation.stage",
    targetType: "organisation",
    targetId: org.id,
    summary,
    before: { stage: org.stage },
    after: { stage },
  });
  return summary;
}

/** Move a business to another stage, from the board, the list or its own page. */
export async function setStageAction(form: FormData) {
  const staff = await requirePermission("crm.edit");
  const id = s(form, "id", 64);
  const org = await target(id);
  const stage = s(form, "stage", 20);
  const back = returnTo(form, detail(id));
  if (!isStage(stage)) redirect(withNotice(back, "Please choose a stage.", "danger"));
  const summary = await applyStage(staff, org, stage);
  refresh(id);
  redirect(withNotice(back, summary ?? `${org.name} was already at that stage.`));
}

export async function setOwnerAction(form: FormData) {
  const staff = await requirePermission("crm.edit");
  const id = s(form, "id", 64);
  const org = await target(id);
  const ownerId = s(form, "owner", 64) || null;
  const name = await teamMemberName(ownerId);
  if (name === undefined) fail(id, "Please choose someone who is on the team.");
  if (org.ownerStaffId !== ownerId) {
    await prisma.organisation.update({ where: { id }, data: { ownerStaffId: ownerId } });
    await audit(staff, {
      action: "organisation.owner",
      targetType: "organisation",
      targetId: id,
      summary: name ? `${name} now looks after ${org.name}.` : `Nobody is looking after ${org.name} now.`,
      before: { ownerStaffId: org.ownerStaffId },
      after: { ownerStaffId: ownerId },
    });
  }
  refresh(id);
  redirect(detail(id, { notice: name ? `${name} looks after ${org.name}.` : `Nobody is looking after ${org.name}.` }));
}

export async function setTagsAction(form: FormData) {
  const staff = await requirePermission("crm.edit");
  const id = s(form, "id", 64);
  const org = await target(id);
  const tags = parseTags(s(form, "tags", 2000));
  if (JSON.stringify(tags) !== JSON.stringify(org.tags)) {
    await prisma.organisation.update({ where: { id }, data: { tags } });
    await audit(staff, {
      action: "organisation.tags",
      targetType: "organisation",
      targetId: id,
      summary: tags.length ? `${org.name} is now tagged ${tags.join(", ")}.` : `${org.name} no longer has any tags.`,
      before: { tags: org.tags },
      after: { tags },
    });
  }
  refresh(id);
  redirect(detail(id, { notice: "The tags have been saved." }));
}

/** The header form: stage, owner, tags, value and follow-up date in one save. Each change is recorded on its own. */
export async function saveOverviewAction(form: FormData) {
  const staff = await requirePermission("crm.edit");
  const id = s(form, "id", 64);
  const org = await target(id);

  const stage = s(form, "stage", 20);
  if (!isStage(stage)) fail(id, "Please choose a stage.");
  const ownerId = s(form, "owner", 64) || null;
  const ownerName = await teamMemberName(ownerId);
  if (ownerName === undefined) fail(id, "Please choose someone who is on the team.");
  const tags = parseTags(s(form, "tags", 2000));
  const value = parseGBP(s(form, "valueGBP", 20));
  if (value === undefined) fail(id, "Please give the value as a whole number of pounds.");
  const followUpAt = parseDay(s(form, "followUpAt", 10));
  if (followUpAt === undefined) fail(id, "Please give the follow-up date as a full date.");

  const changes: string[] = [];
  const stageSummary = await applyStage(staff, org, stage);
  if (stageSummary) changes.push(stageSummary);

  if (org.ownerStaffId !== ownerId) {
    await prisma.organisation.update({ where: { id }, data: { ownerStaffId: ownerId } });
    const summary = ownerName ? `${ownerName} now looks after ${org.name}.` : `Nobody is looking after ${org.name} now.`;
    await audit(staff, {
      action: "organisation.owner",
      targetType: "organisation",
      targetId: id,
      summary,
      before: { ownerStaffId: org.ownerStaffId },
      after: { ownerStaffId: ownerId },
    });
    changes.push(summary);
  }

  if (JSON.stringify(tags) !== JSON.stringify(org.tags)) {
    await prisma.organisation.update({ where: { id }, data: { tags } });
    const summary = tags.length ? `${org.name} is now tagged ${tags.join(", ")}.` : `${org.name} no longer has any tags.`;
    await audit(staff, {
      action: "organisation.tags",
      targetType: "organisation",
      targetId: id,
      summary,
      before: { tags: org.tags },
      after: { tags },
    });
    changes.push(summary);
  }

  const diff = changedFields({ valueGBP: org.valueGBP, followUpAt: org.followUpAt }, { valueGBP: value, followUpAt });
  if (diff.changed.length) {
    await prisma.organisation.update({ where: { id }, data: { valueGBP: value, followUpAt } });
    const parts: string[] = [];
    if (diff.changed.includes("valueGBP")) parts.push(value === null ? "the value was cleared" : `the value is now ${formatGBP(value)}`);
    if (diff.changed.includes("followUpAt"))
      parts.push(followUpAt ? `the follow-up date is now ${dateOnly(followUpAt)}` : "the follow-up date was cleared");
    const summary = `For ${org.name}, ${parts.join(" and ")}.`;
    await audit(staff, {
      action: "organisation.update",
      targetType: "organisation",
      targetId: id,
      summary,
      before: diff.before,
      after: diff.after,
    });
    changes.push(summary);
  }

  refresh(id);
  redirect(detail(id, { notice: changes.length ? changes.join(" ") : "Nothing had changed, so there was nothing to save." }));
}

// ---------- Details ----------

export async function updateDetailsAction(form: FormData) {
  const staff = await requirePermission("crm.edit");
  const id = s(form, "id", 64);
  const org = await target(id);

  const name = s(form, "name", 160);
  const kind = s(form, "kind", 20);
  const email = s(form, "email", 160).toLowerCase();
  const accountEmail = s(form, "accountEmail", 160).toLowerCase();
  const websiteRaw = s(form, "website", 500);
  const size = s(form, "size", 10);
  if (name.length < 2) fail(id, "Please give the business a name.");
  if (!(ORG_KINDS as readonly string[]).includes(kind)) fail(id, "Please choose what kind of business this is.");
  if (email && !isEmail(email)) fail(id, "The business email doesn't look right. Please check it.");
  if (accountEmail && !isEmail(accountEmail)) fail(id, "The account email doesn't look right. Please check it.");
  const website = cleanUrl(websiteRaw);
  if (websiteRaw && !website) fail(id, "The website needs to be a normal web address.");
  if (size && !(ORG_SIZES as readonly string[]).includes(size)) fail(id, "Please choose a size from the list.");

  const socials: Record<string, string> = {};
  for (const key of SOCIAL_KEYS) {
    const v = s(form, `social_${key}`, 300);
    if (v) socials[key] = v;
  }

  let logoFileId = org.logoFileId;
  const upload = await storeUpload({ kind: "logo", file: form.get("logo") as File | null, ownerId: staff.userId });
  if (upload && !upload.ok) fail(id, upload.message);
  if (upload?.ok) logoFileId = upload.file.id;
  else if (form.get("removeLogo") === "on") logoFileId = null;

  const next = {
    name,
    kind,
    category: opt(s(form, "category", 120)),
    website,
    email: opt(email),
    phone: opt(s(form, "phone", 60)),
    addressLine1: opt(s(form, "addressLine1", 200)),
    addressLine2: opt(s(form, "addressLine2", 200)),
    city: opt(s(form, "city", 120)),
    region: opt(s(form, "region", 120)),
    postcode: opt(s(form, "postcode", 20)),
    country: opt(s(form, "country", 120)),
    companyNumber: opt(s(form, "companyNumber", 40)),
    vatNumber: opt(s(form, "vatNumber", 40)),
    size: opt(size),
    description: opt(s(form, "description", 6000)),
    interest: opt(s(form, "interest", 120)),
    source: opt(s(form, "source", 60)),
    accountEmail: opt(accountEmail),
    logoFileId,
    socials: Object.keys(socials).length ? socials : null,
  };

  const diff = changedFields(org as unknown as Record<string, unknown>, next);
  if (!diff.changed.length) redirect(detail(id, { notice: "Nothing had changed, so there was nothing to save." }));

  await prisma.organisation.update({
    where: { id },
    data: { ...next, socials: next.socials ?? Prisma.DbNull },
  });
  if (org.logoFileId && org.logoFileId !== logoFileId) {
    // Keep the old file if a partner page still shows it.
    const inUse = await prisma.partner.count({ where: { logoFileId: org.logoFileId } });
    if (!inUse) await deleteStoredFile(org.logoFileId);
  }
  await audit(staff, {
    action: "organisation.update",
    targetType: "organisation",
    targetId: id,
    summary: `Updated the details for ${name}: ${diff.changed.join(", ")}.`,
    before: diff.before,
    after: diff.after,
  });
  refresh(id);
  redirect(detail(id, { notice: `The details for ${name} have been saved.` }));
}

// ---------- Contacts ----------

function readContact(form: FormData, id: string) {
  const name = s(form, "name", 160);
  const email = s(form, "email", 160).toLowerCase();
  if (name.length < 2 && !email) fail(id, "Please give the contact a name or an email address.");
  if (email && !isEmail(email)) fail(id, "The contact's email doesn't look right. Please check it.");
  return {
    name: name || email,
    email: opt(email),
    phone: opt(s(form, "phone", 60)),
    title: opt(s(form, "title", 120)),
    isPrimary: form.get("isPrimary") === "on",
  };
}

export async function addContactAction(form: FormData) {
  const staff = await requirePermission("crm.edit");
  const id = s(form, "id", 64);
  const org = await target(id);
  const data = readContact(form, id);
  const userId = await userIdForEmail(data.email);
  const existing = await prisma.organisationContact.count({ where: { organisationId: id } });
  const isPrimary = data.isPrimary || existing === 0;

  const contact = await prisma.$transaction(async (tx) => {
    if (isPrimary) await tx.organisationContact.updateMany({ where: { organisationId: id }, data: { isPrimary: false } });
    return tx.organisationContact.create({ data: { ...data, isPrimary, userId, organisationId: id }, select: { id: true } });
  });
  await audit(staff, {
    action: "organisation.contact.add",
    targetType: "organisation",
    targetId: id,
    summary: `Added ${data.name} as a contact at ${org.name}${userId ? ", linked to their member account" : ""}.`,
    after: { contactId: contact.id, ...data, isPrimary, userId },
  });
  refresh(id);
  redirect(
    detail(id, {
      notice: userId
        ? `${data.name} has been added and linked to their member account.`
        : `${data.name} has been added as a contact.`,
    })
  );
}

export async function updateContactAction(form: FormData) {
  const staff = await requirePermission("crm.edit");
  const id = s(form, "id", 64);
  const org = await target(id);
  const contactId = s(form, "contactId", 64);
  const before = await prisma.organisationContact.findFirst({ where: { id: contactId, organisationId: id } });
  if (!before) fail(id, "That contact has already been removed.");
  const data = readContact(form, id);
  const userId = data.email === before.email && before.userId ? before.userId : await userIdForEmail(data.email);

  await prisma.$transaction(async (tx) => {
    if (data.isPrimary && !before.isPrimary) {
      await tx.organisationContact.updateMany({ where: { organisationId: id }, data: { isPrimary: false } });
    }
    await tx.organisationContact.update({ where: { id: contactId }, data: { ...data, userId } });
  });
  const diff = changedFields(
    { name: before.name, email: before.email, phone: before.phone, title: before.title, isPrimary: before.isPrimary, userId: before.userId },
    { ...data, userId }
  );
  await audit(staff, {
    action: "organisation.contact.update",
    targetType: "organisation",
    targetId: id,
    summary: `Updated ${data.name}, a contact at ${org.name}.`,
    before: { contactId, ...diff.before },
    after: { contactId, ...diff.after },
  });
  refresh(id);
  redirect(detail(id, { notice: `The details for ${data.name} have been saved.` }));
}

export async function removeContactAction(form: FormData) {
  const staff = await requirePermission("crm.edit");
  const id = s(form, "id", 64);
  const org = await target(id);
  const contactId = s(form, "contactId", 64);
  const before = await prisma.organisationContact.findFirst({ where: { id: contactId, organisationId: id } });
  if (!before) fail(id, "That contact has already been removed.");
  await prisma.organisationContact.delete({ where: { id: contactId } });
  await audit(staff, {
    action: "organisation.contact.remove",
    targetType: "organisation",
    targetId: id,
    summary: `Removed ${before.name} as a contact at ${org.name}.`,
    before,
  });
  refresh(id);
  redirect(detail(id, { notice: `${before.name} is no longer listed as a contact.` }));
}

// ---------- Notes ----------

export async function addOrgNoteAction(form: FormData) {
  const staff = await requirePermission("crm.edit");
  const id = s(form, "id", 64);
  const org = await target(id);
  const kindRaw = s(form, "kind", 20);
  const kind: NoteKind = (NOTE_KINDS as readonly string[]).includes(kindRaw) ? (kindRaw as NoteKind) : "note";
  const body = s(form, "body", 6000);
  if (body.length < 2) fail(id, "Please write the note before saving it.");
  const note = await prisma.organisationNote.create({ data: { organisationId: id, authorId: staff.userId, kind, body }, select: { id: true } });
  await audit(staff, {
    action: "organisation.note",
    targetType: "organisation",
    targetId: id,
    summary: `Added a ${NOTE_KIND_LABEL[kind].toLowerCase()} note about ${org.name}.`,
    after: { noteId: note.id, kind },
  });
  refresh(id);
  redirect(detail(id, { notice: "Your note has been added to the timeline." }));
}

// ---------- Convert to a brand page ----------

async function uniqueSlug(tx: Prisma.TransactionClient, name: string) {
  const base = slugify(name).slice(0, 60) || "partner";
  for (let i = 1; i < 50; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    if (!(await tx.partner.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Create an unpublished partner page for this business, link it, and mark the deal as won. */
export async function convertToPartnerAction(form: FormData) {
  const staff = await requirePermission("crm.edit");
  const id = s(form, "id", 64);
  const org = await target(id);
  if (org.partnerId) fail(id, "This business already has a brand page.");

  const tier = s(form, "tier", 20) === "premium" ? "premium" : "business";
  const category = s(form, "category", 60);
  const blurb = s(form, "blurb", 4000) || org.description || "";
  const isFounding = form.get("isFounding") === "on";
  if (!(PARTNER_CATEGORIES as readonly string[]).includes(category)) fail(id, "Please choose a category for the brand page.");
  if (blurb.length < 20) fail(id, "Please write a short description of at least 20 characters for the brand page.");

  const primary = await prisma.organisationContact.findFirst({
    where: { organisationId: id, email: { not: null } },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: { email: true },
  });
  const ownerEmail = (org.accountEmail ?? primary?.email ?? null)?.toLowerCase() ?? null;

  let result: { error: string } | { partnerId: string; slug: string };
  try {
    result = await prisma.$transaction(
      async (tx) => {
        const error = await partnerCapError(tx, { tier, isFounding });
        if (error) return { error };
        if (ownerEmail) {
          const taken = await tx.partner.findUnique({ where: { ownerEmail }, select: { name: true } });
          if (taken) {
            return {
              error: `${ownerEmail} already manages the brand page for ${taken.name}. Change the account email in Details first, or link that page from the Partners page.`,
            };
          }
        }
        const partner = await tx.partner.create({
          data: {
            name: org.name,
            slug: await uniqueSlug(tx, org.name),
            tier,
            category,
            blurb,
            website: org.website,
            contactEmail: org.email,
            ownerEmail,
            isFounding,
            published: false,
            logoFileId: org.logoFileId,
          },
          select: { id: true, slug: true },
        });
        await tx.organisation.update({ where: { id }, data: { partnerId: partner.id, stage: "won", category: org.category ?? category } });
        return { partnerId: partner.id, slug: partner.slug };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    console.error("[CRM_CONVERT]", e);
    result = { error: "Something went wrong creating the brand page. Please try again." };
  }
  if ("error" in result) fail(id, result.error);

  const tierName = tier === "premium" ? "Premium" : "Business";
  await audit(staff, {
    action: "organisation.convert",
    targetType: "organisation",
    targetId: id,
    summary: `Created an unpublished ${tierName} brand page for ${org.name} and marked the deal as won.`,
    before: { stage: org.stage, partnerId: null },
    after: { stage: "won", partnerId: result.partnerId, slug: result.slug, tier, category, isFounding, ownerEmail },
  });
  refresh(id);
  revalidatePath("/studio/partners");
  redirect(
    detail(id, {
      notice: `The ${tierName} brand page for ${org.name} has been created as a draft. ${
        ownerEmail ? `${ownerEmail} can finish and publish it from the member area.` : "Add an account email so someone can manage it."
      }`,
    })
  );
}

// ---------- Delete ----------

export async function deleteOrganisationAction(form: FormData) {
  const staff = await requirePermission("crm.edit");
  const id = s(form, "id", 64);
  if (staff.role !== "owner") fail(id, "Only owners can delete a business from the CRM.");
  const org = await target(id);
  if (s(form, "confirm", 8) !== "yes") redirect(detail(id, { confirm: "delete" }));

  const contacts = await prisma.organisationContact.findMany({ where: { organisationId: id } });
  await prisma.organisation.delete({ where: { id } });
  await audit(staff, {
    action: "organisation.delete",
    targetType: "organisation",
    targetId: id,
    summary: `Deleted ${org.name} from the CRM, with its contacts and notes.${org.partnerId ? " Its brand page was kept." : ""}`,
    before: { ...org, contacts },
  });
  refresh();
  redirect(`/studio/crm?${new URLSearchParams({ notice: `${org.name} has been deleted from the CRM.` })}`);
}
