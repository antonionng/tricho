import { json, page, withMember } from "@/lib/mobile/api";
import { prisma } from "@/lib/prisma";
import { listNotifications } from "@/lib/notifications";

/** Replies, messages and follows, newest first, with ?cursor=<last id> for more. */
export const GET = withMember(
  async (req, ctx) => {
    const me = ctx.session.user.id;
    const { cursor, limit } = page(req, 30);
    const [{ items, nextCursor }, unread] = await Promise.all([
      listNotifications(me, { take: limit, cursor }),
      prisma.notification.count({ where: { userId: me, readAt: null } }),
    ]);
    return json({
      notifications: items.map((n) => ({ id: n.id, kind: n.kind, title: n.title, href: n.href, createdAt: n.createdAt, readAt: n.readAt })),
      nextCursor,
      unread,
    });
  },
  { members: true }
);
