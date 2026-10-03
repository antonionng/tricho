"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Profession, ListingKind, ListingStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FREE_LISTING_DAYS } from "@/config/subscriptions";
import { hasFullProfile, uniqueListingSlug } from "@/lib/directory";
import { LISTING_COUNTRIES } from "@/content/chapters";
import { getMemberContext } from "@/lib/member";
import { alertOwners, deliver } from "@/lib/mail/send";
import { listingReceivedEmail, newListingAlert } from "@/lib/mail/templates/directory";
import { asCreateData, profileDataFromForm, syncListingFromProfile } from "@/lib/profile";

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

const PROFESSIONS = new Set(["cosmetic", "clinical", "medical"]);

function parsePhotoUrl(value: FormDataEntryValue | null) {
  const url = clean(value, 500);
  if (!url) return null;
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** Only redirect back into the member profile; anything else keeps the old destination. */
function safeNext(value: FormDataEntryValue | null) {
  const next = clean(value, 200);
  return next.startsWith("/members/profile") ? next : null;
}

/** Thank the submitter and tell the owners a listing is waiting. Never throws. */
async function notifyListingSubmitted(
  l: { name: string; email: string; profession: string; city: string; country: string | null; source: string | null },
  via: string
) {
  const { subject, content } = listingReceivedEmail(l);
  await Promise.all([
    deliver(l.email, subject, content, { tag: "listing-received" }),
    alertOwners(newListingAlert({ ...l, via })),
  ]);
}

export async function submitFreeListing(formData: FormData) {
  const name = clean(formData.get("name"), 80);
  const email = clean(formData.get("email"), 120).toLowerCase();
  const profession = clean(formData.get("profession"), 32);
  const city = clean(formData.get("city"), 80);
  const specialization = clean(formData.get("specialization"), 120) || null;
  const bio = clean(formData.get("bio"), 800) || null;
  const website = clean(formData.get("website"), 200) || null;
  const phone = clean(formData.get("phone"), 40) || null;
  const countryRaw = clean(formData.get("country"), 40);
  const country = (LISTING_COUNTRIES as readonly string[]).includes(countryRaw) ? countryRaw : "Ireland";
  const source = clean(formData.get("source"), 40).toLowerCase().replace(/[^a-z0-9_-]/g, "") || null;

  // An invitation link carries a private token. When it matches a held
  // invitation, that row becomes the listing instead of a new one being made.
  const inviteToken = clean(formData.get("invite"), 64);
  const invited = inviteToken
    ? await prisma.directoryListing.findFirst({
        where: { inviteToken, status: ListingStatus.invited },
        select: { id: true, slug: true },
      })
    : null;
  const fail = (code: string) =>
    redirect(`/directory/list?error=${code}${invited ? `&invite=${encodeURIComponent(inviteToken)}` : ""}`);

  if (name.length < 2 || !email.includes("@") || city.length < 2) {
    fail("missing");
  }
  if (!PROFESSIONS.has(profession)) {
    fail("profession");
  }

  if (invited) {
    await prisma.directoryListing.update({
      where: { id: invited.id },
      data: {
        ...(invited.slug ? {} : { slug: await uniqueListingSlug(name, city) }),
        name,
        email,
        profession: profession as Profession,
        city,
        specialization,
        bio,
        website,
        phone,
        country,
        status: ListingStatus.pending,
        inviteToken: null,
      },
    });
    await notifyListingSubmitted({ name, email, profession, city, country, source }, "an invitation link");
    redirect("/directory/list?submitted=1");
  }

  const existing = await prisma.directoryListing.findFirst({
    where: {
      email,
      status: { in: [ListingStatus.pending, ListingStatus.listed] },
    },
  });
  if (existing) {
    redirect("/directory/list?error=exists");
  }

  await prisma.directoryListing.create({
    data: {
      slug: await uniqueListingSlug(name, city),
      name,
      email,
      profession: profession as Profession,
      city,
      specialization,
      bio,
      website,
      phone,
      status: ListingStatus.pending,
      kind: ListingKind.listed,
      source,
      country,
    },
  });

  await notifyListingSubmitted({ name, email, profession, city, country, source }, "the public listing form");
  redirect("/directory/list?submitted=1");
}

export async function reviewListing(formData: FormData) {
  const { getStaff } = await import("@/lib/staff");
  if (!(await getStaff())?.perms.has("listings.review")) {
    redirect("/login");
  }

  const id = clean(formData.get("id"), 64);
  const decision = clean(formData.get("decision"), 16);
  if (!id || (decision !== "approve" && decision !== "reject")) return;

  await prisma.directoryListing.update({
    where: { id },
    data: {
      status: decision === "approve" ? ListingStatus.listed : ListingStatus.rejected,
      reviewedAt: new Date(),
      ...(decision === "approve"
        ? { freeUntil: new Date(Date.now() + FREE_LISTING_DAYS * 24 * 60 * 60 * 1000) }
        : {}),
    },
  });

  revalidatePath("/studio/listings");
  revalidatePath("/directory");
}

/**
 * Publish (or update) the signed-in member's directory listing. The member's
 * profile is the source of truth: any profile fields posted with this form are
 * saved to the profile first, then the listing is created if needed and filled
 * from the profile by syncListingFromProfile.
 */
export async function publishMemberListing(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect("/login");
  }
  const userId = session.user.id;
  const email = session.user.email.toLowerCase();
  const next = safeNext(formData.get("next"));
  const back = (code: string) => redirect(`/members/profile?error=${code}#listing`);

  // Paid members own a full profile. Free accounts get it during their 90-day trial and can
  // then edit only the basic fields; their listing is never marked as claimed.
  const ctx = await getMemberContext();
  const paid = ctx.professional;

  const postedName = clean(formData.get("name"), 80);
  if (postedName.length >= 2) {
    await prisma.user.update({ where: { id: userId }, data: { name: postedName } });
  }
  const postedProfession = clean(formData.get("profession"), 32);
  const data = profileDataFromForm(formData);
  if (PROFESSIONS.has(postedProfession) || postedProfession === "brand") {
    data.profession = postedProfession as Profession;
  }
  const profile = await prisma.trichologistProfile.upsert({
    where: { userId },
    create: { userId, ...asCreateData(data), listingStatus: paid ? ListingStatus.listed : ListingStatus.pending },
    update: data,
    select: { profession: true, city: true, location: true, country: true },
  });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  const name = user?.name?.trim() || session.user.name || "Member";
  const profession = profile.profession;
  const city = profile.city || profile.location || "";

  if (!profession || (!PROFESSIONS.has(profession) && profession !== "brand")) back("profession");
  if (city.length < 2) back("city");

  const existing = await prisma.directoryListing.findFirst({
    where: { OR: [{ userId }, { email }] },
    orderBy: { createdAt: "desc" },
  });
  const inTrial = !!existing && existing.status === ListingStatus.listed && hasFullProfile(existing);
  const canEditFull = paid || inTrial;

  if (existing) {
    await prisma.directoryListing.update({
      where: { id: existing.id },
      data: {
        ...(existing.slug ? {} : { slug: await uniqueListingSlug(name, city) }),
        userId,
        ...(paid
          ? { status: ListingStatus.listed, kind: ListingKind.member, reviewedAt: new Date(), inviteToken: null }
          : existing.status === ListingStatus.invited
            ? { status: ListingStatus.pending, inviteToken: null }
            : {}),
      },
    });
  } else {
    await prisma.directoryListing.create({
      data: {
        slug: await uniqueListingSlug(name, city),
        email,
        name,
        profession: profession as Profession,
        city,
        ...(profile.country ? { country: profile.country } : {}),
        userId,
        // Free listings are checked by a person first; approval starts the 90-day trial.
        status: paid ? ListingStatus.listed : ListingStatus.pending,
        kind: paid ? ListingKind.member : ListingKind.listed,
        ...(paid ? { reviewedAt: new Date() } : {}),
      },
    });
  }

  const listingId = await syncListingFromProfile(userId, { full: canEditFull });
  // A photo pasted as a link (older forms) is still accepted for full profiles.
  if (listingId && canEditFull && formData.has("photoUrl")) {
    const photoUrl = parsePhotoUrl(formData.get("photoUrl"));
    if (photoUrl) await prisma.directoryListing.update({ where: { id: listingId }, data: { photoUrl } });
  }

  // A free account's listing has just joined the review queue: tell the owners.
  const nowPending = !paid && (!existing || existing.status === ListingStatus.invited);
  if (nowPending) {
    await alertOwners(
      newListingAlert({
        name,
        email,
        profession: profession as string,
        city,
        country: existing?.country ?? profile.country ?? null,
        source: existing?.source ?? null,
        via: "a member's profile page",
      })
    );
  }

  revalidatePath("/directory");
  revalidatePath("/directory/p/[slug]", "page");
  revalidatePath("/members/profile");
  redirect(next ?? "/directory");
}
