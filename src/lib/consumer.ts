import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { randomAlias, randomAvatarSeed } from "@/lib/consumer-alias";

/**
 * Turns an account into a consumer account with its own profile. Never creates a
 * TrichologistProfile or a directory listing. Marketing stays off unless they opted in.
 */
export async function makeConsumer(
  userId: string,
  opts: { name?: string | null; marketing?: boolean } = {},
  now = new Date()
) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      accountType: "consumer",
      ...(opts.name ? { name: opts.name } : {}),
      // PECR: marketing is opt-in for the public, the opposite of the professional default.
      emailUpdates: !!opts.marketing,
    },
  });
  return ensureConsumerProfile(userId, { marketingConsentAt: opts.marketing ? now : null });
}

/** The consumer's profile, created with a fresh random alias if it doesn't exist yet. */
export async function ensureConsumerProfile(userId: string, extra: { marketingConsentAt?: Date | null } = {}) {
  const existing = await prisma.consumerProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      return await prisma.consumerProfile.create({
        data: { userId, alias: randomAlias(), avatarSeed: randomAvatarSeed(), ...extra },
      });
    } catch (error) {
      // Another account has this alias already: pick another.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const mine = await prisma.consumerProfile.findUnique({ where: { userId } });
        if (mine) return mine;
        continue;
      }
      throw error;
    }
  }
  throw new Error("Could not find a free alias");
}

/**
 * What other people see for a consumer: their first name if they chose it, otherwise the alias.
 * Staff screens show the real identity instead.
 */
export function consumerPublicName(
  profile: { displayMode: "name" | "alias"; alias: string },
  user: { name?: string | null }
) {
  const first = user.name?.trim().split(/\s+/)[0];
  return profile.displayMode === "name" && first ? first : profile.alias;
}
