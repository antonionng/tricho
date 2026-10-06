import { body, withMember } from "@/lib/mobile/api";
import { countPerkViews } from "@/app/members/perks/_data";

/** The app sends the perk ids once it has shown them, like the website's perks page. */
export const POST = withMember(
  async (req) => {
    const { ids } = await body<{ ids: string[] }>(req);
    await countPerkViews(ids, req.headers.get("user-agent"));
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  },
  { members: true }
);
