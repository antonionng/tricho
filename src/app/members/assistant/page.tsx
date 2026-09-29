import { redirect } from "next/navigation";
import { AssistantChat } from "@/components/assistant/Chat";
import { Paywall } from "@/components/members/Paywall";
import { getMemberContext } from "@/lib/member";

export default async function AssistantPage() {
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

  return <AssistantChat />;
}
