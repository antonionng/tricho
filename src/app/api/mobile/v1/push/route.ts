import { currentMobileSession } from "@/lib/mobile/session";
import { isExpoPushToken } from "@/lib/mobile/push";
import { body, fail, json } from "@/lib/mobile/api";
import { prisma } from "@/lib/prisma";

/** Saves this phone's push token, or clears it when the member turns notifications off. */
export async function POST(req: Request) {
  const session = await currentMobileSession();
  if (!session) return fail(401, "Please sign in again.");
  const { token } = await body<{ token: string | null }>(req);
  if (token !== null && !isExpoPushToken(token)) return fail(400, "That isn't a push token.");
  // A token belongs to one phone, so it leaves any older session it was on.
  if (token) await prisma.mobileSession.updateMany({ where: { pushToken: token, id: { not: session.id } }, data: { pushToken: null } });
  await prisma.mobileSession.update({ where: { id: session.id }, data: { pushToken: token } });
  return json({ ok: true });
}
