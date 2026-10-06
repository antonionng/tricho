import "server-only";
import { prisma } from "@/lib/prisma";
import { getMembershipByEmail, isProfessionalPlan } from "@/lib/subscription";
import { nextReferralStatus, type Recipient } from "@/lib/client-referrals";

/** A member who might receive a referral, with what decides whether they can. */
export async function loadRecipient(id: string): Promise<(Recipient & { name: string | null; email: string | null }) | null> {
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      role: true,
      staffRole: true,
      accessStatus: true,
      listings: { where: { status: "listed" }, select: { acceptsReferrals: true } },
    },
  });
  if (!user) return null;
  const membership = await getMembershipByEmail(user.email).catch(() => null);
  const plan = (membership?.via ? membership.tierId : user.plan ?? membership?.tierId) ?? null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    active: user.accessStatus === "active",
    professional: isProfessionalPlan(plan, user.role) || !!user.staffRole,
    listings: user.listings.map((l) => l.acceptsReferrals),
  };
}

/** New referrals waiting for this member, for the badge in the menu. */
export function unreadReferrals(userId: string) {
  return prisma.referral.count({ where: { toId: userId, status: "sent" } }).catch(() => 0);
}

const person = { select: { id: true, name: true, image: true } } as const;

export type ReferralTab = "received" | "sent";

/** One tab of a member's referrals, with the counts shown on the tabs. Shared by the page and the app. */
export async function listReferrals(userId: string, tab: ReferralTab) {
  const [rows, receivedCount, sentCount, waiting] = await Promise.all([
    prisma.referral.findMany({
      where: tab === "sent" ? { fromId: userId } : { toId: userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, status: true, reason: true, clientContext: true, createdAt: true, respondedAt: true, from: person, to: person },
    }),
    prisma.referral.count({ where: { toId: userId } }),
    prisma.referral.count({ where: { fromId: userId } }),
    prisma.referral.count({ where: { toId: userId, status: "sent" } }),
  ]);
  return { rows, receivedCount, sentCount, waiting };
}

/**
 * A referral as one of the two members involved sees it, or null for anyone else.
 * Opening it as the recipient marks it read, and its notifications are cleared.
 */
export async function openReferral(id: string, userId: string) {
  const referral = await prisma.referral.findUnique({
    where: { id },
    select: {
      id: true,
      fromId: true,
      toId: true,
      summary: true,
      reason: true,
      clientContext: true,
      status: true,
      responseNote: true,
      respondedAt: true,
      createdAt: true,
      from: person,
      to: person,
    },
  });
  // Only the two members involved can open a referral.
  if (!referral || (referral.fromId !== userId && referral.toId !== userId)) return null;

  const isRecipient = referral.toId === userId;
  let status = referral.status;
  const opened = nextReferralStatus(status, "open", isRecipient);
  if (opened.ok && opened.changed) {
    await prisma.referral.updateMany({ where: { id, status: "sent" }, data: { status: opened.status } });
    status = opened.status;
  }
  if (isRecipient || status === "accepted" || status === "declined") {
    await prisma.notification
      .updateMany({ where: { userId, href: `/members/referrals/${id}`, readAt: null }, data: { readAt: new Date() } })
      .catch(() => null);
  }

  const other = isRecipient ? referral.from : referral.to;
  const canRespond = isRecipient && (status === "sent" || status === "seen");
  return { referral: { ...referral, status }, isRecipient, other, canRespond };
}
