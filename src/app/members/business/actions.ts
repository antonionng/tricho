"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/directory";
import { BUSINESS_SEATS, isBusinessAccount } from "@/lib/subscription";
import { PARTNER_CATEGORIES, partnerCapError } from "@/lib/partners";
import { isOrganisationKind, ORGANISATION_SIZES } from "@/lib/crm-intake";
import { isSetupStep, readyToPublish, SOCIAL_NETWORKS, socialUrl, stepAfter, type SetupStepId } from "@/lib/business-profile";
import { applyCoverFromForm, applyLogoFromForm, ensureOrganisation } from "./_data";
import { applyPhotosFromForm } from "@/lib/photos";
import { partnerAllowance, safeHex, videoEmbedUrl } from "@/lib/showcase";
import { deliver } from "@/lib/mail/send";
import { seatInviteEmail } from "@/lib/mail/templates/members";

const PAGE = "/members/business";
const SETUP = "/members/business/setup";

function s(form: FormData, key: string, max = 4000) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function back(params: Record<string, string>, path: string = PAGE): never {
  redirect(`${path}?${new URLSearchParams(params)}`);
}

function setupBack(step: SetupStepId, params: Record<string, string> = {}): never {
  back({ step, ...params }, SETUP);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[+()\d\s.-]{6,40}$/;

/** The email and phone shown on the public partner page. Both optional; an error key when one is malformed. */
function publicContact(form: FormData): { error: string } | { publicEmail: string | null; publicPhone: string | null } {
  const publicEmail = s(form, "publicEmail", 160).toLowerCase();
  const publicPhone = s(form, "publicPhone", 40);
  if (publicEmail && !EMAIL.test(publicEmail)) return { error: "public-email" };
  if (publicPhone && !PHONE.test(publicPhone)) return { error: "public-phone" };
  return { publicEmail: publicEmail || null, publicPhone: publicPhone || null };
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

/** The signed-in business account holder, or a redirect. */
async function requireBusiness() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect(`/login?next=${PAGE}`);
  const page = await prisma.partner.findUnique({ where: { ownerEmail: email } });
  if (!page && !(await isBusinessAccount(email))) back({ error: "plan" });
  return { email, page, name: session?.user?.name ?? null, userId: session?.user?.id ?? null };
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
  const { email, page, userId } = await requireBusiness();

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
  const pub = publicContact(form);
  if ("error" in pub) back({ error: pub.error });

  const data = {
    name,
    category,
    blurb,
    website,
    contactEmail: contactEmail || null,
    publicEmail: pub.publicEmail,
    publicPhone: pub.publicPhone,
    perk,
    // A page goes live only while the plan is active (or it is already live), so a page taken
    // down when a subscription ended can't simply be republished.
    published: show && !page?.hidden && (!!page?.published || (await isBusinessAccount(email))),
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

        return { slug: saved.slug };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    console.error("[BUSINESS_PAGE_SAVE]", e);
    result = { error: "Something went wrong saving your page. Please try again." };
  }
  if ("error" in result) back({ error: "cap", message: result.error });

  // The logo and the CRM record are updated once the page itself is safely saved.
  const saved = await prisma.partner.findUniqueOrThrow({ where: { ownerEmail: email } });
  const org = await ensureOrganisation(saved, email);
  await prisma.organisation.update({
    where: { id: org.id },
    data: { name, category, website, description: blurb, ...(contactEmail ? { email: contactEmail } : {}) },
  });
  const logo = await applyLogoFromForm(form, saved, org.id, userId);
  if (!logo.ok) back({ error: "logo", message: logo.message });

  revalidatePath(PAGE);
  revalidatePath("/partners", "layout");
  revalidatePath(`/partners/${result.slug}`);
  revalidatePath("/members/perks");
  revalidatePath("/studio/partners");
  back({ saved: data.published ? "live" : page?.hidden ? "hidden" : "draft" });
}

/** Gives a team member one of the business's Professional seats and emails them. */
/** Seat forms appear on the portal page and in setup; they return to wherever they were sent from. */
function seatReturn(form: FormData) {
  return form.get("returnTo") === "setup" ? `${SETUP}` : PAGE;
}
function seatBack(form: FormData, params: Record<string, string>): never {
  const path = seatReturn(form);
  back(path === SETUP ? { step: "team", ...params } : params, path);
}

export async function addSeat(form: FormData) {
  const { email: ownerEmail, page } = await requireBusiness();
  const email = s(form, "email", 160).toLowerCase();
  if (!EMAIL.test(email)) seatBack(form, { error: "seat-email" });
  if (email === ownerEmail) seatBack(form, { error: "seat-self" });

  const used = await prisma.businessSeat.count({ where: { ownerEmail } });
  if (used >= BUSINESS_SEATS) seatBack(form, { error: "seat-full" });

  try {
    await prisma.businessSeat.create({ data: { ownerEmail, email } });
  } catch {
    seatBack(form, { error: "seat-exists" });
  }

  const invite = seatInviteEmail({ businessName: page?.name ?? ownerEmail, email });
  await deliver(email, invite.subject, invite.content, { tag: "business-seat" });

  revalidatePath(PAGE);
  revalidatePath(SETUP);
  seatBack(form, { saved: "seat" });
}

export async function removeSeat(form: FormData) {
  const { email: ownerEmail } = await requireBusiness();
  const id = s(form, "id", 64);
  await prisma.businessSeat.deleteMany({ where: { id, ownerEmail } });
  revalidatePath(PAGE);
  revalidatePath(SETUP);
  seatBack(form, { saved: "seat-removed" });
}

function revalidateBusiness(slug?: string) {
  revalidatePath(PAGE);
  revalidatePath(SETUP);
  revalidatePath("/partners", "layout");
  if (slug) revalidatePath(`/partners/${slug}`);
  revalidatePath("/members/perks");
  revalidatePath("/studio/partners");
}

/**
 * Saves one step of the guided setup to the partner page and the CRM record, then moves on to the
 * next step. Nothing is published here; the last step does that.
 */
export async function saveSetupStep(form: FormData) {
  const { email, page, userId } = await requireBusiness();
  const stepRaw = s(form, "step", 20);
  if (!isSetupStep(stepRaw)) setupBack("details");
  const step: SetupStepId = stepRaw;
  const fail = (error: string, message?: string): never => setupBack(step, message ? { error, message } : { error });
  const done = (): never => {
    revalidateBusiness(page?.slug);
    setupBack(stepAfter(step), { saved: step });
  };

  if (step === "details") {
    const name = s(form, "name", 120);
    const kindRaw = s(form, "kind", 20);
    const category = s(form, "category", 60);
    const blurb = s(form, "blurb", 4000);
    const websiteRaw = s(form, "website", 500);
    if (name.length < 2) fail("name");
    if (!(PARTNER_CATEGORIES as readonly string[]).includes(category)) fail("category");
    if (blurb.length < 20) fail("blurb");
    const website = cleanUrl(websiteRaw);
    if (websiteRaw && !website) fail("website");
    const kind = isOrganisationKind(kindRaw) ? kindRaw : "brand";

    let saved = page;
    try {
      saved = page
        ? await prisma.partner.update({ where: { id: page.id }, data: { name, category, blurb, website } })
        : await prisma.$transaction(async (tx) =>
            tx.partner.create({
              data: { name, category, blurb, website, tier: "business", published: false, ownerEmail: email, contactEmail: email, slug: await uniqueSlug(tx, name) },
            })
          );
    } catch (e) {
      console.error("[BUSINESS_SETUP_DETAILS]", e);
      fail("save");
    }
    const org = await ensureOrganisation(saved!, email);
    await prisma.organisation.update({ where: { id: org.id }, data: { name, kind, category, website, description: blurb } });
    revalidateBusiness(saved!.slug);
    setupBack(stepAfter(step), { saved: step });
  }

  // Every other step builds on a page that already exists.
  if (!page) setupBack("details", { error: "details-first" });
  const org = await ensureOrganisation(page, email);

  const allow = partnerAllowance(page);

  if (step === "logo") {
    const logo = await applyLogoFromForm(form, page, org.id, userId);
    if (!logo.ok) fail("logo", logo.message);
    const cover = await applyCoverFromForm(form, page, userId);
    if (!cover.ok) fail("logo", cover.message);
    const colourRaw = s(form, "accentColor", 7);
    if (colourRaw && safeHex(colourRaw, "") === "") fail("colour");
    await prisma.partner.update({ where: { id: page.id }, data: { accentColor: colourRaw ? safeHex(colourRaw) : null } });
    done();
  }

  if (step === "story") {
    const highlights = Array.from({ length: allow.highlights }, (_, i) => ({
      value: s(form, `hValue${i}`, 12),
      label: s(form, `hLabel${i}`, 80),
    })).filter((h) => h.value && h.label);
    const ctaLabel = s(form, "ctaLabel", 40);
    const ctaRaw = s(form, "ctaUrl", 500);
    const ctaUrl = ctaRaw.startsWith("#") ? (/^#(section-\d|photos|contact)$/.test(ctaRaw) ? ctaRaw : null) : cleanUrl(ctaRaw);
    if (ctaRaw && !ctaUrl) fail("cta");
    await prisma.partner.update({
      where: { id: page.id },
      data: {
        tagline: s(form, "tagline", 200) || null,
        story: s(form, "story", 6000) || null,
        highlights: highlights.length ? highlights : Prisma.DbNull,
        ctaLabel: ctaLabel && ctaUrl ? ctaLabel : null,
        ctaUrl: ctaLabel && ctaUrl ? ctaUrl : null,
      },
    });
    done();
  }

  if (step === "offerings") {
    const offerings = Array.from({ length: allow.offerings }, (_, i) => ({
      title: s(form, `oTitle${i}`, 80),
      body: s(form, `oBody${i}`, 400),
    })).filter((o) => o.title);
    await prisma.partner.update({ where: { id: page.id }, data: { offerings: offerings.length ? offerings : Prisma.DbNull } });
    done();
  }

  if (step === "photos") {
    const result = await applyPhotosFromForm(form, { partnerId: page.id }, allow.photos, userId);
    if (!result.ok) fail("photo", result.message);
    // Adding, moving or removing a photo stays on this step; Save and continue moves on.
    if (form.get("intent") !== "continue") {
      revalidateBusiness(page.slug);
      setupBack("photos", { saved: "photo" });
    }
    done();
  }

  if (step === "extras") {
    const videoRaw = s(form, "videoUrl", 500);
    if (videoRaw && allow.video && !videoEmbedUrl(videoRaw)) fail("video");
    const sections = Array.from({ length: allow.sections }, (_, i) => {
      const ctaRaw = s(form, `sCtaUrl${i}`, 500);
      const ctaUrl = cleanUrl(ctaRaw);
      const ctaLabel = s(form, `sCtaLabel${i}`, 40);
      return {
        eyebrow: s(form, `sEyebrow${i}`, 40) || undefined,
        title: s(form, `sTitle${i}`, 140),
        body: s(form, `sBody${i}`, 1200) || undefined,
        steps: s(form, `sSteps${i}`, 2000).split(/\n+/).map((x) => x.trim()).filter(Boolean).slice(0, 6),
        ctaLabel: ctaLabel && ctaUrl ? ctaLabel : undefined,
        ctaUrl: ctaLabel && ctaUrl ? ctaUrl : undefined,
      };
    }).filter((x) => x.title);
    await prisma.partner.update({
      where: { id: page.id },
      data: {
        videoUrl: allow.video ? videoRaw || null : page.videoUrl,
        sections: sections.length ? sections : Prisma.DbNull,
      },
    });
    done();
  }

  if (step === "contact") {
    const contactEmail = s(form, "contactEmail", 160).toLowerCase();
    const phone = s(form, "phone", 40);
    if (contactEmail && !EMAIL.test(contactEmail)) fail("contact");
    if (phone && !PHONE.test(phone)) fail("phone");
    const pub = publicContact(form);
    if ("error" in pub) return fail(pub.error);
    const socials: Record<string, string> = {};
    for (const n of SOCIAL_NETWORKS) {
      const raw = s(form, n.id, 300);
      if (!raw) continue;
      const url = socialUrl(n.id, raw);
      if (!url) fail("social", `Please check your ${n.label} link, or leave it empty.`);
      socials[n.id] = url!;
    }
    await prisma.partner.update({
      where: { id: page.id },
      data: { contactEmail: contactEmail || null, publicEmail: pub.publicEmail, publicPhone: pub.publicPhone },
    });
    await prisma.organisation.update({
      where: { id: org.id },
      data: { email: contactEmail || org.email, phone: phone || null, socials },
    });
    done();
  }

  if (step === "address") {
    const size = s(form, "size", 10);
    const vatNumber = s(form, "vatNumber", 20).toUpperCase().replace(/\s+/g, "");
    const companyNumber = s(form, "companyNumber", 20).toUpperCase().replace(/\s+/g, "");
    if (vatNumber && !/^[A-Z0-9]{5,16}$/.test(vatNumber)) fail("vat");
    if (companyNumber && !/^[A-Z0-9]{4,12}$/.test(companyNumber)) fail("company-number");
    await prisma.organisation.update({
      where: { id: org.id },
      data: {
        addressLine1: s(form, "addressLine1", 200) || null,
        addressLine2: s(form, "addressLine2", 200) || null,
        city: s(form, "city", 120) || null,
        region: s(form, "region", 120) || null,
        postcode: s(form, "postcode", 20).toUpperCase() || null,
        country: s(form, "country", 80) || null,
        companyNumber: companyNumber || null,
        vatNumber: vatNumber || null,
        size: (ORGANISATION_SIZES as readonly string[]).includes(size) ? size : null,
      },
    });
    done();
  }

  if (step === "perk") {
    await prisma.partner.update({ where: { id: page.id }, data: { perk: s(form, "perk", 2000) || null } });
    done();
  }

  // Team seats are added one at a time with addSeat, so Continue simply moves on.
  done();
}

/** The last setup step: the page goes live, unless the Studio has paused it. */
export async function publishBusinessPage() {
  const { email, page } = await requireBusiness();
  if (!page) setupBack("details", { error: "details-first" });
  if (!readyToPublish(page)) setupBack("details", { error: "not-ready" });
  if (page.hidden) setupBack("publish", { error: "paused" });
  if (!page.published && !(await isBusinessAccount(email))) setupBack("publish", { error: "plan" });
  await prisma.partner.update({ where: { id: page.id }, data: { published: true } });
  const org = await ensureOrganisation(page, email);
  if (org.stage !== "customer" && org.stage !== "lost") {
    await prisma.organisation.update({ where: { id: org.id }, data: { stage: "customer" } });
  }
  revalidateBusiness(page.slug);
  back({ saved: "published" });
}
