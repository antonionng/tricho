import { countPerkViews } from "@/app/members/perks/_data";

/**
 * Counts each perk a member has been shown on the Member perks page. The page sends
 * the partner ids once from the browser after it has loaded, so prefetches are not counted.
 */
export async function POST(req: Request) {
  if (req.headers.get("sec-fetch-site") === "cross-site") return new Response(null, { status: 204 });
  const body = (await req.json().catch(() => null)) as { ids?: unknown } | null;
  await countPerkViews(body?.ids, req.headers.get("user-agent"));
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
