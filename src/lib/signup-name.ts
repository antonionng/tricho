import { prisma } from "@/lib/prisma";

/**
 * The name typed on /signup, kept until the email link is opened and the account is
 * created. It is held on the server against the email, not in a cookie, because the
 * link is often opened in a different browser (a mail app's) from the one used to sign up.
 * It reuses the verification token table under its own identifier, so nothing new is
 * needed in the database and Auth.js never mistakes it for a sign-in token.
 */
const PREFIX = "signup-name:";
const KEEP_FOR_MS = 7 * 24 * 60 * 60 * 1000;

export async function rememberSignupName(email: string, name: string) {
  const identifier = PREFIX + email;
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({ data: { identifier, token: name, expires: new Date(Date.now() + KEEP_FOR_MS) } }),
  ]);
}

/** The remembered name for this email, removed as it is read. Null if none is left. */
export async function takeSignupName(email: string) {
  const identifier = PREFIX + email.toLowerCase();
  const rows = await prisma.verificationToken.findMany({ where: { identifier }, orderBy: { expires: "desc" }, take: 1 });
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  const row = rows[0];
  return row && row.expires > new Date() ? row.token : null;
}
