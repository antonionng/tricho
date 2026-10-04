import { redirect } from "next/navigation";
import { MemberShell } from "@/components/layout/MemberShell";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { isBusinessAccount } from "@/lib/subscription";
import { site } from "@/config/site";
import { longDate } from "@/components/members/format";
import { signOutAction } from "./profile/actions";
import { unreadReferrals } from "./referrals/_data";

export const metadata = { robots: { index: false, follow: false } };

export default async function MembersLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user) redirect("/login?next=/members");

  if (ctx.restricted && ctx.restricted.status !== "muted") {
    return <RestrictedNotice restriction={ctx.restricted} paying={ctx.membership.isActive && !ctx.membership.via} />;
  }

  const email = ctx.session.user.email?.toLowerCase();
  const me = ctx.session.user.id;
  const [unread, business, referrals, threads, account] = await Promise.all([
    prisma.notification.count({ where: { userId: me, readAt: null } }),
    email
      ? prisma.partner
          .findUnique({ where: { ownerEmail: email }, select: { id: true } })
          .then((page) => !!page || isBusinessAccount(email))
          .catch(() => false)
      : false,
    unreadReferrals(me),
    // The latest message from someone else in each conversation, to compare with when the member last read it.
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
    prisma.user.findUnique({ where: { id: me }, select: { image: true } }).catch(() => null),
  ]);
  const unreadMessages = threads.filter((t) => {
    const last = t.conversation.messages[0];
    return !!last && (!t.lastReadAt || last.createdAt > t.lastReadAt);
  }).length;

  return (
    <MemberShell
      name={ctx.session.user.name}
      image={account?.image}
      unread={unread}
      messages={unreadMessages} referrals={referrals} isAdmin={ctx.isAdmin || ctx.unlocked} business={business}>
      {children}
    </MemberShell>
  );
}

/** Shown in place of the member area while an account is suspended or closed. */
function RestrictedNotice({
  restriction,
  paying,
}: {
  restriction: { status: "suspended" | "banned" | "muted"; until: Date | null; reason: string | null };
  paying: boolean;
}) {
  const banned = restriction.status === "banned";
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center gap-5 px-4 py-16">
      <h1 className="display text-4xl sm:text-5xl">
        {banned ? "Your account has been closed." : "Your account is paused for now."}
      </h1>
      <p className="text-[15px] leading-relaxed text-ink-2">
        {banned
          ? "The Trichollective team has closed this account, so the member area and the community are no longer available to you."
          : restriction.until
            ? `The Trichollective team has paused this account until ${longDate(restriction.until)}. You can come back to the member area and the community from then.`
            : "The Trichollective team has paused this account until further notice. The member area and the community will be available again once the pause is lifted."}
      </p>
      {restriction.reason && (
        <p className="text-[15px] leading-relaxed text-ink-2">The reason the team gave is: {restriction.reason.trim().replace(/([^.!?])$/, "$1.")}</p>
      )}
      <p className="text-[15px] leading-relaxed text-ink-2">
        If you have a question about this, please write to{" "}
        <a href={`mailto:${site.contactEmail}`} className="text-ink underline underline-offset-4">
          {site.contactEmail}
        </a>{" "}
        and the team will reply personally.
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        {paying && (
          <form action="/api/billing/portal" method="POST">
            <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper">
              Manage billing in Stripe
            </button>
          </form>
        )}
        <form action={signOutAction}>
          <button type="submit" className="rounded-full border border-rule px-5 py-2.5 text-sm font-medium text-ink">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
