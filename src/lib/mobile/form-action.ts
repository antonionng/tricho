import "server-only";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getURLFromRedirectError } from "next/dist/client/components/redirect";
import { formData, json } from "./api";
import { redirectOutcome } from "./redirect-outcome";

/**
 * The website's form actions report their result by redirecting, e.g. to
 * /members/profile?error=name#about. This calls one and turns the redirect into
 * JSON: a 400 with the page's own message for an ?error=, otherwise
 * { ok: true, redirect, params, message } so the app can follow the same path
 * and show the page's confirmation for ?saved=.
 */
export async function runFormAction(
  fn: () => Promise<unknown>,
  errors: Record<string, string>,
  messages: Record<string, string> = {}
) {
  const { redirect: url } = await captureRedirect(fn);
  if (!url) return json({ ok: true });
  const outcome = redirectOutcome(url, errors);
  if (outcome.error) return json({ ok: false, error: outcome.error, code: outcome.code }, 400);
  const saved = outcome.params.saved;
  return json({ ok: true, redirect: url, params: outcome.params, message: saved ? (messages[saved] ?? null) : null });
}

/**
 * Calls a server action and reports where it would have sent the browser, for
 * actions whose outcome is a redirect (?saved=… or ?error=…) rather than a value.
 */
export async function captureRedirect<T>(fn: () => Promise<T>): Promise<{ redirect: string | null; result: T | null }> {
  try {
    return { redirect: null, result: await fn() };
  } catch (error) {
    if (isRedirectError(error)) return { redirect: getURLFromRedirectError(error), result: null };
    throw error;
  }
}

/** The request body as FormData: multipart and urlencoded bodies as sent, JSON as fields. */
export async function requestForm(req: Request): Promise<FormData> {
  const type = req.headers.get("content-type") ?? "";
  if (/multipart\/form-data|application\/x-www-form-urlencoded/i.test(type)) return req.formData();
  try {
    const value = await req.json();
    return formData(value && typeof value === "object" ? value : {});
  } catch {
    return new FormData();
  }
}
