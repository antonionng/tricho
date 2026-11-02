import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/staff";
import { runBlogWriter } from "@/agents/blog-writer";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Runs the AI writer for as many steps as fit in one request. The editor calls
 * this again until the post is done; every step is saved, so nothing is lost.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("gazette.edit");
  } catch (error) {
    return NextResponse.json({ ok: false, done: false, message: (error as Error).message }, { status: 403 });
  }
  const { id } = await params;
  const result = await runBlogWriter(id);
  revalidatePath(`/studio/blog/${id}`);
  revalidatePath("/studio/blog");
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
