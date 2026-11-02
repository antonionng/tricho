import { guideBySlug, guides } from "@/content/guides";
import { guideMarkdown, markdownResponse } from "@/lib/llms";

/** Served at /guides/<slug>.md through a rewrite in next.config.ts. */
export const dynamicParams = false;

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const g = guideBySlug((await params).slug);
  if (!g) return new Response("Not found", { status: 404 });
  return markdownResponse(guideMarkdown(g), `/guides/${g.slug}`);
}
