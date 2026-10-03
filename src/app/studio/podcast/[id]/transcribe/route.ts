import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/staff";
import { transcribeEpisode } from "@/agents/podcast";

/** Long episodes take a while to transcribe, so this route waits for as long as the platform allows. */
export const maxDuration = 800;
export const dynamic = "force-dynamic";

function back(request: Request, id: string, notice: string, danger: boolean) {
  const url = new URL(`/studio/podcast/${id}`, request.url);
  url.searchParams.set("tab", "transcript");
  url.searchParams.set("notice", notice);
  if (danger) url.searchParams.set("tone", "danger");
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let staff;
  try {
    staff = await requirePermission("podcast.edit");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Not allowed." }, { status: 403 });
  }
  const episode = await prisma.podcastEpisode.findUnique({ where: { id }, select: { title: true } });
  if (!episode) return NextResponse.json({ error: "That episode no longer exists." }, { status: 404 });

  const result = await transcribeEpisode(id);
  await audit(staff, {
    action: result.ok ? "podcast.transcribe" : "podcast.transcribe_failed",
    targetType: "podcast",
    targetId: id,
    summary: `Transcribed "${episode.title}". ${result.message}`,
  });
  revalidatePath(`/studio/podcast/${id}`);
  revalidatePath("/podcast", "layout");
  return back(request, id, result.message, !result.ok);
}
