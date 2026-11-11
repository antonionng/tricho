"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteConsumerAccount } from "@/lib/consumer-delete";
import { consumerSession } from "@/lib/consumer-session";
import { randomAlias, randomAvatarSeed } from "@/lib/consumer-alias";
import { cleanFirstName } from "@/lib/signup-details";
import { cleanConcerns } from "@/config/consumer";
import { consumerSettingsFromForm } from "@/lib/consumer-settings";

/**
 * Hub actions. Each one checks for a signed-in consumer against the database first,
 * so they can't be used by a professional account or by someone signed out.
 */
async function me() {
  const session = await consumerSession();
  if (!session) redirect("/login?next=/hub");
  return session;
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export type ProfileState = { ok: boolean; message: string } | null;

export async function updateProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const { userId } = await me();
  const name = cleanFirstName(form.get("firstName"));
  if (name === null) return { ok: false, message: "Please use letters only for your first name, or leave it empty." };
  const displayMode = form.get("displayMode") === "name" && name ? "name" : "alias";
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { name: name || null } }),
    prisma.consumerProfile.update({ where: { userId }, data: { displayMode } }),
  ]);
  revalidatePath("/hub", "layout");
  return {
    ok: true,
    message:
      displayMode === "name"
        ? "Your profile is saved. Other people will see your first name."
        : "Your profile is saved. Other people will see your alias, not your name.",
  };
}

/** A fresh random alias. Tries again if another account has it. */
export async function newAlias() {
  const { userId } = await me();
  for (let attempt = 0; attempt < 8; attempt++) {
    const alias = randomAlias();
    const taken = await prisma.consumerProfile.findUnique({ where: { alias }, select: { id: true } });
    if (taken) continue;
    await prisma.consumerProfile.update({ where: { userId }, data: { alias } });
    break;
  }
  revalidatePath("/hub", "layout");
}

export async function newAvatar() {
  const { userId } = await me();
  await prisma.consumerProfile.update({ where: { userId }, data: { avatarSeed: randomAvatarSeed() } });
  revalidatePath("/hub", "layout");
}

export type SettingsState = { ok: boolean; message: string } | null;

export async function updateSettings(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const { userId, profile } = await me();
  const s = consumerSettingsFromForm(form, profile);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { emailUpdates: s.marketing, emailActivity: s.activity } }),
    prisma.consumerProfile.update({
      where: { userId },
      data: {
        region: s.region,
        country: s.country,
        concerns: cleanConcerns(s.concerns),
        marketingConsentAt: s.marketingConsentAt,
        healthDataConsentAt: s.healthDataConsentAt,
      },
    }),
  ]);
  revalidatePath("/hub", "layout");
  return { ok: true, message: "Your settings are saved." };
}

export type DeleteState = { error: string } | null;

/**
 * Deletes the account and everything that belongs to it. The profile and saved
 * professionals go with it; enquiries the professionals already received stay with them,
 * unlinked from the account, and ones still held for a professional who has not joined are deleted.
 */
export async function deleteAccount(_prev: DeleteState, form: FormData): Promise<DeleteState> {
  const { userId, user } = await me();
  if (String(form.get("confirm") ?? "").trim().toLowerCase() !== "delete") {
    return { error: "Please type the word delete to confirm." };
  }
  await deleteConsumerAccount(userId, user.email);
  await signOut({ redirectTo: "/?account=deleted" });
  return null;
}

export async function unsaveListing(form: FormData) {
  const { userId } = await me();
  const listingId = String(form.get("listingId") ?? "");
  if (listingId) await prisma.savedListing.deleteMany({ where: { userId, listingId } });
  revalidatePath("/hub/saved");
}
