import { json, withMember } from "@/lib/mobile/api";
import { prisma } from "@/lib/prisma";
import { isBusinessAccount } from "@/lib/subscription";
import { unreadReferrals } from "@/app/members/referrals/_data";

/** Who is signed in, what they can use, and the counts for the tab bar. Mirrors the members layout. */
export const GET = withMember(async (_req, ctx) => {
  const me = ctx.session.user.id;
  const email = ctx.session.user.email?.toLowerCase();
  const [user, unread, business, referrals, threads] = await Promise.all([
    prisma.user.findUnique({
      where: { id: me },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isFounding: true,
        storeSource: true,
        storeCancelAtPeriodEnd: true,
        cancelAtPeriodEnd: true,
        stripeSubscriptionId: true,
        chapter: { select: { slug: true, city: true, country: true } },
      },
    }),
    prisma.notification.count({ where: { userId: me, readAt: null } }),
    email
      ? prisma.partner
          .findUnique({ where: { ownerEmail: email }, select: { id: true } })
          .then((page) => !!page || isBusinessAccount(email))
          .catch(() => false)
      : false,
    unreadReferrals(me).catch(() => 0),
    prisma.conversationMember
      .findMany({
        where: { userId: me },
        orderBy: { conversation: { updatedAt: "desc" } },
        take: 50,
        select: {
          lastReadAt: true,
          conversation: {
            select: { messages: { where: { senderId: { not: me } }, orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } } },
          },
        },
      })
      .catch(() => []),
  ]);
  const unreadMessages = threads.filter((t) => {
    const last = t.conversation.messages[0];
    return !!last && (!t.lastReadAt || last.createdAt > t.lastReadAt);
  }).length;

  return json({
    user,
    access: {
      member: ctx.allowed,
      professional: ctx.professional,
      consultation: ctx.consultation,
      admin: ctx.isAdmin,
      business,
      onboarded: ctx.onboarded,
      muted: ctx.restricted?.status === "muted" ? ctx.restricted.until : null,
      profession: ctx.profession,
      plan: ctx.plan,
    },
    membership: {
      ...ctx.membership,
      // Where to manage it: the store it was bought in, or the website for Stripe.
      managedIn: user?.storeSource && !user.stripeSubscriptionId ? user.storeSource : ctx.membership.via ? "team" : user?.stripeSubscriptionId ? "web" : null,
    },
    counts: { notifications: unread, messages: unreadMessages, referrals },
  });
});
