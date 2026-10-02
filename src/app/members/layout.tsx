import { redirect } from "next/navigation";
import { MemberShell } from "@/components/layout/MemberShell";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { isBusinessAccount } from "@/lib/subscription";

export const metadata = { robots: { index: false, follow: false } };

export default async function MembersLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user) redirect("/login?next=/members");

  const email = ctx.session.user.email?.toLowerCase();
  const [unread, business] = await Promise.all([
    prisma.notification.count({ where: { userId: ctx.session.user.id, readAt: null } }),
    email
      ? prisma.partner
          .findUnique({ where: { ownerEmail: email }, select: { id: true } })
          .then((page) => !!page || isBusinessAccount(email))
          .catch(() => false)
      : false,
  ]);

  return (
    <MemberShell name={ctx.session.user.name} unread={unread} isAdmin={ctx.isAdmin || ctx.unlocked} business={business}>
      {children}
    </MemberShell>
  );
}
