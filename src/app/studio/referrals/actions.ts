"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/staff";
import { formatMoney } from "@/lib/mail/templates/billing";
import { creditReward, voidReward } from "@/lib/referrals";

function back(params: Record<string, string>, status?: string) {
  const q = new URLSearchParams({ ...(status ? { status } : {}), ...params }).toString();
  return `/studio/referrals${q ? `?${q}` : ""}`;
}

function s(form: FormData, key: string, max = 200) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

async function rewardFor(id: string) {
  return id
    ? prisma.referralReward.findUnique({
        where: { id },
        include: { referrer: { select: { name: true, email: true } } },
      })
    : null;
}

/** Withdraw a reward. A credited one is reversed in Stripe first. */
export async function voidRewardAction(form: FormData) {
  const staff = await requirePermission("referrals.manage");
  const id = s(form, "id", 64);
  const status = s(form, "filter", 20) || undefined;
  const reason = s(form, "reason", 300);
  if (!reason) redirect(back({ notice: "Please give a reason for withdrawing the reward.", tone: "danger" }, status));
  const reward = await rewardFor(id);
  if (!reward) redirect(back({ notice: "That reward no longer exists.", tone: "danger" }, status));
  if (reward.status === "void") redirect(back({ notice: "That reward has already been withdrawn." }, status));

  let reversed: string | null = null;
  try {
    ({ reversed } = await voidReward(id, reason));
  } catch (error) {
    console.error("[STUDIO_REFERRAL_VOID]", error);
    const message = error instanceof Error ? error.message : "Stripe did not accept the reversal.";
    redirect(back({ notice: `The reward was not withdrawn. ${message}`, tone: "danger" }, status));
  }

  const who = reward.referrer.name ?? reward.referrer.email ?? "the referrer";
  const value = reward.amount > 0 ? formatMoney(reward.amount, reward.currency) : null;
  await audit(staff, {
    action: "referral.void",
    targetType: "referralReward",
    targetId: id,
    summary: reversed
      ? `Withdrew the referral reward for ${who} and reversed ${value} of credit. Reason: ${reason}`
      : `Withdrew the referral reward for ${who}. Reason: ${reason}`,
    before: { status: reward.status, stripeBalanceTxnId: reward.stripeBalanceTxnId },
    after: { status: "void", reversalTxnId: reversed },
  });
  revalidatePath("/studio/referrals");
  redirect(back({ notice: reversed ? `The reward was withdrawn and ${value} was added back to ${who}'s bill.` : "The reward was withdrawn." }, status));
}

/** Try again to credit a banked reward, for example once the referrer has started paying. */
export async function creditRewardAction(form: FormData) {
  const staff = await requirePermission("referrals.manage");
  const id = s(form, "id", 64);
  const status = s(form, "filter", 20) || undefined;
  const reward = await rewardFor(id);
  if (!reward) redirect(back({ notice: "That reward no longer exists.", tone: "danger" }, status));

  let result: Awaited<ReturnType<typeof creditReward>>;
  try {
    result = await creditReward(id);
  } catch (error) {
    console.error("[STUDIO_REFERRAL_CREDIT]", error);
    redirect(back({ notice: "Stripe did not accept the credit, so the reward is still kept for later.", tone: "danger" }, status));
  }

  const who = reward.referrer.name ?? reward.referrer.email ?? "the referrer";
  if (result.status !== "credited") {
    redirect(back({ notice: `The reward was not credited. ${result.reason}`, tone: "danger" }, status));
  }
  const value = formatMoney(result.amount, result.currency);
  await audit(staff, {
    action: "referral.credit",
    targetType: "referralReward",
    targetId: id,
    summary: `Credited ${value} to ${who}'s bill as a referral reward.`,
    before: { status: reward.status },
    after: { status: "credited", amount: result.amount, currency: result.currency },
  });
  revalidatePath("/studio/referrals");
  redirect(back({ notice: `${value} was credited to ${who}'s bill.` }, status));
}
