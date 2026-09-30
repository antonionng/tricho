import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { getMemberContext } from "@/lib/member";
import { searchListings, isClaimed } from "@/lib/directory";
import { assistantSystemPrompt, TRICHO_AI_MODEL, type AssistantMode } from "@/lib/ai/prompt";

export const maxDuration = 60;

const MODES: AssistantMode[] = ["referral", "ask", "write"];

export async function POST(req: Request) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!ctx.allowed || !ctx.professional) {
    return new Response("The Assistant is part of the Professional plan.", { status: 402 });
  }
  if (!process.env.AI_GATEWAY_API_KEY) {
    return new Response(
      "The Assistant isn't switched on yet. Set AI_GATEWAY_API_KEY to enable it.",
      { status: 503 }
    );
  }

  const body: { messages: UIMessage[]; mode?: string } = await req.json();
  const mode = MODES.includes(body.mode as AssistantMode) ? (body.mode as AssistantMode) : "referral";

  const result = streamText({
    model: TRICHO_AI_MODEL,
    system: assistantSystemPrompt(mode),
    messages: await convertToModelMessages(body.messages),
    stopWhen: stepCountIs(4),
    tools: {
      searchDirectory: tool({
        description:
          "Search the Trichollective directory for listed professionals. Use it to suggest real people to refer to.",
        inputSchema: z.object({
          discipline: z.enum(["cosmetic", "clinical", "medical"]),
          city: z.string().optional().describe("Town or city, if the member mentioned one"),
          query: z.string().optional().describe("Specialism keywords, e.g. 'alopecia' or 'head spa'"),
        }),
        execute: async ({ discipline, city, query }) => {
          let results = await searchListings({ discipline, city, q: query, take: 6 });
          if (results.length === 0 && city) results = await searchListings({ discipline, q: query, take: 6 });
          return results.map((l) => ({
            name: l.name,
            city: l.city,
            specialism: l.headline || l.specialization,
            verified: l.isVerified,
            acceptsReferrals: l.acceptsReferrals,
            fullProfile: isClaimed(l),
            profileUrl: l.slug ? `/directory/p/${l.slug}` : null,
          }));
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
