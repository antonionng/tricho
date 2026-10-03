import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Paywall } from "@/components/members/Paywall";
import { Card, EmptyState, MemberPage, PageHeader } from "@/components/members/MemberPage";
import { getMemberContext } from "@/lib/member";
import { referralBlocker } from "@/lib/client-referrals";
import { shortName } from "@/lib/names";
import { loadRecipient } from "../_data";
import { ReferralForm } from "./ReferralForm";

export const metadata = { title: "Refer a client" };

export default async function NewReferralPage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const { to = "" } = await searchParams;
  const ctx = await getMemberContext();
  const me = ctx.session?.user?.id;
  if (!me) redirect(`/login?next=${encodeURIComponent(`/members/referrals/new?to=${to}`)}`);
  if (!ctx.allowed) return <Paywall title="Referrals" body="Referring clients to colleagues is part of membership." />;
  if (!ctx.professional) {
    return (
      <Paywall
        title="Referrals are part of Professional membership."
        body="Professional members can refer clients to trusted colleagues across the network, and hear back when the referral is accepted."
        cta="See the Professional plan"
      />
    );
  }

  const recipient = await loadRecipient(to.slice(0, 64));
  const blocker = referralBlocker({ id: me, professional: ctx.professional }, recipient);
  const name = recipient?.name || "this member";
  const short = shortName(recipient?.name, "your colleague");

  return (
    <MemberPage size="narrow">
      <Link
        href={recipient ? `/members/people/${recipient.id}` : "/members/people"}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> {recipient ? `Back to ${name}` : "Back to people"}
      </Link>
      <PageHeader
        label="Referrals"
        title={`Refer a client to ${name}.`}
        lede={`Send ${short} a short summary of what your client needs. They can read it, accept or decline, and message you to arrange the introduction.`}
      />

      {blocker || !recipient ? (
        <EmptyState
          title={blocker ?? "We could not find this member."}
          body="You can find another colleague who accepts referrals in the member directory."
          action={
            <Link href="/members/people" className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-paper">
              Find a colleague
            </Link>
          }
        />
      ) : (
        <>
          <Card className="mb-6 flex gap-3 p-5 text-sm leading-relaxed text-ink-2">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ink" aria-hidden />
            <div className="space-y-2">
              <p className="font-medium text-ink">A referral describes the concern, never the person.</p>
              <p>
                Please do not include the client&apos;s name, date of birth, address, email, phone number or photographs. Once {short} accepts,
                you can introduce the client directly with their consent.
              </p>
              <p>
                Only {short} and you can read the summary. The Trichollective team can see that a referral was made, and only opens the summary
                if there is a safety or moderation concern.
              </p>
            </div>
          </Card>
          <ReferralForm toId={recipient.id} toName={short} />
        </>
      )}
    </MemberPage>
  );
}
