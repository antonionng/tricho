import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isConsumer } from "@/lib/account-type";
import { ensureConsumerProfile } from "@/lib/consumer";
import { HUB_PATH } from "@/config/consumer";

/**
 * The signed-in consumer, checked against the database, or null. For hub actions and
 * routes: the middleware skips /api, and a server action can be posted from any page.
 */
export async function consumerSession() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !isConsumer(session.user)) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, accountType: true, accessStatus: true, emailUpdates: true, emailActivity: true, createdAt: true },
  });
  if (!user || !isConsumer(user) || user.accessStatus === "banned") return null;
  const profile = await ensureConsumerProfile(userId);
  return { userId, user, profile };
}

export type ConsumerSession = NonNullable<Awaited<ReturnType<typeof consumerSession>>>;

/** For hub pages: the consumer, or a redirect to where this person belongs. */
export async function requireConsumer(): Promise<ConsumerSession> {
  const me = await consumerSession();
  if (me) return me;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?next=${HUB_PATH}`);
  redirect("/members");
}
