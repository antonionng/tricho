import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { auth } from "@/auth";
import { devMembershipUnlock, getMembershipByEmail } from "@/lib/subscription";
import { TRICHO_AI_MODEL, TRICHO_AI_SYSTEM_PROMPT } from "@/lib/ai/prompt";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const membership = await getMembershipByEmail(session.user.email);
  if (!membership.isActive && !devMembershipUnlock()) {
    return new Response("Active membership required", { status: 402 });
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    return new Response(
      "Tricho-AI is not configured. Set AI_GATEWAY_API_KEY to enable it.",
      { status: 503 }
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: TRICHO_AI_MODEL,
    system: TRICHO_AI_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
