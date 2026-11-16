"use server";

import { getMemberContext } from "@/lib/member";
import { submitAdventClaim } from "@/lib/advent-claims";

export type ClaimState = { ok?: boolean; error?: string };

export async function claimAdventGift(_: ClaimState, form: FormData): Promise<ClaimState> {
  const ctx = await getMemberContext();
  const user = ctx.session?.user;
  if (!user?.id || !user.email) return { error: "Please sign in to claim your gift." };
  const day = Number(form.get("day"));
  const fields = ["colleague", "colleagueEmail", "business", "note"]
    .map((k) => [k, String(form.get(k) ?? "").trim()] as const)
    .filter(([, v]) => v);
  const note = fields.map(([k, v]) => `${k}: ${v.slice(0, 300)}`).join("\n");
  const res = await submitAdventClaim({ userId: user.id, name: user.name ?? user.email, email: user.email, day, note });
  return res.ok ? { ok: true } : { error: res.error };
}
