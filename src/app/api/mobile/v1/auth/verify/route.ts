import { cleanEmail } from "@/lib/signin-email";
import { consumeLoginCode } from "@/lib/mobile/login-code";
import { createMobileSession } from "@/lib/mobile/session";
import { body, fail, json } from "@/lib/mobile/api";
import { alertOwners, deliver } from "@/lib/mail/send";
import { newAccountAlert, welcomeFreeAccountEmail } from "@/lib/mail/templates/leads";
import { prisma } from "@/lib/prisma";

/**
 * Swaps a correct code for a bearer token. Someone new gets a free account,
 * exactly as signing in with an email link does on the website.
 */
export async function POST(req: Request) {
  const input = await body<{ email: string; code: string; platform: string; deviceName: string }>(req);
  const email = cleanEmail(input.email);
  const code = String(input.code ?? "").replace(/\s/g, "");
  if (!email || !code) return fail(400, "Please enter the six-digit code from the email.");

  if (!(await consumeLoginCode(email, code))) {
    return fail(401, "That code isn't right or has expired. Please check the email or ask for a new code.");
  }

  let user = await prisma.user.findUnique({ where: { email } });
  let created = false;
  if (!user) {
    user = await prisma.user.create({ data: { email, name: email.split("@")[0], emailVerified: new Date(), signupSource: "app" } });
    created = true;
  } else if (!user.emailVerified) {
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
  }
  if (user.accessStatus === "banned") return fail(403, "This account has been closed.");

  if (created) {
    const { subject, content } = welcomeFreeAccountEmail({ name: null });
    await Promise.all([
      deliver(email, subject, content, { tag: "welcome-free" }),
      alertOwners(newAccountAlert({ name: null, email })),
    ]).catch((error) => console.error("[mobile-welcome]", error));
  }

  const token = await createMobileSession(user.id, {
    platform: typeof input.platform === "string" ? input.platform : null,
    deviceName: typeof input.deviceName === "string" ? input.deviceName : null,
  });
  return json({ token, created });
}
