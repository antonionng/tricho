import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStaff } from "@/lib/staff";
import { continueDraftRun } from "@/agents/course-drafter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Carries an AI course draft forward. Only the person who started it, or the team, can. */
export async function POST(_req: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, message: "Please sign in." }, { status: 401 });
  const run = await prisma.aiDraftRun.findUnique({ where: { id: runId }, select: { userId: true } });
  if (!run) return NextResponse.json({ ok: false, message: "That draft no longer exists." }, { status: 404 });
  if (run.userId !== session.user.id) {
    const staff = await getStaff();
    if (!staff?.perms.has("courses.edit")) return NextResponse.json({ ok: false, message: "That draft isn't yours." }, { status: 404 });
  }
  return NextResponse.json(await continueDraftRun(runId));
}
