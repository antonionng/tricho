"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { partnerCapError, partnerLogoSrc } from "@/lib/partners";
import { studioAction } from "../_lib/guard";

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
  await studioAction("partners.manage");
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
  // A logo the brand uploaded is served by us; keep that path as it is.
  const logoUrl = logoRaw.startsWith("/api/partners/") ? partnerLogoSrc(logoRaw) : cleanUrl(logoRaw);
  if (logoRaw && !logoUrl) fail("Please check the logo address. It needs to be a full web address.");
  const website = cleanUrl(websiteRaw);
  if (websiteRaw && !website) fail("Please check the website address.");
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) fail("Please check the contact email.");
  const ownerEmail = s(form, "ownerEmail", 160).toLowerCase();
  if (ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) fail("Please check the Managed by email.");
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
    website,
    perk: s(form, "perk", 2000) || null,
    contactEmail: contactEmail || null,
    // Founding places only exist for Premium Business.
    isFounding: tier === "premium" && form.get("isFounding") === "on",
    published: form.get("published") === "on" && !hidden,
    hidden,
    ownerEmail: ownerEmail || null,
    featuredUntil,
  };

  let result: { error: string } | { slug: string };
  try {
    // Serializable, so two saves at once can't both squeeze past the caps.
    result = await prisma.$transaction(
      async (tx) => {
        const error = await partnerCapError(tx, { id, ...data });
        if (error) return { error };
        if (id) {
          // The slug stays as it was, so links already shared keep working.
          const saved = await tx.partner.update({ where: { id }, data, select: { slug: true } });
          return { slug: saved.slug };
        }
        const slug = await uniquePartnerSlug(tx, name);
        await tx.partner.create({ data: { ...data, slug } });
        return { slug };
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
  if ("error" in result) return fail(result.error);

  revalidatePath("/studio/partners");
  revalidatePath("/partners", "layout");
  revalidatePath(`/partners/${result.slug}`);
  revalidatePath("/members/perks");
  redirect(
    withParams("/studio/partners", {
      notice: data.published ? `${name} saved and published.` : `${name} saved. It stays hidden until you tick Published.`,
    })
  );
}
