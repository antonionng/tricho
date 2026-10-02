"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/directory";
import { BUSINESS_SEATS, isBusinessAccount } from "@/lib/subscription";
import { LOGO_MAX_BYTES, LOGO_TYPES, PARTNER_CATEGORIES, partnerCapError } from "@/lib/partners";
import { deliver } from "@/lib/mail/send";
import { seatInviteEmail } from "@/lib/mail/templates/members";

const PAGE = "/members/business";

function s(form: FormData, key: string, max = 4000) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function back(params: Record<string, string>): never {
  redirect(`${PAGE}?${new URLSearchParams(params)}`);
}

/** Only http(s) links are stored, so nothing else can reach an href. */
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

/** Checks the file really is the image type it claims, from its first bytes. */
function sniffImage(bytes: Uint8Array): (typeof LOGO_TYPES)[number] | null {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return "image/webp";
  return null;
}

/** The signed-in business account holder, or a redirect. */
async function requireBusiness() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect(`/login?next=${PAGE}`);
  const page = await prisma.partner.findUnique({ where: { ownerEmail: email } });
  if (!page && !(await isBusinessAccount(email))) back({ error: "plan" });
  return { email, page, name: session?.user?.name ?? null };
}

async function uniqueSlug(tx: Prisma.TransactionClient, name: string) {
  const base = slugify(name).slice(0, 60) || "partner";
  for (let i = 1; i < 50; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    if (!(await tx.partner.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Saves the business page. It goes live as soon as it is saved, unless the Studio has taken it down. */
export async function saveBusinessPage(form: FormData) {
  const { email, page } = await requireBusiness();

  const name = s(form, "name", 120);
  const category = s(form, "category", 60);
  const blurb = s(form, "blurb", 4000);
  const websiteRaw = s(form, "website", 500);
  const contactEmail = s(form, "contactEmail", 160).toLowerCase();
  const perk = s(form, "perk", 2000) || null;
  const show = form.get("show") === "on";

  if (name.length < 2) back({ error: "name" });
  if (!(PARTNER_CATEGORIES as readonly string[]).includes(category)) back({ error: "category" });
  if (blurb.length < 20) back({ error: "blurb" });
  const website = cleanUrl(websiteRaw);
  if (websiteRaw && !website) back({ error: "website" });
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) back({ error: "contact" });

  let logo: { data: Uint8Array<ArrayBuffer>; contentType: string } | null = null;
  const file = form.get("logo");
  if (file instanceof File && file.size > 0) {
    if (file.size > LOGO_MAX_BYTES) back({ error: "logo-size" });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentType = sniffImage(bytes);
    if (!contentType) back({ error: "logo-type" });
    logo = { data: bytes, contentType };
  }
  const removeLogo = form.get("removeLogo") === "on";

  const data = {
    name,
    category,
    blurb,
    website,
    contactEmail: contactEmail || null,
    perk,
    published: show && !page?.hidden,
  };

  let result: { error: string } | { slug: string };
  try {
    result = await prisma.$transaction(
      async (tx) => {
        // Tier and founding status are set by the Studio; a new page starts as a Business partner.
        const tier = page?.tier ?? "business";
        const error = await partnerCapError(tx, { id: page?.id, tier, isFounding: page?.isFounding ?? false, ...data });
        if (error) return { error };

        const saved = page
          ? await tx.partner.update({ where: { id: page.id }, data, select: { id: true, slug: true } })
          : await tx.partner.create({
              data: { ...data, tier, ownerEmail: email, slug: await uniqueSlug(tx, name) },
              select: { id: true, slug: true },
            });

        if (logo) {
          await tx.partnerLogo.upsert({
            where: { partnerId: saved.id },
            create: { partnerId: saved.id, ...logo },
            update: logo,
          });
          await tx.partner.update({
            where: { id: saved.id },
            data: { logoUrl: `/api/partners/${saved.slug}/logo?v=${Date.now()}` },
          });
        } else if (removeLogo) {
          await tx.partnerLogo.deleteMany({ where: { partnerId: saved.id } });
          await tx.partner.update({ where: { id: saved.id }, data: { logoUrl: null } });
        }
        return { slug: saved.slug };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    console.error("[BUSINESS_PAGE_SAVE]", e);
    result = { error: "Something went wrong saving your page. Please try again." };
  }
  if ("error" in result) back({ error: "cap", message: result.error });

  revalidatePath(PAGE);
  revalidatePath("/partners", "layout");
  revalidatePath(`/partners/${result.slug}`);
  revalidatePath("/members/perks");
  revalidatePath("/studio/partners");
  back({ saved: data.published ? "live" : page?.hidden ? "hidden" : "draft" });
}

/** Gives a team member one of the business's Professional seats and emails them. */
export async function addSeat(form: FormData) {
  const { email: ownerEmail, page } = await requireBusiness();
  const email = s(form, "email", 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) back({ error: "seat-email" });
  if (email === ownerEmail) back({ error: "seat-self" });

  const used = await prisma.businessSeat.count({ where: { ownerEmail } });
  if (used >= BUSINESS_SEATS) back({ error: "seat-full" });

  try {
    await prisma.businessSeat.create({ data: { ownerEmail, email } });
  } catch {
    back({ error: "seat-exists" });
  }

  const invite = seatInviteEmail({ businessName: page?.name ?? ownerEmail, email });
  await deliver(email, invite.subject, invite.content, { tag: "business-seat" });

  revalidatePath(PAGE);
  back({ saved: "seat" });
}

export async function removeSeat(form: FormData) {
  const { email: ownerEmail } = await requireBusiness();
  const id = s(form, "id", 64);
  await prisma.businessSeat.deleteMany({ where: { id, ownerEmail } });
  revalidatePath(PAGE);
  back({ saved: "seat-removed" });
}
