/**
 * Many of the website's form actions finish by redirecting back to the page with
 * ?saved=… or ?error=…, which the page turns into a sentence. These read that
 * redirect so the app can show the same sentence. Pure, so they can be tested.
 */
export function redirectOutcome(url: string, errors: Record<string, string>) {
  let params: Record<string, string> = {};
  try {
    const parsed = new URL(url, "https://app.invalid");
    params = Object.fromEntries(parsed.searchParams.entries());
  } catch {
    return { error: null, code: null, params };
  }
  const code = params.error ?? null;
  if (!code) return { error: null, code: null, params };
  const error = errors[code] ?? params.message ?? "Something went wrong. Please try again.";
  return { error, code, params };
}

export type Outcome = { ok: true; saved: string | null; message: string | null } | { ok: false; error: string };

export type OutcomeMessages = {
  saved: Record<string, string>;
  /** The sentence for an error code, given the ?message= that some codes carry. */
  error: (code: string, message?: string) => string | null;
};

/** The query parameters of a redirect such as /members/business?saved=seat. */
export function redirectParams(url: string | null | undefined) {
  if (!url) return new URLSearchParams();
  const q = url.indexOf("?");
  return new URLSearchParams(q === -1 ? "" : url.slice(q + 1).split("#")[0]);
}

/** What a redirect from a server action means, in the website's own words. */
export function outcomeFromRedirect(url: string | null | undefined, messages: OutcomeMessages): Outcome {
  const params = redirectParams(url);
  const error = params.get("error");
  if (error) {
    return { ok: false, error: messages.error(error, params.get("message") ?? undefined) ?? "Something went wrong. Please try again." };
  }
  const saved = params.get("saved");
  return { ok: true, saved, message: saved ? (messages.saved[saved] ?? null) : null };
}

/** The id after a path prefix, e.g. the referral id in /members/referrals/abc?sent=1. */
export function idAfter(url: string | null | undefined, prefix: string) {
  if (!url?.startsWith(prefix)) return null;
  const rest = url.slice(prefix.length).split(/[?#]/)[0];
  return /^[A-Za-z0-9_-]+$/.test(rest) ? rest : null;
}
