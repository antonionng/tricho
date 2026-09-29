"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";

function clean(value: FormDataEntryValue | null, max: number) {
  const text = String(value ?? "").trim().slice(0, max);
  return text.length ? text : null;
}

export async function saveProfile(formData: FormData) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id || !ctx.allowed) {
    redirect("/join");
  }

  const name = clean(formData.get("name"), 80);
  const bio = clean(formData.get("bio"), 600);
  const specialization = clean(formData.get("specialization"), 80);
  const location = clean(formData.get("location"), 80);
  const website = clean(formData.get("website"), 200);
  const phone = clean(formData.get("phone"), 40);

  await prisma.user.update({
    where: { id: ctx.session.user.id },
    data: { name },
  });

  await prisma.trichologistProfile.upsert({
    where: { userId: ctx.session.user.id },
    create: {
      userId: ctx.session.user.id,
      bio,
      specialization,
      location,
      website,
      phone,
    },
    update: { bio, specialization, location, website, phone },
  });

  revalidatePath("/directory");
  revalidatePath("/members/profile");
  redirect("/directory");
}
