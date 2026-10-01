import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Paywall } from "@/components/members/Paywall";
import { Avatar } from "@/components/members/Avatar";
import { MemberPage } from "@/components/members/MemberPage";
import { AutoRefresh } from "@/components/members/AutoRefresh";
import { MessageComposer } from "@/components/members/MessageComposer";
import { shortDate, timeOfDay } from "@/components/members/format";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "Messages" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/messages");
  if (!ctx.allowed) return <Paywall title="Messages" body="Direct messages between members are part of membership." />;
  const me = ctx.session.user.id;

  const { id } = await params;
  const convo = await prisma.conversation.findFirst({
    where: { id, members: { some: { userId: me } } },
    select: {
      id: true,
      members: { select: { userId: true, user: { select: { id: true, name: true } } } },
      messages: { orderBy: { createdAt: "asc" }, take: 200, select: { id: true, body: true, createdAt: true, senderId: true } },
    },
  });
  if (!convo) notFound();

  // Opening the thread marks it read. Runs again on each poll, which is what we want.
  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId: id, userId: me } },
    data: { lastReadAt: new Date() },
  });

  const others = convo.members.filter((m) => m.userId !== me).map((m) => m.user);
  const other = others[0];
  const thread = convo.messages.map((m, i) => {
    const day = shortDate(m.createdAt);
    return { ...m, day, showDay: i === 0 || day !== shortDate(convo.messages[i - 1].createdAt) };
  });

  return (
    <MemberPage size="narrow" className="flex min-h-[calc(100svh-3.5rem-6rem)] flex-col lg:min-h-[calc(100svh-3.5rem)]">
      <AutoRefresh seconds={10} />
      <header className="sticky top-14 z-10 -mx-4 flex items-center gap-3 border-b border-rule bg-paper/95 px-4 pb-3 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        <Link href="/members/messages" aria-label="All messages" className="-ml-2 grid h-10 w-10 place-items-center rounded-full hover:bg-paper-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {other ? (
          <Link href={`/members/people/${other.id}`} className="flex min-w-0 items-center gap-3">
            <Avatar name={other.name} size="sm" />
            <span className="truncate font-medium">{others.map((o) => o.name || "Member").join(", ")}</span>
          </Link>
        ) : (
          <span className="font-medium">Conversation</span>
        )}
      </header>

      <ol className="flex flex-1 flex-col gap-1.5 py-6" aria-live="polite">
        {convo.messages.length === 0 && (
          <li className="py-10 text-center text-sm text-muted-foreground">
            Say hello. Messages are private between you{other?.name ? ` and ${other.name.split(" ")[0]}` : ""}.
          </li>
        )}
        {thread.map((m) => {
          const mine = m.senderId === me;
          return (
            <li key={m.id} className="flex flex-col">
              {m.showDay && <span className="my-3 self-center text-xs text-muted-foreground">{m.day}</span>}
              <div
                className={cn(
                  "max-w-[85%] rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed sm:max-w-[75%]",
                  mine ? "self-end rounded-br-lg bg-ink text-paper" : "self-start rounded-bl-lg border border-rule bg-card text-ink"
                )}
              >
                <p className="whitespace-pre-line break-words">{m.body}</p>
                <p className={cn("mt-1 text-[11px]", mine ? "text-paper/60" : "text-muted-foreground")}>{timeOfDay(m.createdAt)}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] bg-paper pb-2 pt-2 lg:bottom-0 lg:pb-6">
        <MessageComposer conversationId={convo.id} />
      </div>
    </MemberPage>
  );
}
