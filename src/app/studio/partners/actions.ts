"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { partnerCapError, partnerLogoSrc } from "@/lib/partners";
import { PARTNER_KINDS } from "@/lib/showcase";
import { isShowcaseStep, saveShowcaseStep, SHOWCASE_STEPS } from "@/lib/showcase-save";
import { studioAction } from "../_lib/guard";
import { audit } from "@/lib/staff";
import { upsertOrganisationFromIntake } from "@/lib/crm-intake";
import { deleteStoredFile, storeUpload } from "@/lib/storage";

function s(form: FormData, key: string, max = 4000) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function withParams(path: string, params: Record<string, string | undefined>) {
  const url = new URL(path, "http://studio.local");
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  return `${url.pathname}${url.search}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/** Only http(s) links are stored, so nothing else can reach an href or img src. */
function cleanUrl(value: string) {
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

async function uniquePartnerSlug(tx: Prisma.TransactionClient, name: string) {
  const base = slugify(name) || "partner";
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const taken = await tx.partner.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function savePartnerAction(form: FormData) {
  const staff = await studioAction("partners.manage");
  const id = s(form, "id", 64) || undefined;
  const back = id ? { edit: id } : { new: "1" };
  const fail = (notice: string) => redirect(withParams("/studio/partners", { ...back, notice, tone: "danger" }));

  const name = s(form, "name", 120);
  const tier = s(form, "tier", 20) === "business" ? "business" : "premium";
  const category = s(form, "category", 60);
  const blurb = s(form, "blurb", 4000);
  const logoRaw = s(form, "logoUrl", 500);
  const websiteRaw = s(form, "website", 500);
  const contactEmail = s(form, "contactEmail", 160).toLowerCase();
  const featuredRaw = s(form, "featuredUntil", 10);

  if (!name || !category || blurb.length < 20) {
    fail("Please add a name, a category and a blurb of at least a sentence.");
  }
  // A logo served by us (an upload) keeps its path; anything else must be a full web address.
  let logoUrl = logoRaw.startsWith("/") ? partnerLogoSrc(logoRaw) : cleanUrl(logoRaw);
  if (logoRaw && !logoUrl) fail("Please check the logo address. It needs to be a full web address.");
  const before = id ? await prisma.partner.findUnique({ where: { id } }) : null;
  let logoFileId: string | null = before?.logoFileId ?? null;
  // A new upload wins; ticking Remove clears it; typing a different address replaces the stored file.
  const upload = await storeUpload({ kind: "logo", file: form.get("logoFile") as File | null, ownerId: staff.userId });
  if (upload && !upload.ok) fail(upload.message);
  if (upload?.ok) {
    logoFileId = upload.file.id;
    logoUrl = upload.file.url;
  } else if (form.get("removeLogo") === "on") {
    logoFileId = null;
    logoUrl = null;
  } else if (logoUrl !== (before?.logoUrl ?? null)) {
    logoFileId = null;
  }
  const website = cleanUrl(websiteRaw);
  if (websiteRaw && !website) fail("Please check the website address.");
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) fail("Please check the contact email.");
  const publicEmail = s(form, "publicEmail", 160).toLowerCase();
  if (publicEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(publicEmail)) fail("Please check the public email.");
  const publicPhone = s(form, "publicPhone", 40);
  if (publicPhone && !/^[+()\d\s.-]{6,40}$/.test(publicPhone)) fail("Please check the public phone number.");
  const ownerEmail = s(form, "ownerEmail", 160).toLowerCase();
  if (ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) fail("Please check the Managed by email.");
  const kindRaw = s(form, "kind", 20);
  const kind = (PARTNER_KINDS as readonly string[]).includes(kindRaw) ? kindRaw : "brand";
  const accentRaw = s(form, "accentColor", 7);
  if (accentRaw && !/^#[0-9a-fA-F]{6}$/.test(accentRaw)) fail("Please give the charity colour as a hex value, like #D4007A.");
  const hidden = form.get("hidden") === "on";
  let featuredUntil: Date | null = null;
  if (featuredRaw) {
    featuredUntil = /^\d{4}-\d{2}-\d{2}$/.test(featuredRaw) ? new Date(`${featuredRaw}T23:59:59Z`) : null;
    if (!featuredUntil || Number.isNaN(featuredUntil.getTime())) fail("Please check the featured-until date.");
  }

  const data = {
    name,
    tier,
    category,
    blurb,
    logoUrl,
    logoFileId,
    website,
    perk: s(form, "perk", 2000) || null,
    contactEmail: contactEmail || null,
    publicEmail: publicEmail || null,
    publicPhone: publicPhone || null,
    // Founding places only exist for Premium Business.
    isFounding: tier === "premium" && form.get("isFounding") === "on",
    published: form.get("published") === "on" && !hidden,
    hidden,
    ownerEmail: ownerEmail || null,
    featuredUntil,
    kind,
    accentColor: accentRaw || null,
    charityNumber: s(form, "charityNumber", 20) || null,
  };

  let result: { error: string } | { slug: string; id: string };
  try {
    // Serializable, so two saves at once can't both squeeze past the caps.
    result = await prisma.$transaction(
      async (tx) => {
        const error = await partnerCapError(tx, { id, ...data });
        if (error) return { error };
        if (id) {
          // The slug stays as it was, so links already shared keep working.
          const saved = await tx.partner.update({ where: { id }, data, select: { slug: true, id: true } });
          return saved;
        }
        const slug = await uniquePartnerSlug(tx, name);
        return tx.partner.create({ data: { ...data, slug }, select: { slug: true, id: true } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    console.error("[STUDIO_PARTNER_SAVE]", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("That Managed by email already manages another partner page.");
    }
    result = { error: "Something went wrong saving this partner, possibly because someone else saved at the same moment. Please try again." };
  }
  if ("error" in result) {
    if (upload?.ok) await deleteStoredFile(upload.file.id);
    return fail(result.error);
  }
  if (before?.logoFileId && before.logoFileId !== logoFileId) await deleteStoredFile(before.logoFileId);
  if (before?.logoFileId !== logoFileId) await prisma.partnerLogo.deleteMany({ where: { partnerId: result.id } }).catch(() => null);

  // Keep the CRM record in step: linked (or created) for this page, with the same logo.
  try {
    const org = await upsertOrganisationFromIntake({
      name,
      category,
      website,
      email: contactEmail || null,
      accountEmail: ownerEmail || null,
      partnerId: result.id,
      source: "studio",
      interest: tier,
      stage: data.published ? "customer" : null,
    });
    if (org.partnerId === result.id) {
      await prisma.organisation.update({ where: { id: org.id }, data: { logoFileId } });
    }
  } catch (error) {
    console.error("[STUDIO_PARTNER_CRM]", error);
  }

  await audit(staff, {
    action: id ? "partner.update" : "partner.create",
    targetType: "partner",
    targetId: result.id,
    summary: `${id ? "Updated" : "Created"} partner page ${name}${data.published ? " (published)" : ""}`,
    before: before ? { name: before.name, tier: before.tier, published: before.published, hidden: before.hidden, ownerEmail: before.ownerEmail } : undefined,
    after: { name, tier, published: data.published, hidden, ownerEmail: data.ownerEmail },
  });

  revalidatePath("/studio/partners");
  revalidatePath("/partners", "layout");
  revalidatePath(`/partners/${result.slug}`);
  revalidatePath("/members/perks");
  // A new page goes straight to the page editor, so the team can add the logo, photos and story.
  redirect(
    withParams(id ? "/studio/partners" : `/studio/partners/${result.id}`, {
      notice: id
        ? data.published
          ? `${name} saved and published.`
          : `${name} saved. It stays hidden until you tick Published.`
        : `${name} is created. Now add the logo, cover, story and photos, then publish it from the Preview step.`,
    })
  );
}

const SHOWCASE_ERRORS: Record<string, string> = {
  colour: "Please give the colour as a hex value, like #D4007A.",
  cta: "Please check the button link. It needs to be a full web address, or leave it empty.",
  video: "Please use a YouTube or Vimeo link for the video.",
};

/**
 * Saves one step of a partner page from the Studio editor, through exactly the same code the
 * business portal uses. Uploads go to storage and everything else to the database.
 */
export async function saveShowcaseStudioAction(form: FormData) {
  const staff = await studioAction("partners.manage");
  const id = s(form, "id", 64);
  const step = s(form, "step", 20);
  const page = await prisma.partner.findUnique({ where: { id } });
  if (!page || !isShowcaseStep(step)) redirect("/studio/partners");
  const back = (params: Record<string, string | undefined>) => redirect(withParams(`/studio/partners/${id}`, { step, ...params }));

  const org = await prisma.organisation.findUnique({ where: { partnerId: id }, select: { id: true } });
  const result = await saveShowcaseStep(step, form, page, org?.id ?? null, staff.userId);
  if (!result.ok) back({ notice: result.message ?? SHOWCASE_ERRORS[result.error] ?? "That couldn't be saved. Please check it and try again.", tone: "danger" });

  await audit(staff, {
    action: "partner.showcase",
    targetType: "partner",
    targetId: id,
    summary: `Edited the ${SHOWCASE_STEPS.find((x) => x.id === step)!.label.toLowerCase()} on ${page.name}'s page.`,
  });
  revalidatePath(`/studio/partners/${id}`);
  revalidatePath(`/partners/${page.slug}`);
  revalidatePath("/partners", "layout");
  revalidatePath("/directory");
  // Photo changes stay on the photos step; other steps move on to the next one.
  const order = SHOWCASE_STEPS.map((x) => x.id) as string[];
  const next = step === "photos" && form.get("intent") !== "continue" ? "photos" : (order[order.indexOf(step) + 1] ?? "preview");
  redirect(withParams(`/studio/partners/${id}`, { step: next, notice: "Saved." }));
}

/** Publishes or hides a page from the Studio editor's Preview step. */
export async function setPartnerPublishedAction(form: FormData) {
  const staff = await studioAction("partners.manage");
  const id = s(form, "id", 64);
  const publish = form.get("publish") === "1";
  const page = await prisma.partner.findUnique({ where: { id } });
  if (!page) redirect("/studio/partners");
  if (publish && page.hidden) {
    redirect(withParams(`/studio/partners/${id}`, { step: "preview", notice: "This page is paused. Untick Paused in its basic details first.", tone: "danger" }));
  }
  await prisma.partner.update({ where: { id }, data: { published: publish } });
  await audit(staff, {
    action: publish ? "partner.publish" : "partner.unpublish",
    targetType: "partner",
    targetId: id,
    summary: `${publish ? "Published" : "Hid"} ${page.name}'s page.`,
  });
  revalidatePath("/studio/partners");
  revalidatePath(`/partners/${page.slug}`);
  revalidatePath("/partners", "layout");
  revalidatePath("/directory");
  revalidatePath("/");
  redirect(withParams(`/studio/partners/${id}`, { step: "preview", notice: publish ? `${page.name} is live.` : `${page.name} is hidden.` }));
}
