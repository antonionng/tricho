import "server-only";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const CODE_MINUTES = 10;
/** Wrong guesses allowed on one code before it stops working. */
export const MAX_ATTEMPTS = 5;
/** Codes one email can ask for in 15 minutes. */
export const MAX_CODES_PER_WINDOW = 5;

const pepper = () => process.env.AUTH_SECRET ?? "";
export const hashCode = (email: string, code: string) =>
  createHash("sha256").update(`${pepper()}:${email}:${code}`).digest("hex");

export function generateCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Saves a new code for this email and returns it, or null when it has asked too often. */
export async function issueLoginCode(email: string): Promise<string | null> {
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const recent = await prisma.loginCode.count({ where: { email, createdAt: { gte: since } } });
  if (recent >= MAX_CODES_PER_WINDOW) return null;
  const code = generateCode();
  await prisma.loginCode.create({
    data: { email, codeHash: hashCode(email, code), expiresAt: new Date(Date.now() + CODE_MINUTES * 60 * 1000) },
  });
  return code;
}

/** True when the code matches this email's latest unused code. The code then can't be used again. */
export async function consumeLoginCode(email: string, code: string): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;
  const row = await prisma.loginCode.findFirst({
    where: { email, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!row || row.attempts >= MAX_ATTEMPTS) return false;

  const expected = Buffer.from(row.codeHash, "hex");
  const given = Buffer.from(hashCode(email, code), "hex");
  if (!timingSafeEqual(expected, given)) {
    await prisma.loginCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    return false;
  }
  // Only one request can claim it.
  const claimed = await prisma.loginCode.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
  return claimed.count === 1;
}
