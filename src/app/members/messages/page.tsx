import Link from "next/link";
import { redirect } from "next/navigation";
import { Paywall } from "@/components/members/Paywall";
import { Avatar } from "@/components/members/Avatar";
import { EmptyState, MemberPage, PageHeader } from "@/components/members/MemberPage";
import { timeAgo } from "@/components/members/format";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/messages");
  if (!ctx.allowed) return <Paywall title="Messages" body="Direct messages between members are part of membership." />;
  const me = ctx.session.user.id;

  const memberships = await prisma.conversationMember.findMany({
    where: { userId: me },
    orderBy: { conversation: { updatedAt: "desc" } },
    take: 50,
    select: {
      lastReadAt: true,
      conversation: {
        select: {
          id: true,
          updatedAt: true,
          members: { where: { userId: { not: me } }, select: { user: { select: { id: true, name: true } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true, senderId: true } },
        },
      },
    },
  });

  const threads = memberships.map(({ lastReadAt, conversation: c }) => {
    const last = c.messages[0];
    const unread = !!last && last.senderId !== me && (!lastReadAt || last.createdAt > lastReadAt);
    const others = c.members.map((m) => m.user);
    return { id: c.id, others, last, unread, at: last?.createdAt ?? c.updatedAt };
  });

  return (
    <MemberPage size="narrow">
      <PageHeader label="Messages" title="Messages" lede="Private conversations with other members." />
      {threads.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          body="Open anyone's profile and choose Message to start one. A short hello after a gathering goes a long way."
          action={
            <Link href="/members/people" className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-paper">
              Find members
            </Link>
          }
        />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-rule bg-card">
          {threads.map((t) => {
            const title = t.others.map((o) => o.name || "Member").join(", ") || "Just you";
            return (
              <li key={t.id} className="border-b border-rule last:border-0">
                <Link href={`/members/messages/${t.id}`} className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-paper-2">
                  <Avatar name={t.others[0]?.name} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={cn("truncate", t.unread ? "font-semibold" : "font-medium")}>{title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(t.at)}</span>
                    </span>
                    <span className={cn("mt-0.5 block truncate text-sm", t.unread ? "text-ink" : "text-muted-foreground")}>
                      {t.last ? `${t.last.senderId === me ? "You: " : ""}${t.last.body}` : "No messages yet"}
                    </span>
                  </span>
                  {t.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-ink" aria-label="Unread" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </MemberPage>
  );
}
