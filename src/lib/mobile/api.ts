import "server-only";
import { NextResponse } from "next/server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getURLFromRedirectError } from "next/dist/client/components/redirect";
import { getMemberContext, type MemberContext } from "@/lib/member";

/**
 * Helpers for /api/mobile/v1. Every route answers JSON. A member is found from
 * the bearer token through auth(), so getMemberContext() and the website's
 * server actions work unchanged.
 */

export const json = <T,>(data: T, init?: number | ResponseInit) =>
  NextResponse.json(data, typeof init === "number" ? { status: init } : init);

export const fail = (status: number, error: string, extra?: Record<string, unknown>) =>
  NextResponse.json({ error, ...extra }, { status });

export type SignedIn = MemberContext & { session: NonNullable<MemberContext["session"]> };

type Handler<P> = (req: Request, ctx: SignedIn, params: P) => Promise<Response>;

/**
 * Runs a handler for a signed-in member. Pass `members: true` for areas that need
 * an active membership, which answers 402 so the app can show the paywall.
 */
export function withMember<P = Record<string, string>>(handler: Handler<P>, opts: { members?: boolean } = {}) {
  return async (req: Request, route: { params: Promise<P> }) => {
    try {
      const ctx = await getMemberContext();
      if (!ctx.session?.user?.id) return fail(401, "Please sign in again.");
      if (ctx.restricted && ctx.restricted.status !== "muted") {
        return fail(403, ctx.restricted.status === "banned" ? "This account has been closed." : "This account is paused for now.", {
          restricted: ctx.restricted,
        });
      }
      if (opts.members && !ctx.allowed) return fail(402, "This part of Trichollective is for members.");
      return await handler(req, ctx as SignedIn, (await route.params) ?? ({} as P));
    } catch (error) {
      console.error("[mobile-api]", req.method, new URL(req.url).pathname, error);
      return fail(500, "Something went wrong. Please try again.");
    }
  };
}

/** Request body as JSON, or an empty object. */
export async function body<T = Record<string, unknown>>(req: Request): Promise<Partial<T>> {
  try {
    const value = await req.json();
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

/** A FormData built from plain fields, for calling the website's server actions. */
export function formData(fields: Record<string, unknown>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) value.forEach((v) => fd.append(key, String(v)));
    else if (value instanceof Blob) fd.append(key, value);
    else fd.append(key, String(value));
  }
  return fd;
}

/**
 * Calls a server action and turns its outcome into a response. A redirect from
 * the action becomes { ok: true, redirect } so the app can follow the same path.
 */
export async function runAction<T>(fn: () => Promise<T>) {
  try {
    const result = await fn();
    if (result && typeof result === "object" && "error" in result && (result as { error?: unknown }).error) {
      return json({ ok: false, ...(result as object) }, 400);
    }
    return json({ ok: true, ...(result && typeof result === "object" ? result : { result }) });
  } catch (error) {
    if (isRedirectError(error)) return json({ ok: true, redirect: getURLFromRedirectError(error) });
    throw error;
  }
}

/** Cursor pagination: ?cursor=<id>&limit=<n>, capped at 50. */
export function page(req: Request, fallback = 20) {
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || fallback, 1), 50);
  return { cursor: url.searchParams.get("cursor") || undefined, limit, url };
}
