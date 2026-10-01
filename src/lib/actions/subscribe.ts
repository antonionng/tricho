"use server";

import { prisma } from "@/lib/prisma";

export type SubscribeState = { ok: boolean; message: string } | null;

/** Newsletter and lead-magnet sign-ups from anywhere on the marketing site. */
export async function subscribe(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 160);
  const source = String(formData.get("source") ?? "site").slice(0, 40);
  const utmSource = String(formData.get("utm_source") ?? "").slice(0, 80) || null;
  const utmCampaign = String(formData.get("utm_campaign") ?? "").slice(0, 80) || null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Please check your email address." };
  }

  await prisma.subscriber.upsert({
    where: { email },
    update: { unsubscribedAt: null },
    create: { email, source, utmSource, utmCampaign },
  });

  return {
    ok: true,
    message:
      source === "starter-guide"
        ? "Thank you. The guide is on its way to your inbox."
        : "Thank you. The next newsletter will come straight to you.",
  };
}
