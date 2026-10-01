import { redirect } from "next/navigation";
import { MemberShell } from "@/components/layout/MemberShell";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";

export const metadata = { robots: { index: false, follow: false } };

export default async function MembersLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user) redirect("/login?next=/members");

  const unread = await prisma.notification.count({
    where: { userId: ctx.session.user.id, readAt: null },
  });

  return (
    <MemberShell name={ctx.session.user.name} unread={unread} isAdmin={ctx.isAdmin || ctx.unlocked}>
      {children}
    </MemberShell>
  );
}
