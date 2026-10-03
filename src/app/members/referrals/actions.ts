"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";
import { notify } from "@/lib/community";
import { deliver } from "@/lib/mail/send";
import { referralAnsweredEmail, referralReceivedEmail } from "@/lib/mail/templates/members";
import {
  cleanNote,
  nextReferralStatus,
  referralBlocker,
  referralFindings,
  validateReferral,
  type Finding,
} from "@/lib/client-referrals";
import { loadRecipient } from "./_data";

export type ReferralFormState = {
  error?: string;
  findings?: Finding[];
  /** True when only warnings were found and the sender must confirm before sending. */
  needsConfirm?: boolean;
  values?: { summary: string; reason: string; clientContext: string };
} | null;

/** A generous daily limit, so the feature cannot be used to spam colleagues. */
const DAILY_LIMIT = 20;

export async function createReferral(_prev: ReferralFormState, formData: FormData): Promise<ReferralFormState> {
  const ctx = await getMemberContext();
  const me = ctx.session?.user?.id;
  if (!me) redirect("/login?next=/members/referrals");

  const values = {
    summary: String(formData.get("summary") ?? "").slice(0, 4000),
    reason: String(formData.get("reason") ?? "").slice(0, 600),
    clientContext: String(formData.get("clientContext") ?? "").slice(0, 300),
  };
  const toId = String(formData.get("to") ?? "").slice(0, 64);

  const recipient = await loadRecipient(toId);
  const blocker = ctx.allowed ? referralBlocker({ id: me, professional: ctx.professional }, recipient) : "Referrals are part of membership.";
  if (blocker || !recipient) return { error: blocker ?? "We could not find this member, so the referral was not sent.", values };

  const valid = validateReferral(values);
  if (!valid.ok) return { error: valid.error, values };

  const findings = referralFindings(valid.data);
  if (findings.some((f) => f.severity === "block")) {
    return {
      error: "Please remove the client's contact details before sending. Your colleague can be introduced to the client directly once they accept.",
      findings,
      values,
    };
  }
  if (findings.length && formData.get("confirm") !== "yes") {
    return { findings, needsConfirm: true, values };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await prisma.referral.count({ where: { fromId: me, createdAt: { gte: since } } });
  if (recent >= DAILY_LIMIT) {
    return { error: `You can send up to ${DAILY_LIMIT} referrals a day. Please try again tomorrow, or write to the team if you need more.`, values };
  }

  const referral = await prisma.referral.create({
    data: { fromId: me, toId: recipient.id, ...valid.data },
    select: { id: true },
  });

  const href = `/members/referrals/${referral.id}`;
  const senderName = ctx.session?.user?.name || "A colleague";
  await notify({ userId: recipient.id, kind: "referral", title: `${senderName} referred a client to you`, href });
  if (recipient.email) {
    const to = recipient.email;
    const email = referralReceivedEmail({ recipientName: recipient.name, senderName, referralId: referral.id });
    after(() => deliver(to, email.subject, email.content, { list: "activity", tag: "activity" }).then(() => undefined));
  }

  revalidatePath("/members/referrals");
  redirect(`${href}?sent=1`);
}

export async function respondToReferral(formData: FormData) {
  const ctx = await getMemberContext();
  const me = ctx.session?.user?.id;
  if (!me) redirect("/login?next=/members/referrals");
  const id = String(formData.get("id") ?? "").slice(0, 64);
  const decision = formData.get("decision") === "accept" ? "accept" : "decline";
  const href = `/members/referrals/${id}`;

  const referral = await prisma.referral.findUnique({
    where: { id },
    select: { id: true, toId: true, status: true, from: { select: { id: true, name: true, email: true } } },
  });
  if (!referral || (referral.toId !== me && referral.from.id !== me)) redirect("/members/referrals");
  if (!ctx.allowed) redirect(href);

  const next = nextReferralStatus(referral.status, decision, referral.toId === me);
  if (!next.ok) redirect(`${href}?error=${encodeURIComponent(next.error)}`);

  // Only move it on if nobody has answered in the meantime.
  const updated = await prisma.referral.updateMany({
    where: { id, toId: me, status: { in: ["sent", "seen"] } },
    data: { status: next.status, responseNote: cleanNote(formData.get("note")), respondedAt: new Date() },
  });
  if (!updated.count) redirect(`${href}?error=${encodeURIComponent("You have already responded to this referral.")}`);

  const accepted = next.status === "accepted";
  const responderName = ctx.session?.user?.name || "Your colleague";
  await notify({
    userId: referral.from.id,
    kind: "referral",
    title: accepted ? `${responderName} accepted your referral` : `${responderName} declined your referral`,
    href,
  });
  if (referral.from.email) {
    const to = referral.from.email;
    const email = referralAnsweredEmail({ recipientName: referral.from.name, responderName, accepted, referralId: id });
    after(() => deliver(to, email.subject, email.content, { list: "activity", tag: "activity" }).then(() => undefined));
  }

  revalidatePath("/members/referrals");
  revalidatePath(href);
  redirect(`${href}?answered=1`);
}
