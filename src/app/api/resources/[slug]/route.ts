import { NextResponse } from "next/server";
import { getMemberContext } from "@/lib/member";
import { resourceBySlug } from "@/content/resources";
import { buildResourcePdf } from "@/lib/resource-pdf";

export const dynamic = "force-dynamic";

/**
 * A practice resource as a PDF, for members. Rendered on request from the content in
 * src/content/resources.ts, so there are no files to keep in step. `?view=1` opens it in the
 * browser instead of downloading.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = resourceBySlug(slug);
  if (!resource) return new NextResponse("Not found", { status: 404 });

  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) {
    return NextResponse.redirect(new URL(`/login?next=/members/resources`, req.url));
  }
  if (!ctx.allowed) {
    return NextResponse.redirect(new URL(`/members/resources`, req.url));
  }

  const bytes = await buildResourcePdf(resource);
  const view = new URL(req.url).searchParams.get("view") === "1";
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${view ? "inline" : "attachment"}; filename="${resource.filename}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
