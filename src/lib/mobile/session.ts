import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

/** A phone stays signed in for 90 days after it was last used. */
export const MOBILE_SESSION_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Starts a session for a phone and returns the bearer token. The token itself is never stored. */
export async function createMobileSession(
  userId: string,
  device: { platform?: string | null; deviceName?: string | null } = {}
) {
  const token = `tcm_${randomBytes(32).toString("base64url")}`;
  await prisma.mobileSession.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      platform: device.platform === "ios" || device.platform === "android" ? device.platform : null,
      deviceName: device.deviceName?.slice(0, 80) || null,
      expiresAt: new Date(Date.now() + MOBILE_SESSION_DAYS * DAY_MS),
    },
  });
  return token;
}

/** The bearer token on this request, if there is one. */
export async function bearerToken() {
  try {
    const value = (await headers()).get("authorization");
    const match = value?.match(/^Bearer\s+(tcm_[A-Za-z0-9_-]{20,})$/);
    return match?.[1] ?? null;
  } catch {
    // Outside a request (cron, scripts) there are no headers.
    return null;
  }
}

/** The live mobile session for this request, with its id, or null. */
export async function currentMobileSession() {
  const token = await bearerToken();
  if (!token) return null;
  const row = await prisma.mobileSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: { select: { id: true, email: true, name: true, image: true, role: true, staffRole: true, accessStatus: true } },
    },
  });
  if (!row || row.revokedAt || row.expiresAt <= new Date()) return null;
  if (row.user.accessStatus === "banned") return null;

  // Slide the expiry forward, at most once an hour.
  if (Date.now() - row.lastUsedAt.getTime() > 60 * 60 * 1000) {
    prisma.mobileSession
      .update({
        where: { id: row.id },
        data: { lastUsedAt: new Date(), expiresAt: new Date(Date.now() + MOBILE_SESSION_DAYS * DAY_MS) },
      })
      .catch(() => {});
  }
  return row;
}

/**
 * A NextAuth-shaped session from the bearer token, so every server action and
 * helper that calls auth() works the same for the app as for the website.
 */
export async function mobileAuthSession(): Promise<Session | null> {
  const row = await currentMobileSession();
  if (!row) return null;
  return {
    user: {
      id: row.user.id,
      email: row.user.email,
      name: row.user.name,
      image: row.user.image,
      role: row.user.role,
      staffRole: row.user.staffRole,
    },
    expires: row.expiresAt.toISOString(),
  };
}

export async function revokeMobileSession(id: string) {
  await prisma.mobileSession.update({ where: { id }, data: { revokedAt: new Date(), pushToken: null } });
}
