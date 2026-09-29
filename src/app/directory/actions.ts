"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Profession, ListingKind, ListingStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

const PROFESSIONS = new Set(["cosmetic", "clinical", "medical"]);

export async function submitFreeListing(formData: FormData) {
  const name = clean(formData.get("name"), 80);
  const email = clean(formData.get("email"), 120).toLowerCase();
  const profession = clean(formData.get("profession"), 32);
  const city = clean(formData.get("city"), 80);
  const specialization = clean(formData.get("specialization"), 120) || null;
  const bio = clean(formData.get("bio"), 800) || null;
  const website = clean(formData.get("website"), 200) || null;
  const phone = clean(formData.get("phone"), 40) || null;

  if (name.length < 2 || !email.includes("@") || city.length < 2) {
    redirect("/directory/list?error=missing");
  }
  if (!PROFESSIONS.has(profession)) {
    redirect("/directory/list?error=profession");
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
    },
  });

  redirect("/directory/list?submitted=1");
}

export async function reviewListing(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
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
    },
  });

  revalidatePath("/admin/listings");
  revalidatePath("/directory");
}

export async function publishMemberListing(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect("/login");
  }

  const name = clean(formData.get("name"), 80) || session.user.name || "Member";
  const profession = clean(formData.get("profession"), 32);
  const city = clean(formData.get("city"), 80);
  const specialization = clean(formData.get("specialization"), 120) || null;
  const bio = clean(formData.get("bio"), 800) || null;
  const website = clean(formData.get("website"), 200) || null;
  const phone = clean(formData.get("phone"), 40) || null;

  if (!PROFESSIONS.has(profession) && profession !== "brand") {
    redirect("/members/profile?error=profession");
  }
  if (city.length < 2) {
    redirect("/members/profile?error=city");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  await prisma.trichologistProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      bio,
      specialization,
      location: city,
      website,
      phone,
      profession: profession as Profession,
      listingStatus: ListingStatus.listed,
    },
    update: {
      bio,
      specialization,
      location: city,
      website,
      phone,
      profession: profession as Profession,
      listingStatus: ListingStatus.listed,
    },
  });

  const existing = await prisma.directoryListing.findFirst({
    where: { email: session.user.email.toLowerCase() },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    await prisma.directoryListing.update({
      where: { id: existing.id },
      data: {
        name,
        profession: profession as Profession,
        city,
        specialization,
        bio,
        website,
        phone,
        status: ListingStatus.listed,
        kind: ListingKind.member,
        userId: session.user.id,
        reviewedAt: new Date(),
      },
    });
  } else {
    await prisma.directoryListing.create({
      data: {
        name,
        email: session.user.email.toLowerCase(),
        profession: profession as Profession,
        city,
        specialization,
        bio,
        website,
        phone,
        status: ListingStatus.listed,
        kind: ListingKind.member,
        userId: session.user.id,
        reviewedAt: new Date(),
      },
    });
  }

  revalidatePath("/directory");
  revalidatePath("/members/profile");
  redirect("/directory");
}
