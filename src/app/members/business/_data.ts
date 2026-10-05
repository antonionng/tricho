import "server-only";
import type { Organisation, Partner } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { upsertOrganisationFromIntake } from "@/lib/crm-intake";
import { listPhotos } from "@/lib/photos";

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

// Logo and cover saving is shared with the Studio editor.
export { applyCoverFromForm, applyLogoFromForm, type LogoChange } from "@/lib/showcase-save";
