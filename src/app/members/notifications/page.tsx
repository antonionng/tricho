import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, MessageCircle, UserPlus, MessagesSquare } from "lucide-react";
import { Paywall } from "@/components/members/Paywall";
import { EmptyState, MemberPage, PageHeader } from "@/components/members/MemberPage";
import { MarkAllRead } from "@/components/members/MarkAllRead";
import { timeAgo } from "@/components/members/format";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "Notifications" };

const ICONS: Record<string, typeof Bell> = {
  comment: MessagesSquare,
  message: MessageCircle,
  follow: UserPlus,
};

export default async function NotificationsPage() {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/notifications");
  if (!ctx.allowed) return <Paywall title="Notifications" body="Replies, messages and follows appear here once you're a member." />;

  const items = await prisma.notification.findMany({
    where: { userId: ctx.session.user.id },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  const unread = items.some((n) => !n.readAt);
  // Marking read refreshes this page; keep just-read items highlighted for this visit.
  const cutoff = new Date().getTime() - 60_000;
  const isNew = (readAt: Date | null) => !readAt || readAt.getTime() > cutoff;

  return (
    <MemberPage size="narrow">
      <MarkAllRead enabled={unread} />
      <PageHeader label="Notifications" title="What's new" lede="Replies to your posts, new messages and new followers." />
      {items.length === 0 ? (
        <EmptyState
          title="Nothing yet"
          body="When someone replies to your post, follows you or sends a message, you'll see it here."
        />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-rule bg-card">
          {items.map((n) => {
            const Icon = ICONS[n.kind] ?? Bell;
            const inner = (
              <>
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", isNew(n.readAt) ? "bg-ink text-paper" : "bg-paper-2")}>
                  <Icon className="h-[18px] w-[18px] stroke-[1.6]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[15px] leading-snug", isNew(n.readAt) && "font-medium")}>{n.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                </span>
                {isNew(n.readAt) && <span className="h-2 w-2 shrink-0 rounded-full bg-ink" aria-label="New" />}
              </>
            );
            return (
              <li key={n.id} className="border-b border-rule last:border-0">
                {n.href ? (
                  <Link href={n.href} className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-paper-2">
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-4">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </MemberPage>
  );
}
