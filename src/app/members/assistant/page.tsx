import { redirect } from "next/navigation";
import { AssistantChat } from "@/components/assistant/Chat";
import { Paywall } from "@/components/members/Paywall";
import { getMemberContext } from "@/lib/member";

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await getMemberContext();
  if (!ctx.session) redirect("/login");
  if (!ctx.allowed) {
    return (
      <Paywall
        title="Unlock Tricho-AI"
        body="The clinical assistant is included with membership."
      />
    );
  }

  const { q } = await searchParams;
  const configured = !!process.env.AI_GATEWAY_API_KEY;

  return (
    <div>
      {!configured && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          Tricho-AI is not connected yet. Set AI_GATEWAY_API_KEY to enable live responses. The
          interface below is ready.
        </div>
      )}
      <AssistantChat initialPrompt={q} profession={ctx.profession} />
    </div>
  );
}
