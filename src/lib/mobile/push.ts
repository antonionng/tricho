import { prisma } from "@/lib/prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export const isExpoPushToken = (t: unknown): t is string =>
  typeof t === "string" && /^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]+\]$/.test(t);

/**
 * Sends a notification to every phone a member is signed in on. Never throws:
 * a push is a courtesy on top of the bell in the app.
 */
export async function pushToUser(userId: string, message: { title: string; body?: string; href?: string | null }) {
  try {
    const sessions = await prisma.mobileSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() }, pushToken: { not: null } },
      select: { pushToken: true },
    });
    const tokens = [...new Set(sessions.map((s) => s.pushToken!).filter(isExpoPushToken))];
    if (!tokens.length) return;

    const badge = await prisma.notification.count({ where: { userId, readAt: null } }).catch(() => undefined);
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...(process.env.EXPO_ACCESS_TOKEN ? { authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
      },
      body: JSON.stringify(
        tokens.map((to) => ({
          to,
          title: "Trichollective",
          body: message.title,
          sound: "default",
          badge,
          data: { href: message.href ?? null },
        }))
      ),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      console.error("[push] expo responded", res.status);
      return;
    }
    // Forget tokens for phones that have uninstalled the app.
    const json = (await res.json().catch(() => null)) as { data?: { status: string; details?: { error?: string } }[] } | null;
    const dead = tokens.filter((_, i) => json?.data?.[i]?.details?.error === "DeviceNotRegistered");
    if (dead.length) await prisma.mobileSession.updateMany({ where: { pushToken: { in: dead } }, data: { pushToken: null } });
  } catch (error) {
    console.error("[push] failed", error);
  }
}
