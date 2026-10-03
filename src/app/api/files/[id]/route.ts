import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStaff } from "@/lib/staff";
import { signedUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Serves uploaded files. Public files (logos, photos) are open to everyone;
 * private documents only to the person who uploaded them and the team.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = await prisma.storedFile.findUnique({ where: { id } });
  if (!file) return new Response("Not found", { status: 404 });

  if (!file.isPublic) {
    const session = await auth();
    const isOwner = !!session?.user?.id && session.user.id === file.ownerId;
    const staff = isOwner ? null : await getStaff();
    if (!isOwner && !staff?.perms.has("verification.review")) {
      return new Response("Not found", { status: 404 });
    }
  }

  if (file.driver === "supabase") {
    const url = file.isPublic
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/storage/v1/object/public/${file.bucket}/${file.path}`
      : await signedUrl(file);
    if (!url) return new Response("Not found", { status: 404 });
    return Response.redirect(url, 302);
  }

  if (!file.data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": file.isPublic ? "public, max-age=31536000, immutable" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
      ...(file.contentType === "application/pdf" && file.name
        ? { "Content-Disposition": `inline; filename="${file.name.replace(/[^\w.\- ]/g, "")}"` }
        : {}),
    },
  });
}
