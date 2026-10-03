import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission } from "@/lib/staff";
import { generationRunning, runEditionGeneration } from "@/agents/gazette-edition";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Writes the edition's outline and any pages still waiting to be written.
 * Safe to call again: it carries on from where the last run stopped, and a
 * second request while one is running waits for the same run.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let staff;
  try {
    staff = await requirePermission("gazette.edit");
  } catch (error) {
    return NextResponse.json({ ok: false, message: (error as Error).message }, { status: 403 });
  }
  const { id } = await params;
  const row = await prisma.gazetteEdition.findUnique({ where: { id }, select: { id: true, title: true, status: true } });
  if (!row) return NextResponse.json({ ok: false, message: "That edition no longer exists." }, { status: 404 });
  if (row.status === "published" || row.status === "scheduled") {
    return NextResponse.json({ ok: false, message: "Withdraw the edition before generating pages for it." }, { status: 409 });
  }

  const joining = generationRunning(id);
  if (!joining && row.status !== "generating") {
    await prisma.gazetteEdition.update({ where: { id }, data: { status: "generating" } });
  }
  const result = await runEditionGeneration(id);
  if (!joining) {
    await audit(staff, {
      action: "gazette.generate",
      targetType: "gazette_edition",
      targetId: id,
      summary: `Generated pages for the Trichozette edition "${row.title}". ${result.message}`,
      after: { written: result.written, failed: result.failed },
    });
  }
  revalidatePath(`/studio/gazette/${id}`);
  revalidatePath("/studio/gazette");
  return NextResponse.json(result);
}
