import { NextResponse } from "next/server";
import { getAgent } from "@/agents";
import { runAgent } from "@/agents/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Vercel Cron calls this with "Authorization: Bearer $CRON_SECRET". */
export async function GET(req: Request, { params }: { params: Promise<{ agent: string }> }) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { agent } = await params;
  if (!getAgent(agent)) {
    return NextResponse.json({ error: `No agent called "${agent}".` }, { status: 404 });
  }

  const outcome = await runAgent(agent, "cron");
  return NextResponse.json(outcome, { status: outcome.status === "failed" ? 500 : 200 });
}
