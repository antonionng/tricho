import "server-only";
import type { Organisation, Partner } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { upsertOrganisationFromIntake } from "@/lib/crm-intake";
import { deleteStoredFile, storeUpload } from "@/lib/storage";
import { coverFromForm, listPhotos } from "@/lib/photos";

/**
 * The CRM record behind a brand's partner page, created and linked when it is missing, so every
 * save in the portal updates both the public page and the team's record.
 */
export async function ensureOrganisation(page: Partner, ownerEmail: string): Promise<Organisation> {
  const linked = await prisma.organisation.findUnique({ where: { partnerId: page.id } });
  if (linked) return linked;
  const org = await upsertOrganisationFromIntake({
    name: page.name,
    category: page.category,
    website: page.website,
    email: ownerEmail,
    source: "brand-portal",
    interest: page.tier,
    stage: "customer",
    accountEmail: ownerEmail,
    partnerId: page.id,
  });
  if (org.partnerId === page.id) return org;
  // The match already holds another page, so this page gets a record of its own.
  return prisma.organisation.create({
    data: {
      name: page.name,
      kind: "brand",
      category: page.category,
      website: page.website,
      email: ownerEmail,
      source: "brand-portal",
      interest: page.tier,
      stage: "customer",
      accountEmail: ownerEmail,
      partnerId: page.id,
    },
  });
}

/** The brand's page, its CRM record and gallery (when there is a page) and their seats. */
export async function loadBusiness(email: string) {
  const [page, seats] = await Promise.all([
    prisma.partner.findUnique({ where: { ownerEmail: email } }),
    prisma.businessSeat.findMany({ where: { ownerEmail: email }, orderBy: { createdAt: "asc" } }),
  ]);
  const [org, photos] = page
    ? await Promise.all([prisma.organisation.findUnique({ where: { partnerId: page.id } }), listPhotos({ partnerId: page.id })])
    : [null, []];
  return { page, org, seats, photos };
}

export type LogoChange = { ok: true } | { ok: false; message: string };

/**
 * Applies a logo upload or removal from a form (fields "logo" and "removeLogo") to the partner page
 * and its CRM record. The file is resized and stored; the one it replaces is deleted. Older logos
 * kept in PartnerLogo keep working until they are replaced.
 */
export async function applyLogoFromForm(form: FormData, page: Partner, orgId: string | null, ownerId: string | null): Promise<LogoChange> {
  const upload = await storeUpload({ kind: "logo", file: form.get("logo") as File | null, ownerId });
  if (upload && !upload.ok) return upload;
  const remove = form.get("removeLogo") === "on";
  if (!upload && !remove) return { ok: true };

  const next = upload?.ok ? upload.file : null;
  await prisma.partner.update({ where: { id: page.id }, data: { logoFileId: next?.id ?? null, logoUrl: next?.url ?? null } });
  if (orgId) await prisma.organisation.update({ where: { id: orgId }, data: { logoFileId: next?.id ?? null } });
  await prisma.partnerLogo.deleteMany({ where: { partnerId: page.id } });
  if (page.logoFileId && page.logoFileId !== next?.id) await deleteStoredFile(page.logoFileId);
  return { ok: true };
}

/** A cover upload or removal (fields "cover" and "removeCover"); the file it replaces is deleted. */
export async function applyCoverFromForm(form: FormData, page: Partner, ownerId: string | null): Promise<LogoChange> {
  const change = await coverFromForm(form, ownerId);
  if (!change.ok) return change;
  if (!change.changed) return { ok: true };
  await prisma.partner.update({
    where: { id: page.id },
    data: { coverFileId: change.file?.id ?? null, coverUrl: change.file?.url ?? null },
  });
  if (page.coverFileId && page.coverFileId !== change.file?.id) await deleteStoredFile(page.coverFileId);
  return { ok: true };
}
