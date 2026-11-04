import { prisma } from "@/lib/prisma";
import { getStaff } from "@/lib/staff";
import { readStoredFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Material an educator sent with a tailored course request, for the team only. */
export async function GET(_req: Request, { params }: { params: Promise<{ requestId: string; fileId: string }> }) {
  const staff = await getStaff();
  if (!staff?.perms.has("courses.view")) return new Response("Not found", { status: 404 });
  const { requestId, fileId } = await params;
  const request = await prisma.courseRequest.findUnique({ where: { id: requestId }, select: { fileIds: true } });
  if (!request?.fileIds.includes(fileId)) return new Response("Not found", { status: 404 });
  const file = await readStoredFile(fileId);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `inline; filename="${(file.name ?? "material.pdf").replace(/[^\w.\- ]/g, "")}"`,
    },
  });
}
