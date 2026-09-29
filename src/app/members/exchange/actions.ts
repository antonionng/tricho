"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";

const TYPES = ["professional_service", "brand_tool"] as const;

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export async function proposeExchangeItem(formData: FormData) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id || !ctx.allowed) redirect("/join");

  const title = clean(formData.get("title"), 120);
  const description = clean(formData.get("description"), 2000);
  const link = clean(formData.get("link"), 300);
  const type = clean(formData.get("type"), 40);

  if (title.length < 2 || description.length < 2) return;
  if (!TYPES.includes(type as (typeof TYPES)[number])) return;

  await prisma.exchangeItem.create({
    data: {
      title,
      description,
      link: link || null,
      type,
      businessId: ctx.session.user.id,
    },
  });

  revalidatePath("/members/exchange");
}
