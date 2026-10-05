import "server-only";
import { Prisma, type Partner } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile, storeUpload } from "@/lib/storage";
import { applyPhotosFromForm, coverFromForm } from "@/lib/photos";
import { partnerAllowance, safeHex, videoEmbedUrl } from "@/lib/showcase";

/**
 * Saving a showcase page, shared by the business portal and the Studio, so a page built by our
 * team and a page built by its owner go through exactly the same checks and package limits.
 * Everything is stored in the database, and uploads go to storage, so no page needs a code change.
 */

/** The parts of a page that make it a showcase, edited one step at a time. */
export const SHOWCASE_STEPS = [
  { id: "logo", label: "Logo, cover and colour" },
  { id: "story", label: "Story" },
  { id: "offerings", label: "Products and services" },
  { id: "photos", label: "Photos" },
  { id: "extras", label: "Video and features" },
] as const;
export type ShowcaseStepId = (typeof SHOWCASE_STEPS)[number]["id"];

export function isShowcaseStep(value: unknown): value is ShowcaseStepId {
  return SHOWCASE_STEPS.some((s) => s.id === value);
}

export type SaveResult = { ok: true } | { ok: false; error: string; message?: string };
export type LogoChange = { ok: true } | { ok: false; message: string };

function s(form: FormData, key: string, max = 4000) {
  return String(form.get(key) ?? "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, max);
}

/** Only http(s) links are stored, so nothing else can reach an href. */
export function cleanUrl(value: string) {
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

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

/** Saves one showcase step. The package limits always come from the page itself. */
export async function saveShowcaseStep(
  step: ShowcaseStepId,
  form: FormData,
  page: Partner,
  orgId: string | null,
  uploaderId: string | null
): Promise<SaveResult> {
  const allow = partnerAllowance(page);

  if (step === "logo") {
    const logo = await applyLogoFromForm(form, page, orgId, uploaderId);
    if (!logo.ok) return { ok: false, error: "logo", message: logo.message };
    const cover = await applyCoverFromForm(form, page, uploaderId);
    if (!cover.ok) return { ok: false, error: "logo", message: cover.message };
    const colourRaw = s(form, "accentColor", 7);
    if (colourRaw && !/^#[0-9a-fA-F]{6}$/.test(colourRaw)) return { ok: false, error: "colour" };
    if (allow.colour) await prisma.partner.update({ where: { id: page.id }, data: { accentColor: colourRaw ? safeHex(colourRaw) : null } });
    return { ok: true };
  }

  if (step === "story") {
    const highlights = Array.from({ length: allow.highlights }, (_, i) => ({
      value: s(form, `hValue${i}`, 12),
      label: s(form, `hLabel${i}`, 80),
    })).filter((h) => h.value && h.label);
    const ctaLabel = s(form, "ctaLabel", 40);
    const ctaRaw = s(form, "ctaUrl", 500);
    const ctaUrl = ctaRaw.startsWith("#") ? (/^#(section-\d|photos|contact)$/.test(ctaRaw) ? ctaRaw : null) : cleanUrl(ctaRaw);
    if (ctaRaw && !ctaUrl) return { ok: false, error: "cta" };
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
    return { ok: true };
  }

  if (step === "offerings") {
    const offerings = Array.from({ length: allow.offerings }, (_, i) => ({
      title: s(form, `oTitle${i}`, 80),
      body: s(form, `oBody${i}`, 400),
    })).filter((o) => o.title);
    await prisma.partner.update({ where: { id: page.id }, data: { offerings: offerings.length ? offerings : Prisma.DbNull } });
    return { ok: true };
  }

  if (step === "photos") {
    const result = await applyPhotosFromForm(form, { partnerId: page.id }, allow.photos, uploaderId);
    return result.ok ? result : { ok: false, error: "photo", message: result.message };
  }

  // extras
  const videoRaw = s(form, "videoUrl", 500);
  if (videoRaw && allow.video && !videoEmbedUrl(videoRaw)) return { ok: false, error: "video" };
  const sections = Array.from({ length: allow.sections }, (_, i) => {
    const ctaUrl = cleanUrl(s(form, `sCtaUrl${i}`, 500));
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
  return { ok: true };
}
