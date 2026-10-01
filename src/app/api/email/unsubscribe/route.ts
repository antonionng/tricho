import { NextResponse } from "next/server";
import { isEmailList, leaveList, verifyUnsubscribeToken } from "@/lib/mail/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function params(req: Request) {
  const q = new URL(req.url).searchParams;
  return { email: (q.get("e") ?? "").toLowerCase(), list: q.get("l"), token: q.get("t") ?? "" };
}

/**
 * One-click unsubscribe (RFC 8058). Mail apps POST here from the
 * List-Unsubscribe header, without showing the person a page.
 */
export async function POST(req: Request) {
  const { email, list, token } = params(req);
  if (!email || !isEmailList(list) || !verifyUnsubscribeToken(email, list, token)) {
    return NextResponse.json({ error: "This unsubscribe link isn't valid." }, { status: 400 });
  }
  await leaveList(email, list);
  return NextResponse.json({ ok: true });
}

/** Someone opening the header link in a browser gets the page that asks them to confirm. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  return NextResponse.redirect(new URL(`/email/unsubscribe${url.search}`, url), 303);
}
