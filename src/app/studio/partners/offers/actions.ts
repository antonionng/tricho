"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { studioAction } from "../../_lib/guard";
import { audit } from "@/lib/staff";
import { newOfferToken, parseOfferForm } from "@/lib/partner-offers";
import { storeUpload } from "@/lib/storage";

const PAGE = "/studio/partners/offers";

function back(params: Record<string, string>): never {
  redirect(`${PAGE}?${new URLSearchParams(params)}`);
}

export async function createOfferAction(form: FormData) {
  const staff = await studioAction("partners.manage");
  const parsed = parseOfferForm((k) => form.get(k));
  if (!parsed.ok) back({ new: "1", notice: parsed.error, tone: "danger" });

  // An uploaded logo or cover photo takes the place of a pasted link.
  const upload = async (key: string, kind: "logo" | "cover") => {
    const file = form.get(key);
    const stored = file instanceof File && file.size ? await storeUpload({ kind, file, isPublic: true }) : null;
    if (stored && !stored.ok) back({ new: "1", notice: stored.message, tone: "danger" });
    return stored?.ok ? stored.file.url : null;
  };
  const logoUrl = (await upload("logoFile", "logo")) ?? parsed.value.logoUrl;
  const heroUrl = (await upload("heroFile", "cover")) ?? parsed.value.heroUrl;

  const offer = await prisma.partnerOffer.create({
    data: { ...parsed.value, logoUrl, heroUrl, token: newOfferToken(), createdBy: staff.email },
  });
  await audit(staff, {
    action: "partner_offer.create",
    targetType: "partnerOffer",
    targetId: offer.id,
    summary: `Created a Premium offer for ${offer.businessName}`,
  });
  revalidatePath(PAGE);
  back({ notice: `The onboarding link for ${offer.businessName} is ready to copy and send.` });
}

export async function markOfferPaidAction(form: FormData) {
  const staff = await studioAction("partners.manage");
  const id = String(form.get("id") ?? "");
  const offer = await prisma.partnerOffer.update({ where: { id }, data: { paidAt: new Date() } });
  await audit(staff, { action: "partner_offer.paid", targetType: "partnerOffer", targetId: id, summary: `Marked ${offer.businessName} as paid` });
  revalidatePath(PAGE);
  back({ notice: `${offer.businessName} is marked as paid.` });
}

export async function withdrawOfferAction(form: FormData) {
  const staff = await studioAction("partners.manage");
  const id = String(form.get("id") ?? "");
  const done = await prisma.partnerOffer.updateMany({ where: { id, status: "sent" }, data: { status: "withdrawn" } });
  if (done.count) {
    await audit(staff, { action: "partner_offer.withdraw", targetType: "partnerOffer", targetId: id, summary: "Withdrew a Premium offer" });
  }
  revalidatePath(PAGE);
  back({ notice: done.count ? "The link has been withdrawn and no longer works." : "Only an offer that has not been accepted can be withdrawn." });
}
