import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * The member's notifications, newest first. Pass `cursor` (the id of the last
 * one already shown) for the next page.
 */
export async function listNotifications(userId: string, { take = 60, cursor }: { take?: number; cursor?: string } = {}) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const more = rows.length > take;
  const items = more ? rows.slice(0, take) : rows;
  return { items, nextCursor: more ? items[items.length - 1].id : null };
}
