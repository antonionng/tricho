"use server";

import { auth } from "@/auth";
import { deliver } from "@/lib/mail/send";
import { sampleById } from "@/lib/mail/samples";
import { studioAction } from "../_lib/guard";

export type TestSendState = { ok: boolean; message: string } | null;

/** Sends one sample to the signed-in team member, so they can see it in a real inbox. */
export async function sendTestEmailAction(_prev: TestSendState, formData: FormData): Promise<TestSendState> {
  await studioAction("emails.test");
  const session = await auth();
  const to = session?.user?.email;
  const sample = sampleById(String(formData.get("id") ?? ""));
  if (!to || !sample) return { ok: false, message: "That email couldn't be found." };
  const sent = await deliver(to, `[Test] ${sample.subject}`, sample.content, { tag: "test" });
  return sent
    ? { ok: true, message: `Sent to ${to}.` }
    : { ok: false, message: "It didn't send. Check the Resend key in Vercel." };
}
