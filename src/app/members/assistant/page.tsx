import { redirect } from "next/navigation";
import { AssistantChat } from "@/components/assistant/Chat";
import { MemberPage } from "@/components/members/MemberPage";
import { Paywall, ProfessionalUpsell } from "@/components/members/Paywall";
import { getMemberContext } from "@/lib/member";

export const metadata = { title: "Assistant" };

export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/assistant");
  if (!ctx.allowed) return <Paywall title="The Assistant" body="The Assistant is part of Professional membership." href="/pricing#professional" cta="See Professional" />;

  if (!ctx.professional) {
    return (
      <MemberPage size="narrow">
        <p className="label text-muted-foreground">Assistant</p>
        <h1 className="display mt-3 mb-8 text-[2.5rem] sm:text-5xl">A second pair of eyes, for professionals</h1>
        <ProfessionalUpsell
          title="The Assistant comes with Professional"
          body="It helps qualified practitioners structure a consultation, think through referral routes and draft client notes, drawing on the Trichollective library. It supports your judgement and never replaces it."
          points={[
            "Referral routes across cosmetic, clinical and medical practice",
            "Consultation structure and red flags to look out for",
            "Drafts of client-education notes and referral letters",
            "Answers grounded in our reviewed library",
          ]}
        />
      </MemberPage>
    );
  }

  const { q } = await searchParams;
  const configured = !!process.env.AI_GATEWAY_API_KEY;

  return (
    <div className="flex flex-col">
      {!configured && (
        <p className="border-b border-rule bg-paper-2 px-4 py-3 text-center text-sm text-ink-2">
          The Assistant isn&apos;t connected yet, so replies won&apos;t arrive. Everything else here is ready.
        </p>
      )}
      <AssistantChat initialPrompt={q} profession={ctx.profession} />
    </div>
  );
}
