"use server";

import { redirect } from "next/navigation";
import { isEmailList, leaveList, verifyUnsubscribeToken } from "@/lib/mail/send";

/** The confirm button on the unsubscribe page. The token is checked again here. */
export async function confirmUnsubscribe(formData: FormData) {
  const email = String(formData.get("e") ?? "").toLowerCase();
  const list = String(formData.get("l") ?? "");
  const token = String(formData.get("t") ?? "");
  if (!email || !isEmailList(list) || !verifyUnsubscribeToken(email, list, token)) {
    redirect("/email/unsubscribe");
  }
  await leaveList(email, list);
  redirect(`/email/unsubscribe?${new URLSearchParams({ e: email, l: list, t: token, done: "1" })}`);
}
