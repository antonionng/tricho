import { cleanEmail } from "@/lib/signin-email";
import { issueLoginCode } from "@/lib/mobile/login-code";
import { body, fail, json } from "@/lib/mobile/api";
import { deliver } from "@/lib/mail/send";
import { signInCodeEmail } from "@/lib/mail/templates/leads";
import { prisma } from "@/lib/prisma";

/** Emails a six-digit sign-in code. The answer is the same whether or not the email has an account. */
export async function POST(req: Request) {
  const email = cleanEmail((await body<{ email: string }>(req)).email);
  if (!email) return fail(400, "Please enter a valid email address.");

  const existing = await prisma.user.findUnique({ where: { email }, select: { accessStatus: true } });
  if (existing?.accessStatus === "banned") return json({ ok: true });

  const code = await issueLoginCode(email);
  if (!code) return fail(429, "You've asked for several codes. Please wait a few minutes and try again.");

  const { subject, content } = signInCodeEmail({ code });
  try {
    await deliver(email, subject, content, { tag: "sign-in-code" });
  } catch (error) {
    console.error("[mobile-code]", error);
    return fail(502, "We couldn't send the email just now. Please try again.");
  }
  return json({ ok: true });
}
