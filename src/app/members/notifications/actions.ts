"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";

export async function markAllNotificationsRead() {
  const ctx = await getMemberContext();
  const userId = ctx.session?.user?.id;
  if (!userId) return;
  const { count } = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  // Refresh the shell's badge.
  if (count > 0) revalidatePath("/members", "layout");
}

/** Marks one notification read, e.g. when the member taps it in the app. */
export async function markNotificationRead(id: string) {
  const ctx = await getMemberContext();
  const userId = ctx.session?.user?.id;
  if (!userId || !id) return;
  const { count } = await prisma.notification.updateMany({
    where: { id: String(id).slice(0, 64), userId, readAt: null },
    data: { readAt: new Date() },
  });
  if (count > 0) revalidatePath("/members", "layout");
}
