import "server-only";
import { fail, json } from "@/lib/mobile/api";
import { captureRedirect } from "@/lib/mobile/form-action";
import { outcomeFromRedirect } from "@/lib/mobile/redirect-outcome";
import { errorText, SAVED_MESSAGES } from "@/app/members/business/messages";

/**
 * Runs one of the business portal's actions, which end by redirecting with ?saved=… or ?error=…,
 * and answers with the sentence the website would show.
 */
export async function businessAction(fn: () => Promise<unknown>) {
  const { redirect, result } = await captureRedirect(fn);
  if (!redirect) {
    const error = result && typeof result === "object" && "error" in result ? (result as { error?: string }).error : undefined;
    return error ? fail(400, error) : json({ ok: true, message: null });
  }
  const outcome = outcomeFromRedirect(redirect, { saved: SAVED_MESSAGES, error: (code, message) => errorText(code, message) });
  return outcome.ok ? json({ ok: true, saved: outcome.saved, message: outcome.message }) : fail(400, outcome.error);
}

/** The signed-in account's email, which owns the business page and its seats. */
export const ownerEmail = (ctx: { session: { user: { email?: string | null } } }) => ctx.session.user.email?.toLowerCase() ?? null;

/** The fields the job form sends, and nothing else. */
export function jobFields(b: Partial<Record<string, unknown>>) {
  const keys = ["title", "employment", "workplace", "location", "country", "pay", "summary", "description", "applyEmail", "applyUrl"];
  return Object.fromEntries(keys.map((k) => [k, typeof b[k] === "string" ? b[k] : ""]));
}
